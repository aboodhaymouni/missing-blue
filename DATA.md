# Where the data is · وين الداتا

**بالعربي باختصار:**

- التطبيق ما بيقرأ الداتا الخام أبدًا. بيقرأ بس ملفات جاهزة داخل المستودع، وأغلبها في `src/data/` و`public/imagery/`.
- الداتا الخام موجودة برّا المستودع:
  - مجموعة FORCAST على `C:\xampp\htdocs\FORCAST\water`، وحجمها حوالي 1.9 جيجا.
  - كاش صور الأقمار على `D:\forcast\water`، وحجمه حوالي 15 جيجا.
- سكربتات `scripts/` بتحوّل الداتا الخام لملفات التطبيق.
- لما تنقلوا الداتا لريبو ثاني، غيّروا مكان الداتا الخام من متغيّرات البيئة تحت (ما في داعي تعدّلوا الكود)، وشغّلوا السكربتات من جديد.

## 1. Data the app ships (in this repo)

| Path | What it is | Made by | Read by |
|---|---|---|---|
| `src/data/generated/dashboard.json` (~0.6 MB) | Dashboard numbers: totals, NRW by governorate, enforcement, Disi attacks, theft and supply news registers, the 15 data domains | `scripts/build_dashboard_data.py` | `src/app/dash.ts` (Overview, Data library) |
| `src/data/generated/library.json` (~0.7 MB) | Every source (897) and fact (515) with status and link | `scripts/build_dashboard_data.py` | `src/app/dash.ts`, loaded on demand by the Data library |
| `src/data/generated/sites.json` | Ranked candidate sites: Qatrana 14, Mudawwara 8; score, area, distance, yearly NDVI | `scripts/build_sites.py` | `src/lib/store.tsx` (map, overview) |
| `src/data/generated/demo_route.json` | The **illustrative** route: Desert and valley highway centrelines, **not** a pipeline | `scripts/build_sites.py` | `src/app/MapView.tsx` |
| `src/data/generated/stats.json` | Counts for the landing page's data section | `scripts/build_stats.py` | `src/landing/Sections.tsx` |
| `src/data/imagery/*.json` | Corner coordinates of each Sentinel-2 crop, plus patch statistics | `scripts/render_imagery.py`, `scripts/detect_patches.py` | `src/app/MapView.tsx`, landing hero |
| `public/imagery/*.webp`, `*.png` | Sentinel-2 true-colour crops 2017 → 2025 and change overlays | `scripts/render_imagery.py` | Map and landing page |
| `public/imagery/sites/*.webp` | Before and after chips for each site | `scripts/build_sites.py` | Site evidence cards |
| `src/data/facts.ts`, `src/data/sources.ts` | Checked facts, each with its source (hand-written) | by hand | Landing, overview, business model |
| `src/data/business.ts` | Business model content and calculator defaults (hand-written) | by hand | `/bmc`, `/bmc/poster` |
| `src/data/reports.ts` | Synthetic crew reports for the demo | by hand | Console, crew app |
| `src/data/eval-set.ts` | 35 hand-labelled synthetic reports (10 development, 25 held-out) | by hand | Evaluation page, `src/lib/extract/score.ts` |
| `public/video/missing-blue-intro.mp4` | Intro video (web copy); the 1080p master is in the v1.0 release | `video/` | Landing, README |
| `video/public/` | Video assets: narration, music, sound effects, imagery copy, fonts | `video/tools/` | `video/src/` |
| `docs/media/` | README screenshots and video poster | screenshots | README |

## 2. Raw data (outside this repo)

| Input | Default location | Used by | Override |
|---|---|---|---|
| The team's water collection: per-domain source and fact catalogs, news registers, derived corridors (`derived/corridors/demo_illustrative.gpkg`) | `C:/xampp/htdocs/FORCAST/water` | `build_dashboard_data.py`, `build_stats.py`, `build_sites.py` | `MB_WATER_DATA` |
| The large half of the collection on drive D (counted for files and sizes per domain) | `D:/forcast/water` | `build_dashboard_data.py` | `MB_DATA_DRIVE` |
| Sentinel-2 L2A imagery cache | `D:/forcast/water/imagery` | `render_imagery.py`, `detect_patches.py`, `build_sites.py` | `MB_IMAGERY` |
| Copernicus DEM tiles | `D:/forcast/water/climate_terrain_pop/**` | `build_stats.py` (path still fixed in the script) | edit the script |

Python 3 with `numpy`, `scipy`, `rasterio`, `pyogrio`, `pyproj`, `shapely` and `Pillow`.

## 3. Moving the data to its own repository

1. Put the raw collection and the imagery cache in the data repository. Imagery is large, so use Git LFS or release assets for it.
2. Clone the data repository anywhere. You can put it in [`data/`](data/) inside this repo, which is reserved for that and ignored by git apart from its README.
3. Point the scripts at it, for example:

   ```bash
   MB_WATER_DATA=data/water MB_IMAGERY=data/imagery python scripts/build_dashboard_data.py
   ```

4. Rebuild the generated files, then check:

   ```bash
   npm run build
   npm test
   ```

Restricted geodata (real pipeline routes, wells, reservoirs, pumping stations) stays out of both repositories. The only line on the map is the illustrative highway proxy above.
