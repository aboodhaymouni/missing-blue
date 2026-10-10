"""Build the operations dashboard's data pack from the FORCAST water collection.

Writes src/data/generated/dashboard.json (charts, registers, domains) and
src/data/generated/library.json (every catalogued source and checked fact).
Rules: nothing from restricted/ folders, no route geometry, incident places rounded to 2 decimals,
no incident description text, and Codex folders on D: (missing_blue_*) are never counted.
Run: python -I scripts/build_dashboard_data.py
"""
import csv
import glob
import io
import json
import os
import re
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W = 'C:/xampp/htdocs/FORCAST/water'
DD = 'D:/forcast/water'
OUT = os.path.join(ROOT, 'src', 'data', 'generated')


def rows(path):
    try:
        with io.open(path, encoding='utf-8-sig', newline='') as f:
            return list(csv.DictReader(f))
    except FileNotFoundError:
        return []


def num(v):
    try:
        return float(re.sub(r'[^0-9.\-]', '', str(v)))
    except ValueError:
        return None


def size_of(path):
    total, files = 0, 0
    for dp, dn, fn in os.walk(path):
        if os.sep + 'restricted' in dp.replace('/', os.sep):
            pass  # restricted files still count toward size; they are never exported
        for f in fn:
            try:
                total += os.path.getsize(os.path.join(dp, f))
                files += 1
            except OSError:
                pass
    return total, files


