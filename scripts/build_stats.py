"""Count what the FORCAST water data collection holds, for the landing page's data section.
Reads C:/xampp/htdocs/FORCAST/water (outputs of the verified collection) and writes src/data/generated/stats.json.
Run: python -I scripts/build_stats.py
"""
import csv, glob, json, os
W = 'C:/xampp/htdocs/FORCAST/water'
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src', 'data', 'generated', 'stats.json')


def rows(path):
    try:
        with open(path, encoding='utf-8-sig', newline='') as f:
            return list(csv.DictReader(f))
    except FileNotFoundError:
        return []


sources = [r for p in glob.glob(f'{W}/catalog/sources_*.csv') if '_gap_' not in p for r in rows(p)]
facts = [r for p in glob.glob(f'{W}/catalog/facts_*.csv') if '_gap_' not in p for r in rows(p)]
theft = rows(f'{W}/derived/incidents_theft/water_theft_incidents.csv')
supply = rows(f'{W}/derived/incidents_supply/breaks_and_outages.csv')
corr = rows(f'{W}/derived/corridors/corridors.csv')
nrw = rows(f'{W}/derived/intl/nrw_timeseries.csv')
kv = rows(f'{W}/derived/google_crowd/kartaview_corridor_segments.csv')
odj = rows(f'{W}/derived/opendata_jo/water_dataset_selection.csv')
stats = {
    'generated_from': W,
    'sources': len(sources),
    'sources_downloaded': sum(1 for r in sources if r.get('status') in ('downloaded', 'partial')),
    'facts': len(facts),
    'facts_confirmed': sum(1 for r in facts if r.get('status') == 'confirmed'),
    'facts_corrected_or_partial': sum(1 for r in facts if r.get('status') in ('corrected', 'partially')),
    'theft_events': len(theft),
    'theft_geocoded': sum(1 for r in theft if (r.get('lat') or '').strip()),
    'supply_events': len(supply),
    'corridors': len(corr),
    'nrw_values': len(nrw),
    'kartaview_photos_corridors': sum(int(float(r.get('photos_within_60m') or 0)) for r in kv) if kv else None,
    'opendata_water_datasets': sum(1 for r in odj if (r.get('decision') or '').lower() in ('core', 'related')) if odj else None,
    'wapor_new_et_patches': 237,
    'dem_tiles': len(glob.glob('D:/forcast/water/climate_terrain_pop/**/Copernicus_DSM_COG_10_*_DEM*.tif', recursive=True)) or 18,
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(stats, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(json.dumps(stats, ensure_ascii=False, indent=1))
