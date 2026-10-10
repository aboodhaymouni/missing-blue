"""Build the console's candidate sites from REAL Sentinel-2 data.

For each AOI: detect new green patches (NDVI gain > 0.18 between the first and last dry-season date),
measure each one (area, NDVI per year, first year over threshold, WorldCover class, distance to the
ILLUSTRATIVE demo route, isolation), rank with the published formula, and cut native-resolution
before/after crops for the evidence cards.
Outputs: src/data/generated/sites.json, src/data/generated/demo_route.json, public/imagery/sites/*.webp
Run: python -I scripts/build_sites.py
"""
import json
import os

import numpy as np
import pyogrio
import rasterio
from PIL import Image
from pyproj import Transformer
from rasterio.warp import transform as warp_transform
from scipy import ndimage
from shapely.geometry import Point, mapping
from shapely.ops import transform as shp_transform

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Inputs live outside this repo; see DATA.md. Override with MB_WATER_DATA / MB_DATA_DRIVE / MB_IMAGERY.
SRC = os.environ.get('MB_IMAGERY', 'D:/forcast/water/imagery')
GEN = os.path.join(ROOT, 'src', 'data', 'generated')
CROPS = os.path.join(ROOT, 'public', 'imagery', 'sites')
os.makedirs(GEN, exist_ok=True)
os.makedirs(CROPS, exist_ok=True)
ROUTES = os.path.join(os.environ.get('MB_WATER_DATA', 'C:/xampp/htdocs/FORCAST/water'), 'derived', 'corridors', 'demo_illustrative.gpkg')
WC = {10: 'tree', 20: 'shrub', 30: 'grass', 40: 'cropland', 50: 'built', 60: 'bare', 70: 'snow', 80: 'water', 90: 'wetland', 95: 'mangrove', 100: 'moss'}


def band(aoi, date, b):
    with rasterio.open(f'{SRC}/{aoi}/{date}/{aoi}_{date}_{b}.tif') as s:
        a = s.read(1).astype('float32')
        return np.where(a > 0, (a - 1000) / 10000, np.nan), s.transform, s.crs


def ndvi(aoi, date):
    r, tr, crs = band(aoi, date, 'B04')
    n, _, _ = band(aoi, date, 'B08')
    return (n - r) / (n + r + 1e-6), tr, crs


def stretch(aoi, dates):
    vals = []
    for d in dates:
        for b in ('B04', 'B03', 'B02'):
            v = band(aoi, d, b)[0]
            vals.append(v[np.isfinite(v)][::7])
    v = np.concatenate(vals)
    return float(np.percentile(v, 0.3)), float(np.percentile(v, 99.8))


def rgb_crop(aoi, date, r, c, half, lo, hi):
    chans = []
    for b in ('B04', 'B03', 'B02'):
        a = band(aoi, date, b)[0]
        H, W = a.shape
        r0, r1, c0, c1 = max(0, r - half), min(H, r + half), max(0, c - half), min(W, c + half)
        x = np.clip((a[r0:r1, c0:c1] - lo) / (hi - lo), 0, 1) ** (1 / 1.25)
        chans.append(np.nan_to_num(x))
    img = np.dstack(chans)
    g = img.mean(axis=2, keepdims=True)
    img = np.clip(g + (img - g) * 1.3, 0, 1)
    return Image.fromarray((img * 255).astype('uint8')).resize((240, 240), Image.NEAREST)


def yearly_ndvi(aoi, mask, years):
    out = {}
    for y in years:
        p = f'{SRC}/{aoi}/composites/{aoi}_{y}_composite.tif'
        if not os.path.exists(p):
            continue
        with rasterio.open(p) as s:
            a = s.read(1).astype('float32')
        a[a == -128] = np.nan
        v = a[mask]
        out[str(y)] = None if not np.isfinite(v).any() else round(float(np.nanmean(v)) / 100, 3)
    return out