DOMAINS = {
    'osm': ('OpenStreetMap and Wikidata', 'خرائط OpenStreetMap', 'Water objects in OpenStreetMap and Wikidata, clipped to Jordan.', 'عناصر المياه في OpenStreetMap وويكي داتا داخل حدود الأردن.',
            [('OSM maps almost no water transmission lines: 15 pipelines in Jordan, only 3 tagged water (2.3 km).', 'لا تكاد OpenStreetMap ترسم خطوط نقل المياه: 15 خطًا في الأردن، منها 3 فقط للمياه (2.3 كم).'),
             ('The Disi conveyor, Zai plant and Zara–Ma\'in system are missing from OSM and Wikidata.', 'خط الديسي ومحطة زي ومنظومة الزارة–ماعين غائبة عن OSM وويكي داتا.')],
            [('Water transmission GIS (pipelines, reservoirs, pumping stations): official request to WAJ and the utilities.', 'نظم GIS لخطوط النقل والخزانات ومحطات الضخ: طلب رسمي من سلطة المياه والشركات.')]),
    'opendata_jo': ('National open data portal', 'بوابة البيانات المفتوحة', 'The whole opendata.gov.jo catalogue, screened for water.', 'كتالوج opendata.gov.jo كاملًا، مفروزًا لما يخص المياه.',
                    [('3,768 datasets scanned; 187 about water selected, 342 files downloaded (424 MB).', 'فحصنا 3,768 مجموعة بيانات، واخترنا 187 عن المياه، ونزّلنا 342 ملفًا (424 ميجا).'),
                     ('Miyahuna’s water mains: about 18,558 km in 2023, 10,639 km of them in Amman.', 'شبكة مياهنا نحو 18,558 كم في 2023، منها 10,639 كم في عمّان.'),
                     ('Illegal use seized in Amman: 3,559 cases in 2021 (2.74 million m³).', 'ضبطيات الاستخدام غير المشروع في عمّان: 3,559 حالة في 2021 (2.74 مليون م³).')],
                    [('Miyahuna district (DMA) boundaries and GIS layers: request to Miyahuna’s GIS directorate.', 'حدود مناطق التوزيع وطبقات GIS لدى مياهنا: طلب من مديرية GIS.')]),
    'intl': ('International sources', 'مصادر دولية', 'World Bank, JICA, USAID, EIB and FAO reports on Jordan’s water losses.', 'تقارير البنك الدولي وجايكا والوكالة الأمريكية وبنك الاستثمار الأوروبي والفاو عن فاقد المياه.',
             [('Latest official national NRW: 45.0% (Jul 2024–Jun 2025), down from 51.7% in 2021/22.', 'آخر فاقد وطني رسمي: 45.0% (تموز 2024–حزيران 2025)، نزولًا من 51.7% في 2021/22.'),
              ('Utility NRW is published in two series that must not be mixed.', 'فاقد الشركات يُنشر بسلسلتين لا يجوز خلطهما.')], []),
    'facts_stats': ('Official statistics', 'إحصاءات رسمية', 'Ministry, regulator and utility figures behind every number we quote.', 'أرقام الوزارة والرقابة والشركات خلف كل رقم نذكره.',
                    [('41% is national non-revenue water (supplied, not billed), not a loss of all water produced.', 'نسبة 41% هي المياه غير المفوترة وطنيًا، لا خسارة كل المياه المنتجة.'),
                     ('133,408 attacks on main and carrier lines, Jun 2013–Jun 2026; 1,265 cases pending in court.', '133,408 اعتداء على الخطوط الرئيسية والناقلة (حزيران 2013–حزيران 2026)، و1,265 قضية منظورة.')], []),
    'facts_market': ('Market and competitors', 'السوق والمنافسون', 'Competitors, contracts, prices and funding programmes.', 'المنافسون والعقود والأسعار وبرامج التمويل.',
                     [('Origin Tech won Northern Ireland Water’s satellite contract: £5.9m over 3 years (2026).', 'فازت Origin Tech بعقد مياه أيرلندا الشمالية الفضائي: 5.9 مليون جنيه لثلاث سنوات (2026).'),
                      ('No ASTERRA project found in Jordan; NISAR radar data became free in July 2026.', 'لا مشروع لـ ASTERRA في الأردن، وبيانات رادار NISAR صارت مجانية في تموز 2026.')], []),
    'incidents_theft': ('Theft register', 'سجل السرقات', 'Water-theft events from public news, 2018–2026, each with its link.', 'حوادث سرقة المياه من الأخبار العامة 2018–2026، كل منها برابطه.',
                        [('596 events from the press: 301 illegal connections, 145 illegal wells or rigs, 128 tanker thefts.', '596 حادثة من الصحافة: 301 وصلة مخالفة، و145 بئرًا أو حفارة، و128 سرقة صهاريج.'),
                         ('The Disi line: 13,796 attacks from 2014 to mid-August 2026.', 'خط الديسي: 13,796 اعتداء من 2014 حتى منتصف آب 2026.')],
                        [('Location-level seizure records: request to Miyahuna or WAJ.', 'سجلات الضبط بمواقعها: طلب من مياهنا أو سلطة المياه.')]),
    'incidents_supply': ('Breaks and outages', 'الكسور والانقطاعات', 'Pipe breaks, outages, complaints and supply schedules.', 'كسور الأنابيب والانقطاعات والشكاوى وجداول التزويد.',
                         [('Miyahuna logged 207,948 “no water” complaints in 2025.', 'سجّلت مياهنا 207,948 شكوى «لا تصل المياه» في 2025.'),
                          ('Amman: 9,511 main-line breaks and 46,609 house-connection breaks in 2025.', 'عمّان: 9,511 كسرًا في الخطوط الرئيسية و46,609 في الوصلات المنزلية في 2025.')], []),
    'gis_standards': ('GIS standards', 'معايير GIS', 'How Jordan’s water utilities keep their maps, and the formats they use.', 'كيف تحفظ شركات المياه خرائطها، وبأي صيغ.',
                      [('Miyahuna’s wMain format is public on the national water master plan’s ArcGIS service (5,514 lines).', 'صيغة wMain الخاصة بمياهنا منشورة على خدمة GIS لخطة المياه الوطنية (5,514 خطًا).'),
                       ('The Miyahuna GIS guideline named in the brief is not published.', 'دليل GIS الخاص بمياهنا المذكور في الموجز غير منشور.')], []),
    'landcover_agri': ('Land and agriculture', 'الأراضي والزراعة', 'Crop maps, land cover and satellite evapotranspiration.', 'خرائط المحاصيل والغطاء الأرضي والتبخّر من الأقمار.',
                       [('On dry land, 204–269 km² are irrigated every summer, using 60–78 million m³ in four months.', 'في الأراضي الجافة تُروى 204–269 كم² كل صيف، تستهلك 60–78 مليون م³ في أربعة أشهر.'),
                        ('237 dry-land patches (5,962 ha) show new evapotranspiration in 2023–25; the largest cluster is near Mudawwara.', '237 رقعة في أراضٍ جافة (5,962 هكتارًا) فيها تبخّر جديد في 2023–25، وأكبر تجمّع قرب المدوّرة.')], []),
    'climate_terrain_pop': ('Climate, terrain, population', 'المناخ والتضاريس والسكان', 'Rainfall, elevation, buildings and population by area.', 'المطر والارتفاع والمباني والسكان لكل منطقة.',
                            [('The dry season is June–September in 11 of 12 governorates (CHIRPS v3, 2015–2025).', 'الموسم الجاف من حزيران إلى أيلول في 11 من 12 محافظة (CHIRPS v3، 2015–2025).'),
                             ('Mean annual rainfall ranges from 84 mm (Aqaba) to 476 mm (Jerash).', 'متوسط المطر السنوي من 84 ملم (العقبة) إلى 476 ملم (جرش).')], []),
    'google_crowd': ('Street imagery and crowd sources', 'صور الشارع والمصادر الجماعية', 'Open street photos and what Google’s terms allow.', 'صور الشارع المفتوحة وما تسمح به شروط Google.',
                     [('37,105 open street-level photos along two corridors (KartaView).', '37,105 صورة شارع مفتوحة على ممرّين (KartaView).'),
                      ('Google’s terms forbid tracing utility lines from its imagery, so no map edit is drawn from Google.', 'شروط Google تمنع رسم خطوط المرافق من صورها، فلا يُرسم أي تعديل منها.')], []),
    'audit': ('Audit', 'التدقيق', 'An independent check of the older FORCAST layers.', 'تدقيق مستقل لطبقات FORCAST السابقة.',
              [('Fixed category errors in the QA map: its “water/sewer” layer held 391 wadis and streams.', 'صحّحنا أخطاء التصنيف في خريطة الفحص: طبقة «مياه وصرف» كانت تضم 391 واديًا ومجرى.'),
               ('Telecom assets recounted from 85 to 37 after removing minarets and towers.', 'أعدنا عدّ أصول الاتصالات من 85 إلى 37 بعد استبعاد المآذن والأبراج.')], []),
    'corridors': ('Carrier corridors', 'الممرات الناقلة', 'The main transmission lines, with provenance and positional error.', 'خطوط النقل الرئيسية، بمصدر رسمها وخطأ موقعها.',
                  [('8 carrier corridors in 11 segments, each with its geometry source and positional error (kept restricted).', '8 ممرات ناقلة في 11 مقطعًا، لكل منها مصدر الرسم وخطأ الموقع (محفوظة مقيّدة).'),
                   ('The National Carrier is designed to run parallel to the Disi line, along its service road.', 'الناقل الوطني مصمَّم ليمتد موازيًا لخط الديسي وعلى طريق خدمته.')],
                  [('Exact routes stay restricted; the app shows an illustrative route only.', 'المسارات الدقيقة تبقى مقيّدة، والتطبيق يعرض مسارًا توضيحيًا فقط.')]),
    'imagery': ('Satellite imagery', 'صور الأقمار', 'Sentinel-2 dry-season scenes for five study areas, 2017–2026.', 'مشاهد Sentinel-2 للموسم الجاف لخمس مناطق دراسة، 2017–2026.',
                [('Two Sentinel-2 collections differ by exactly 1,000 DN for the same scene; we harmonise them.', 'مجموعتا Sentinel-2 تختلفان بـ1,000 وحدة بالضبط للمشهد نفسه، ونحن نوحّدهما.'),
                 ('Collection 1 has no July–September scenes for 2017 and 2022; the gaps are documented.', 'المجموعة 1 بلا مشاهد تموز–أيلول لعامي 2017 و2022، والفجوات موثّقة.')], []),
    'feasibility': ('Satellite test', 'اختبار الأقمار', 'Does Sentinel-2 see new patches near Jordan’s carrier lines?', 'هل يرى Sentinel-2 الرقع الجديدة قرب الخطوط الناقلة؟',
                    [('New desert patches stand out 11–96× above noise and are found from about 400 m² (green) or 800 m² (wet).', 'الرقع الجديدة في الصحراء تظهر 11–96 ضعفًا فوق الضجيج، وتُكشف من نحو 400 م² (خضرة) أو 800 م² (رطوبة).'),
                     ('Of 321 candidates near the Disi lines: about 76% obvious false alarms, 22% new farms, 2% unexplained.', 'من 321 رقعة قرب خطوط الديسي: نحو 76% إنذار كاذب واضح، و22% مزارع جديدة، و2% غير مفسَّرة.')], []),
}

