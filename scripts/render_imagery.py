"""Render real Sentinel-2 true-colour crops (and an NDVI-change overlay) for the web app.

Inputs: harmonised 10 m band GeoTIFFs written by the FORCAST water imagery collector
(DN = reflectance * 10000 + 1000 for every year). Outputs go to public/imagery/.
Run:  python -I scripts/render_imagery.py
"""
import json, os, sys
import numpy as np
import rasterio
from rasterio.warp import transform as warp_transform
from PIL import Image, ImageFilter

# Inputs live outside this repo; see DATA.md. Override with MB_WATER_DATA / MB_DATA_DRIVE / MB_IMAGERY.
SRC = os.environ.get('MB_IMAGERY', 'D:/forcast/water/imagery')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'imagery')
META = os.path.join(ROOT, 'src', 'data', 'imagery')
os.makedirs(OUT, exist_ok=True)


def band(aoi, date, b):
    with rasterio.open(f'{SRC}/{aoi}/{date}/{aoi}_{date}_{b}.tif') as s:
        a = s.read(1).astype('float32')
        return np.where(a > 0, (a - 1000.0) / 10000.0, np.nan), s.transform, s.crs


def ndvi(aoi, date):
    r, _, _ = band(aoi, date, 'B04'); n, _, _ = band(aoi, date, 'B08')
    return (n - r) / (n + r + 1e-6)


def rgb(aoi, date, lo, hi, window):
    (r0, r1), (c0, c1) = window
    chans = []
    for i, b in enumerate(['B04', 'B03', 'B02']):
        a, _, _ = band(aoi, date, b)
        a = a[r0:r1, c0:c1]
        x = np.clip((a - lo[i]) / (hi[i] - lo[i]), 0, 1)
        chans.append(np.nan_to_num(x ** (1 / 1.25)))
    img = np.dstack(chans)
    # gentle saturation lift so vegetation reads at small sizes (same factor for every year)
    grey = img.mean(axis=2, keepdims=True)
    img = np.clip(grey + (img - grey) * 1.35, 0, 1)
    return Image.fromarray((img * 255).astype('uint8'))


def joint_stretch(aoi, dates, window):
    """One stretch for all three bands and both dates, so colour balance stays natural and years stay comparable."""
    (r0, r1), (c0, c1) = window
    vals = []
    for b in ['B04', 'B03', 'B02']:
        for d in dates:
            v = band(aoi, d, b)[0][r0:r1, c0:c1].ravel()
            vals.append(v[np.isfinite(v)])
    v = np.concatenate(vals)
    lo = float(np.percentile(v, 0.3)); hi = float(np.percentile(v, 99.8))
    return [lo, lo, lo], [hi, hi, hi]


def corners_lonlat(transform, crs, window):
    (r0, r1), (c0, c1) = window
    xs, ys = [], []
    for r, c in [(r0, c0), (r0, c1), (r1, c1), (r1, c0)]:  # TL, TR, BR, BL (MapLibre image source order)
        x, y = transform * (c, r)
        xs.append(x); ys.append(y)
    lon, lat = warp_transform(crs, 'EPSG:4326', xs, ys)
    return [[round(a, 6), round(b, 6)] for a, b in zip(lon, lat)]


def change_overlay(aoi, before, after, window, thr=0.18):
    (r0, r1), (c0, c1) = window
    d = (ndvi(aoi, after) - ndvi(aoi, before))[r0:r1, c0:c1]
    m = np.nan_to_num(d) > thr
    a = np.zeros((m.shape[0], m.shape[1], 4), dtype='uint8')
    a[m] = (42, 155, 255, 230)            # signal blue for new vegetation / wetness
    img = Image.fromarray(a, 'RGBA')
    edge = img.filter(ImageFilter.MaxFilter(5))  # soft halo so 1–3 px patches stay visible
    halo = np.asarray(edge).copy(); halo[..., 3] = (halo[..., 3] * 0.35).astype('uint8')
    base = Image.fromarray(halo, 'RGBA'); base.alpha_composite(img)
    return base, int(m.sum())