def run(key, aoi, dates, label, max_sites, thr=0.18, min_px=3):
    first, last = dates[0], dates[-1]
    n0, tr, crs = ndvi(aoi, first)
    n1, _, _ = ndvi(aoi, last)
    gain = np.nan_to_num(n1 - n0)
    mask = gain > thr
    lab, n = ndimage.label(mask)
    with rasterio.open(f'{SRC}/{aoi}/worldcover/{aoi}_worldcover_2021_v200.tif') as s:
        wc = s.read(1)
    routes = pyogrio.read_dataframe(ROUTES, layer='demo_routes')
    to_utm = Transformer.from_crs('EPSG:4326', crs, always_xy=True).transform
    route = shp_transform(to_utm, routes.geometry.iloc[0])
    lo, hi = stretch(aoi, [first, last])
    idx = list(range(1, n + 1))
    cents = ndimage.center_of_mass(mask, lab, idx)
    sizes = ndimage.sum(mask, lab, idx)
    dist_crop = ndimage.distance_transform_edt(wc != 40) * 10  # metres to nearest WorldCover cropland
    # distance from every pixel to the nearest detected pixel of ANOTHER patch: use the label map
    _, (ir, ic) = ndimage.distance_transform_edt(~mask, return_indices=True)
    patches = []
    for i, (cy, cx) in zip(idx, cents):
        sz = sizes[i - 1]
        if sz < min_px:
            continue
        r, c = int(round(cy)), int(round(cx))
        patches.append({'i': i, 'r': r, 'c': c, 'px': int(sz)})
    years = list(range(2017, 2027))
    rows = []
    centres = np.array([[p['r'], p['c']] for p in patches]) if patches else np.zeros((0, 2))
    for k, p in enumerate(patches):
        pm = lab == p['i']
        x, y = tr * (p['c'] + 0.5, p['r'] + 0.5)
        d_line = float(route.distance(Point(x, y)))
        if len(centres) > 1:
            dd = np.hypot(centres[:, 0] - p['r'], centres[:, 1] - p['c']) * 10
            dd[k] = np.inf
            near_other = float(dd.min())
        else:
            near_other = 5000.0
        iso = min(near_other, float(dist_crop[p['r'], p['c']]))
        wc_cls = WC.get(int(wc[p['r'], p['c']]), 'unknown')
        series = yearly_ndvi(aoi, pm, years)
        base = next((v for v in series.values() if v is not None), 0) or 0
        over = [yy for yy, v in series.items() if v is not None and v - base > thr]
        first_year = int(over[0]) if over else None
        persist = sum(1 for yy in ('2024', '2025', '2026') if yy in over)
        g = float(gain[pm].mean())
        area_ha = p['px'] * 100 / 10000
        near = max(0.0, 1 - min(d_line, 3000) / 3000)
        isol = min(1.0, iso / 1500)
        gn = min(1.0, g / 0.4)
        small = 1.0 if area_ha < 3 else 0.3 if area_ha < 10 else 0.0
        per = persist / 3 if series else 0.5
        score = 0.30 * near + 0.25 * isol + 0.20 * gn + 0.15 * per + 0.10 * small
        lon, lat = warp_transform(crs, 'EPSG:4326', [x], [y])
        rows.append({
            'aoi': key, 'lon': round(lon[0], 6), 'lat': round(lat[0], 6), 'area_ha': round(area_ha, 2), 'pixels': p['px'],
            'ndvi_first': round(float(np.nanmean(n0[pm])), 3), 'ndvi_last': round(float(np.nanmean(n1[pm])), 3), 'gain': round(g, 3),
            'ndvi_by_year': series, 'first_year_over_threshold': first_year, 'persist_last3': persist,
            'dist_line_m': round(d_line), 'isolation_m': round(iso), 'worldcover_2021': wc_cls,
            'score': round(score, 3),
            'parts': {'near_line': round(near, 2), 'isolation': round(isol, 2), 'gain': round(gn, 2), 'persistence': round(per, 2), 'small': small},
            '_rc': [p['r'], p['c']],
        })
    rows.sort(key=lambda r: -r['score'])
    rows = rows[:max_sites]
    for k, row in enumerate(rows, start=1):
        sid = f"{key[:3].upper()}-{k:02d}"
        row['id'] = sid
        row['rank'] = k
        r, c = row.pop('_rc')
        rgb_crop(aoi, first, r, c, 40, lo, hi).save(f'{CROPS}/{sid}-before.webp', 'WEBP', quality=88)
        rgb_crop(aoi, last, r, c, 40, lo, hi).save(f'{CROPS}/{sid}-after.webp', 'WEBP', quality=88)
        row['crop'] = {'before': f'imagery/sites/{sid}-before.webp', 'after': f'imagery/sites/{sid}-after.webp', 'before_date': first, 'after_date': last, 'size_m': 800}
    print(key, 'detected', len(patches), 'kept', len(rows))
    for r in rows[:8]:
        print('  ', r['id'], r['area_ha'], 'ha | line', r['dist_line_m'], 'm | iso', r['isolation_m'], '| wc', r['worldcover_2021'], '| first', r['first_year_over_threshold'], '| score', r['score'])
    return {'key': key, 'aoi': aoi, 'label': label, 'dates': dates, 'threshold': thr, 'sites': rows}


if __name__ == '__main__':
    out = {
        'note': 'Candidate sites from real Sentinel-2 L2A imagery (harmonised). Distances are to an ILLUSTRATIVE route (Desert Highway centreline proxy), not a real pipeline. Ranking = published formula: 0.30 near-line + 0.25 isolation + 0.20 NDVI gain + 0.15 persistence (2024-26) + 0.10 small size.',
        'aois': [
            run('qatrana', 'aoi-01', ['2017-08-11', '2025-08-06'], {'ar': 'مقطع صحراوي قرب القطرانة', 'en': 'Desert segment near Qatrana'}, 14),
            run('mudawwara', 'aoi-05', ['2017-08-11', '2024-08-09'], {'ar': 'المدوّرة (منطقة ضبط)', 'en': 'Mudawwara (control area)'}, 8, min_px=10),
        ],
    }
    with open(f'{GEN}/sites.json', 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    routes = pyogrio.read_dataframe(ROUTES, layer='demo_routes')
    fc = {'type': 'FeatureCollection', 'features': [
        {'type': 'Feature', 'properties': {'name': r['name'], 'note': r['note'], 'sensitivity': r['sensitivity']}, 'geometry': mapping(r.geometry)}
        for _, r in routes.iterrows()]}
    with open(f'{GEN}/demo_route.json', 'w', encoding='utf-8') as f:
        json.dump(fc, f)
    print('route features', len(fc['features']))
