"""Find new green patches in a rendered crop window (same window as render_imagery.py) and write
real per-patch numbers for the evidence cards: area, NDVI by year, first-seen window, centroid.
Run: python -I scripts/detect_patches.py
"""
import json, os
import numpy as np
from scipy import ndimage
import rasterio
from rasterio.warp import transform as warp_transform

SRC = 'D:/forcast/water/imagery'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'imagery')
META = os.path.join(ROOT, 'src', 'data', 'imagery')


def ndvi(aoi, date):
    def b(x):
        with rasterio.open(f'{SRC}/{aoi}/{date}/{aoi}_{date}_{x}.tif') as s:
            a = s.read(1).astype('float32'); return np.where(a > 0, (a - 1000) / 10000, np.nan), s.transform, s.crs
    r, tr, crs = b('B04'); n, _, _ = b('B08')
    return (n - r) / (n + r + 1e-6), tr, crs


def run(name, aoi, dates, thr=0.18, min_px=30):
    meta = json.load(open(f'{META}/{name}.json', encoding='utf-8'))
    (r0, r1), (c0, c1) = meta['window_rows_cols']
    stack = {}
    tr = crs = None
    for d in dates:
        v, tr, crs = ndvi(aoi, d)
        stack[d] = v[r0:r1, c0:c1]
    first, last = dates[0], dates[-1]
    gain = np.nan_to_num(stack[last] - stack[first])
    mask = gain > thr
    lab, n = ndimage.label(mask)
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    patches = []
    for i, sz in enumerate(sizes, start=1):
        if sz < min_px:
            continue
        rr, cc = np.where(lab == i)
        cy, cx = rr.mean(), cc.mean()
        nd = {d: round(float(np.nanmean(stack[d][rr, cc])), 3) for d in dates}
        # first window in which the patch's mean NDVI rose by > thr over the first date
        seen = None
        for d in dates[1:]:
            if nd[d] - nd[first] > thr:
                seen = f'{dates[dates.index(d) - 1][:4]}–{d[:4]}'
                break
        x, y = tr * (c0 + cx, r0 + cy)
        lon, lat = warp_transform(crs, 'EPSG:4326', [x], [y])
        patches.append({
            'px': [round(float(cx), 1), round(float(cy), 1)],
            'pct': [round(float(cx) / (c1 - c0) * 100, 2), round(float(cy) / (r1 - r0) * 100, 2)],
            'lonlat': [round(lon[0], 6), round(lat[0], 6)],
            'area_ha': round(float(sz) * 100 / 10000, 2),
            'radius_px': round(float(np.sqrt(sz / np.pi)), 1),
            'ndvi': nd, 'first_seen': seen,
            'gain': round(float(gain[rr, cc].mean()), 3),
        })
    patches.sort(key=lambda p: -p['area_ha'])
    out = {'name': name, 'aoi': aoi, 'dates': dates, 'threshold_ndvi_gain': thr, 'min_pixels': min_px, 'pixel_m': 10,
           'note': 'Real Sentinel-2 L2A NDVI (harmonised). Patch = connected pixels whose NDVI rose by more than the threshold between the first and last date.',
           'patches': patches}
    json.dump(out, open(f'{META}/{name}-patches.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(name, len(patches), 'patches;', [(p['area_ha'], p['first_seen'], p['pct']) for p in patches[:14]])


if __name__ == '__main__':
    run('mudawwara', 'aoi-05', ['2017-08-11', '2022-08-15', '2024-08-09'])
    run('qatrana', 'aoi-01', ['2017-08-11', '2021-08-08', '2025-08-06'], min_px=3)