def render(name, aoi, before, after, window=None, scale=1.0, overlay=True, label=None):
    _, tr, crs = band(aoi, after, 'B04')
    if window is None:
        h, w = band(aoi, after, 'B04')[0].shape
        window = ((0, h), (0, w))
    lo, hi = joint_stretch(aoi, [before, after], window)
    out = {}
    for tag, d in [('before', before), ('after', after)]:
        im = rgb(aoi, d, lo, hi, window)
        if scale != 1.0:
            im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
        p = f'{OUT}/{name}-{d[:4]}.webp'
        im.save(p, 'WEBP', quality=86, method=6)
        out[tag] = {'date': d, 'file': f'imagery/{os.path.basename(p)}', 'px': [im.width, im.height]}
    if overlay:
        ov, n = change_overlay(aoi, before, after, window)
        if scale != 1.0:
            ov = ov.resize((int(ov.width * scale), int(ov.height * scale)), Image.NEAREST)
        p = f'{OUT}/{name}-change.png'; ov.save(p, optimize=True)
        out['change'] = {'file': f'imagery/{os.path.basename(p)}', 'pixels_ndvi_gain_gt_0_18': n}
    meta = {
        'name': name, 'label': label, 'aoi': aoi, 'crs': str(crs), 'window_rows_cols': window,
        'corners_lonlat_tl_tr_br_bl': corners_lonlat(tr, crs, window),
        'size_km': [round((window[1][1] - window[1][0]) * 10 / 1000, 2), round((window[0][1] - window[0][0]) * 10 / 1000, 2)],
        'source': 'Copernicus Sentinel-2 L2A via Earth Search (AWS), harmonised DN-1000; true colour B04/B03/B02, joint stretch',
        'attribution': 'Contains modified Copernicus Sentinel data ' + before[:4] + '–' + after[:4],
        **out,
    }
    with open(f'{META}/{name}.json', 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
    print(name, json.dumps({k: meta[k] for k in ('size_km', 'corners_lonlat_tl_tr_br_bl')}), out.get('change'))


if __name__ == '__main__':
    # Locate the new pivots in aoi-05 to centre a crop on them.
    d = np.nan_to_num(ndvi('aoi-05', '2024-08-09') - ndvi('aoi-05', '2017-08-11'))
    rr, cc = np.where(d > 0.25)
    print('aoi-05 gain pixels', len(rr), 'rows', rr.min(), rr.max(), 'cols', cc.min(), cc.max())
    r_mid, c_mid = int(np.median(rr)), int(np.median(cc))
    H, W = d.shape
    h, w = 900, 1200
    r0 = max(0, min(H - h, r_mid - h // 2)); c0 = max(0, min(W - w, c_mid - w // 2))
    render('mudawwara', 'aoi-05', '2017-08-11', '2024-08-09', window=((r0, r0 + h), (c0, c0 + w)), label='Mudawwara desert farms (positive control)')
    render('mudawwara-wide', 'aoi-05', '2017-08-11', '2024-08-09', scale=0.6, label='Mudawwara AOI, full extent')
    render('qatrana', 'aoi-01', '2017-08-11', '2025-08-06', scale=0.6, label='Desert segment near Qatrana (Disi corridor area)')


def render_hero():
    """Wide 16:9 native-resolution crop of the Mudawwara AOI for the full-bleed hero."""
    d = np.nan_to_num(ndvi('aoi-05', '2024-08-09') - ndvi('aoi-05', '2017-08-11'))
    H, W = d.shape
    h = min(H, int(W * 9 / 16))
    rr, _ = np.where(d > 0.25)
    mid = int(np.median(rr))
    r0 = max(0, min(H - h, mid - h // 2))
    render('hero', 'aoi-05', '2017-08-11', '2024-08-09', window=((r0, r0 + h), (0, W)), overlay=False, label='Hero: Mudawwara, full width')


if __name__ == '__main__' and os.environ.get('MB_HERO') == '1':
    render_hero()