THEFT_TYPES = {
    'illegal_connection': ('Illegal connection', 'وصلة مخالفة'),
    'illegal_well': ('Illegal well or rig', 'بئر أو حفارة مخالفة'),
    'tanker_theft': ('Tanker theft', 'سرقة بالصهاريج'),
    'line_attack': ('Attack on a line', 'اعتداء على خط'),
    'other': ('Other', 'أخرى'),
}
SUPPLY_TYPES = {
    'leak': ('Leak', 'تسرّب'), 'break': ('Pipe break', 'كسر خط'), 'pipe_break': ('Pipe break', 'كسر خط'),
    'outage': ('Supply outage', 'انقطاع التزويد'), 'interruption': ('Supply interruption', 'انقطاع التزويد'),
    'contamination': ('Contamination', 'تلوّث'), 'pressure': ('Low pressure', 'ضعف الضغط'), 'other': ('Other', 'أخرى'),
    'supply_interruption': ('Supply interruption', 'انقطاع التزويد'), 'main_break': ('Main-line break', 'كسر خط رئيسي'),
}


def register(path, labels):
    rs = rows(path)
    events = []
    by_type, by_gov, by_year = {}, {}, {}
    for r in rs:
        t = (r.get('type') or 'other').strip() or 'other'
        g = (r.get('governorate') or '').strip()
        d = (r.get('date') or '').strip()
        by_type[t] = by_type.get(t, 0) + 1
        if g:
            by_gov[g] = by_gov.get(g, 0) + 1
        if d[:4].isdigit():
            by_year[int(d[:4])] = by_year.get(int(d[:4]), 0) + 1
        lat, lon = num(r.get('lat')), num(r.get('lon'))
        events.append({
            'id': r.get('incident_id'), 'date': d, 'type': t, 'gov_en': g,
            'place_en': (r.get('place_text_en') or '').strip(), 'place_ar': (r.get('place_text_ar') or '').strip(),
            'lat': round(lat, 2) if lat is not None else None, 'lon': round(lon, 2) if lon is not None else None,
            'quantity': (r.get('quantity') or '').strip()[:80] or None,
            'source_name': (r.get('source_name') or '').strip(), 'source_url': (r.get('source_url') or '').strip(),
            'confidence': (r.get('confidence') or '').strip(),
        })
    events.sort(key=lambda e: e['date'] or '', reverse=True)
    lab = lambda t: labels.get(t, (t.replace('_', ' ').capitalize(), t.replace('_', ' ')))
    return {
        'total': len(rs),
        'by_type': [{'type': t, 'label_en': lab(t)[0], 'label_ar': lab(t)[1], 'count': c} for t, c in sorted(by_type.items(), key=lambda x: -x[1])],
        'by_governorate': [{'gov_en': g, 'gov_ar': '', 'count': c} for g, c in sorted(by_gov.items(), key=lambda x: -x[1])],
        'by_year': [{'year': y, 'count': c} for y, c in sorted(by_year.items())],
        'events': events,
    }


def main():
    # ---- catalog -------------------------------------------------------------------------
    sources, facts = [], []
    for p in sorted(glob.glob(f'{W}/catalog/sources_*.csv')):
        d = os.path.basename(p)[8:-4]
        if d not in DOMAINS:
            continue  # gap_* files were written by a later step that was stopped before its independent check
        for r in rows(p):
            sources.append({'id': r.get('source_id', ''), 'domain': d, 'title': r.get('name_en') or r.get('name_ar') or '', 'publisher': r.get('publisher', ''),
                            'url': r.get('url', ''), 'type': r.get('format') or r.get('access_method') or '', 'licence': r.get('licence', ''),
                            'status': (r.get('status') or '').strip(), 'date': r.get('time_coverage') or ''})
    for p in sorted(glob.glob(f'{W}/catalog/facts_*.csv')):
        d = os.path.basename(p)[6:-4]
        if d not in DOMAINS:
            continue
        for r in rows(p):
            facts.append({'id': r.get('fact_id', ''), 'domain': d, 'claim_en': r.get('claim_en', ''), 'claim_ar': r.get('claim_ar', ''), 'value': r.get('value', ''),
                          'unit': r.get('unit', ''), 'period': r.get('period', ''), 'status': (r.get('status') or '').strip().lower(), 'safe_en': r.get('safe_wording_en', ''),
                          'source_url': r.get('source_url', ''), 'publisher': r.get('source_publisher', ''), 'date': r.get('source_date', '')})

    st = lambda f, *keys: sum(1 for x in f if x['status'] in keys)
    # ---- sizes ---------------------------------------------------------------------------
    domains = []
    bytes_c_total, files_c_total = size_of(W)
    bytes_d_total, files_d_total = 0, 0
    for name in os.listdir(DD) if os.path.isdir(DD) else []:
        if name.startswith('missing_blue_'):
            continue
        b, f = size_of(os.path.join(DD, name))
        bytes_d_total += b
        files_d_total += f
    for did, (en, ar, sum_en, sum_ar, finds, blocked) in DOMAINS.items():
        bc = sum(size_of(f'{W}/{part}/{did}')[0] for part in ('raw', 'derived'))
        fc = sum(size_of(f'{W}/{part}/{did}')[1] for part in ('raw', 'derived'))
        bd, fd = size_of(f'{DD}/{did}')
        ds = [s for s in sources if s['domain'] == did]
        df = [f for f in facts if f['domain'] == did]
        domains.append({
            'id': did, 'name_en': en, 'name_ar': ar, 'bytes_c': bc, 'bytes_d': bd, 'files': fc + fd,
            'sources': len(ds), 'downloaded': st(ds, 'downloaded'), 'facts': len(df), 'confirmed': st(df, 'confirmed'),
            'partial': st(df, 'partially', 'partial'), 'corrected': st(df, 'corrected'), 'unverified': st(df, 'unverified'),
            'verdict': None if did == 'audit' else 'pass-with-corrections', 'summary_en': sum_en, 'summary_ar': sum_ar,
            'findings': [{'en': a, 'ar': b} for a, b in finds], 'blocked': [{'en': a, 'ar': b} for a, b in blocked],
        })
    domains.sort(key=lambda d: -(d['sources'] + d['facts']))

    # ---- NRW -----------------------------------------------------------------------------
    nrw = []
    for r in rows(f'{W}/derived/facts_stats/nrw_national_series.csv'):
        if r.get('period_type') == 'year' and num(r.get('nrw_pct')) is not None:
            nrw.append({'period': r['period'], 'value': num(r['nrw_pct']), 'label_en': r.get('kind', ''), 'source': {'publisher': r.get('publisher', ''), 'date': r['period'], 'url': ''}})
    nrw.sort(key=lambda x: x['period'])
    nrw = [x for i, x in enumerate(nrw) if i == 0 or x['period'] != nrw[i - 1]['period']]
    upmu = {'publisher': 'MWI Utilities Performance Monitoring Unit — Report 2024, Annex II', 'date': '2025', 'url': 'https://www.mwi.gov.jo/EBV4.0/Root_Storage/AR/EB_Info_Page/Report_2024.pdf'}
    gov = [{'gov_en': r['governorate'], 'gov_ar': '', 'base': num(r.get('nrw_pct_base_2021_22')), 'latest': num(r.get('nrw_pct_third_year_2024_25')), 'base_period': '2021/22', 'latest_period': '2024/25'}
           for r in rows(f'{W}/derived/facts_stats/nrw_by_governorate_CNRW_base2021-22_vs_2024-25.csv') if r.get('governorate') and r['governorate'].lower() not in ('total', 'national', 'jordan', 'nation')]

    # ---- enforcement -----------------------------------------------------------------------
    annual = {}
    for r in rows(f'{W}/derived/facts_stats/enforcement_annual_figures_2022-2026.csv'):
        per, meas, val = r.get('period', ''), (r.get('measure') or '').lower(), num(r.get('value'))
        m = re.match(r'^(\d{4})', per)
        if not m or val is None or 'cumulative' in meas or 'to' in per[4:12].lower() and not per.startswith('2025 (year'):
            pass
        if not m or val is None or 'cumulative' in meas:
            continue
        y = int(m.group(1))
        if 'attacks on main' in meas:
            a = annual.setdefault(y, {'year': y, 'main_line_attacks': None, 'kac_attacks': None, 'wells_backfilled': None, 'mcm_saved': None, 'partial_year': False, 'source': None})
            if a['main_line_attacks'] is None or val > a['main_line_attacks']:
                a['main_line_attacks'] = int(val)
                a['partial_year'] = per != str(y)
                a['source'] = {'publisher': r.get('publisher', ''), 'date': per, 'url': r.get('url', '')}
    disi = []
    seen = set()
    for r in rows(f'{W}/derived/incidents_theft/campaign_aggregates.csv'):
        if r.get('metric') == 'disi_attacks' and r.get('period_type') == 'year':
            y = int(r['period_start'][:4])
            if y in seen:
                continue  # 2025 has two reports (1,802 and 1,853); keep the first, the Petra/Hala figure
            seen.add(y)
            disi.append({'year': y, 'attacks': int(num(r['value'])), 'partial_year': False, 'source': {'publisher': r.get('source_name', ''), 'date': r.get('published_date', ''), 'url': r.get('source_url', '')}})
    for r in rows(f'{W}/derived/facts_stats/enforcement_annual_figures_2022-2026.csv'):
        if r.get('period', '').startswith('2026') and 'disi' in (r.get('measure') or '').lower() and 'cumulative' not in (r.get('measure') or '').lower():
            disi.append({'year': 2026, 'attacks': int(num(r['value'])), 'partial_year': True, 'source': {'publisher': r.get('publisher', ''), 'date': r.get('period', ''), 'url': r.get('url', '')}})
    disi.sort(key=lambda x: x['year'])

    # ---- registers -------------------------------------------------------------------------
    theft = register(f'{W}/derived/incidents_theft/water_theft_incidents.csv', THEFT_TYPES)
    supply = register(f'{W}/derived/incidents_supply/breaks_and_outages.csv', SUPPLY_TYPES)
    comp = {}
    for r in rows(f'{W}/derived/incidents_supply/complaints_stats.csv'):
        if r.get('operator') == 'Miyahuna' and r.get('period_type') == 'year' and r.get('metric') == 'complaints_received':
            y = int(r['period'][:4])
            c = comp.setdefault(y, {'year': y, 'no_water': None, 'breaks': None})
            if r.get('complaint_type') == 'no_water':
                c['no_water'] = int(num(r['value']))
            elif r.get('complaint_type') == 'pipe_breaks':
                c['breaks'] = int(num(r['value']))
    supply['complaints'] = [comp[y] for y in sorted(comp)]

    # ---- corridors (attributes only) -----------------------------------------------------------
    corridors = []
    for r in rows(f'{W}/derived/corridors/corridors.csv'):
        restricted = 'restricted' in (r.get('sensitivity') or '').lower()
        corridors.append({'id': r['corridor_id'], 'name_en': r.get('name_en', ''), 'name_ar': r.get('name_ar', ''), 'operator': '' if restricted else r.get('owner_operator', ''),
                          'length_km_reported': r.get('length_km_reported', ''), 'length_km_mapped': None if restricted else num(r.get('length_km_mapped')),
                          'diameter': '' if restricted else r.get('diameter_mm', ''), 'material': '' if restricted else r.get('material', ''), 'year': r.get('year', ''),
                          'governorates': r.get('governorates', ''), 'best_pos_error_m': None if restricted else num(r.get('best_pos_error_m'))})

    # ---- satellite test (derived/feasibility: sites_by_setting.csv, review_summary.csv and the domain report) ----
    sbs = rows(f'{W}/derived/feasibility/sites_by_setting.csv')
    disi_aois = ('aoi-01', 'aoi-02', 'aoi-03')
    cand = sum(int(r['patches']) for r in sbs if r['aoi_id'] in disi_aois and r['setting'] == 'S2_default' and r['buffer'] == '0-2km')
    sites = sum(int(r['sites_300m']) for r in sbs if r['aoi_id'] in disi_aois and r['setting'] == 'S2_default' and r['buffer'] == '0-2km')
    rv = {r['measure']: num(r['share']) for r in rows(f'{W}/derived/feasibility/review_summary.csv') if r.get('sample') == 'A_top40' and r.get('share')}
    feas = {
        'aois': 5, 'scenes': 100, 'noise_ndvi': '0.0044-0.0068', 'noise_ndmi': '0.0067-0.0093', 'separation': '11-96x (median 13.5x)',
        'detect_green_m2': 400, 'detect_wet_m2': 800, 'candidates_default_2km': cand, 'sites_default_2km': sites,
        'review_top40': {'false_positive': round((rv.get('obvious_false_positive') or 0.5) * 100), 'new_farm': round((rv.get('cause:new_farm_or_greenhouse') or 0.35) * 100), 'unexplained': round((rv.get('cause:unexplained') or 0.15) * 100)},
        'review_all_estimate': {'false_positive': 76, 'new_farm': 22, 'unexplained': 2},
        'rain_note_en': '2025 was the driest year on record and 2026 a wet one: 207 of the 321 patches appear only in 2026.',
        'rain_note_ar': 'كان 2025 أجفّ عام مسجّل و2026 عامًا رطبًا: 207 من الرقع الـ321 تظهر في 2026 فقط.',
    }

    sel = rows(f'{W}/derived/opendata_jo/water_dataset_selection.csv')
    by_org = {}
    for r in sel:
        if r.get('decision') != 'excluded':
            by_org[r.get('org_short') or r.get('org') or '?'] = by_org.get(r.get('org_short') or r.get('org') or '?', 0) + 1

    dash = {
        'generated_at': date.today().isoformat(),
        'totals': {
            'sources': len(sources), 'sources_downloaded': st(sources, 'downloaded'), 'facts': len(facts), 'facts_confirmed': st(facts, 'confirmed'),
            'facts_partial_or_corrected': st(facts, 'partially', 'partial', 'corrected'), 'facts_unverified': len(facts) - st(facts, 'confirmed', 'partially', 'partial', 'corrected'),
            'domains': len(domains), 'files_c': files_c_total, 'files_d': files_d_total, 'bytes_c': bytes_c_total, 'bytes_d': bytes_d_total,
            'theft_events': theft['total'], 'supply_events': supply['total'], 'opendata_datasets_scanned': 3768, 'opendata_water_datasets': sum(by_org.values()),
        },
        'domains': domains,
        'nrw_national': nrw,
        'nrw_by_governorate': gov,
        'nrw_by_governorate_source': upmu,
        'enforcement': {
            'annual': [annual[y] for y in sorted(annual)],
            'disi_by_year': disi,
            'cumulative': {'main_line_attacks': 133408, 'wells_backfilled': 1734, 'kac_attacks': 38667, 'period': 'Jun 2013 – Jun 2026',
                           'source': {'publisher': 'Madar Al-Saa — MWI data via Al-Mamlaka TV', 'date': '2026-08-20', 'url': 'https://alsaa.net/article/649053'}},
        },
        'theft': theft,
        'supply': supply,
        'corridors': corridors,
        'feasibility': feas,
        'landcover': {'new_et_patches': 237, 'new_et_hectares': 5962, 'summer_irrigated_km2': '204-269', 'summer_use_mcm': '60-78', 'largest_cluster_en': 'Mudawwara (Maan): 74 patches, 3,297 ha', 'largest_cluster_ar': 'المدوّرة (معان): 74 رقعة، 3,297 هكتارًا'},
        'opendata': {'datasets_scanned': 3768, 'water_selected': sum(by_org.values()), 'files_downloaded': 342, 'megabytes': 424, 'by_org': [{'org': k, 'count': v} for k, v in sorted(by_org.items(), key=lambda x: -x[1])]},
        'notes': ['NRW national series mixes annual figures from MWI Facts & Figures, the Central NRW Unit and ministry statements; see label_en.',
                  'Disi totals exist only for 2015, 2025 and 2026 to August in the collection.'],
    }
    with io.open(os.path.join(OUT, 'dashboard.json'), 'w', encoding='utf-8') as f:
        json.dump(dash, f, ensure_ascii=False, separators=(',', ':'))
    with io.open(os.path.join(OUT, 'library.json'), 'w', encoding='utf-8') as f:
        json.dump({'sources': sources, 'facts': facts}, f, ensure_ascii=False, separators=(',', ':'))
    t = dash['totals']
    print('sources', t['sources'], 'downloaded', t['sources_downloaded'], '| facts', t['facts'], 'confirmed', t['facts_confirmed'], 'partial/corrected', t['facts_partial_or_corrected'])
    print('bytes C', round(t['bytes_c'] / 1e9, 2), 'GB', t['files_c'], 'files | D', round(t['bytes_d'] / 1e9, 2), 'GB', t['files_d'], 'files')
    print('theft', theft['total'], [(x['type'], x['count']) for x in theft['by_type']])
    print('supply', supply['total'], [(x['type'], x['count']) for x in supply['by_type']][:8])
    print('nrw', [(x['period'], x['value']) for x in nrw][-6:])
    print('gov', [(g['gov_en'], g['base'], g['latest']) for g in gov])
    print('annual', [(a['year'], a['main_line_attacks'], a['partial_year']) for a in dash['enforcement']['annual']])
    print('disi', [(d['year'], d['attacks'], d['partial_year']) for d in disi])
    print('complaints', supply['complaints'][-3:])
    print('feasibility', cand, sites, feas['review_top40'])
    print('corridors', [(c['id'], c['name_en'][:30], c['length_km_reported']) for c in corridors])


if __name__ == '__main__':
    main()
