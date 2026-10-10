/**
 * Every number on the site comes from here, and every entry was checked against a fetched source
 * by the FORCAST data collection (water/catalog/facts_*.csv, 2026-10-09). Wording follows the
 * "safe wording" column so slides never overclaim.
 */
import type { Text } from '../i18n/lang'

export type Source = { publisher: string; date: string; url: string }
export type Fact = {
  id: string
  value: string
  label: Text
  detail?: Text
  sources: Source[]
  /** confirmed = matches the source; partially = holds with the caveat in `detail` */
  status: 'confirmed' | 'partially'
  factIds: string[]
}

export const FACTS = {
  nrw: {
    id: 'nrw',
    value: '41–45%',
    label: { ar: 'من مياه الشرب المزوّدة لا تُفوتر (فاقد)', en: 'of supplied drinking water is never billed (non-revenue water)' },
    detail: {
      ar: '45.0% في التقييم الرسمي (تموز 2024 – حزيران 2025)، وتذكر الوزارة 41–42.3% في 2026. هو «فاقد غير مُحاسَب عليه»: تسرّب وسرقة واستهلاك غير مفوتر.',
      en: '45.0% in the official Jul 2024 – Jun 2025 assessment; the ministry cites 41–42.3% in 2026. It is non-revenue water: leaks, theft and unbilled use.',
    },
    sources: [
      { publisher: 'JICA, citing MWI 3rd National NRW Assessment', date: '2026-01', url: 'https://openjicareport.jica.go.jp/pdf/1000056446.pdf' },
      { publisher: 'Petra — MWI press release', date: '2026-08-24', url: 'https://petra.gov.jo/en/news/water-loss-cut-to-41-exceeding-target' },
    ],
    status: 'confirmed',
    factIds: ['intl-F01', 'intl-F04', 'facts_stats-F001', 'facts_stats-F003'],
  },
  attacks: {
    id: 'attacks',
    value: '133,408',
    label: { ar: 'اعتداء على الخطوط الرئيسية والناقلة', en: 'attacks recorded on main and carrier lines' },
    detail: { ar: 'من حزيران 2013 حتى حزيران 2026، مع ردم 1,734 بئرًا مخالفة.', en: 'June 2013 to June 2026, with 1,734 illegal wells backfilled.' },
    sources: [{ publisher: 'Madar Al-Saa — MWI data via Al-Mamlaka TV', date: '2026-08-20', url: 'https://alsaa.net/article/649053' }],
    status: 'confirmed',
    factIds: ['facts_stats-F028', 'incth-f006'],
  },
  disi: {
    id: 'disi',
    value: '1,802',
    label: { ar: 'اعتداء على خط الديسي في 2025 وحده', en: 'attacks on the Disi conveyor in 2025 alone' },
    detail: { ar: 'نحو 14 ألف اعتداء منذ 2014، و2025 هو العام الأسوأ.', en: 'About 14,000 since 2014; 2025 was the worst year.' },
    sources: [{ publisher: 'Addustour — Petra tracking of MWI figures', date: '2026-08-15', url: 'https://www.addustour.com/articles/1584241' }],
    status: 'confirmed',
    factIds: ['facts_stats-F033', 'incth-f003'],
  },
  theftShare: {
    id: 'theftShare',
    value: '70%',
    label: { ar: 'من الفاقد تعزوه الوزارة إلى السرقات والاعتداءات', en: 'of non-revenue water the ministry attributes to theft and attacks' },
    detail: { ar: 'تقدير وزاري (آب 2026)، لا ميزان مائي مدقّق. التقديرات الأقدم قسمت الفاقد مناصفةً تقريبًا.', en: 'A ministry attribution (Aug 2026), not an audited water balance. Older estimates split losses roughly half and half.' },
    sources: [{ publisher: 'Addustour — MWI spokesperson', date: '2026-08-15', url: 'https://www.addustour.com/articles/1584241' }],
    status: 'partially',
    factIds: ['facts_stats-F022', 'facts_stats-F019'],
  },
  target: {
    id: 'target',
    value: '25%',
    label: { ar: 'هدف الفاقد بحلول 2040', en: 'national non-revenue water target by 2040' },
    detail: { ar: 'الاستراتيجية الوطنية للمياه 2023–2040، من خط أساس 52% (2021).', en: 'National Water Strategy 2023–2040, from a 52% baseline (2021).' },
    sources: [{ publisher: 'MWI — National Water Strategy 2023–2040', date: '2023', url: 'https://faolex.fao.org/docs/pdf/jor218684.pdf' }],
    status: 'confirmed',
    factIds: ['facts_stats-F015', 'facts_stats-F016'],
  },
  smallLeaks: {
    id: 'smallLeaks',
    value: '85%',
    label: { ar: 'من التسرّبات المبلّغ عنها في الشبكات الصغيرة ووصلات المنازل', en: 'of reported leaks are on small pipes and house connections' },
    sources: [{ publisher: 'NRW Policy Paper for Jordan (EU WES-MED, for MWI)', date: '2024-05', url: 'https://www.wes-med.eu/wp-content/uploads/2024/05/NRW-Policy-paper-for-Jordan-2024.05.pdf' }],
    status: 'confirmed',
    factIds: ['facts_stats-F024'],
  },
  supplyHours: {
    id: 'supplyHours',
    value: '~9',
    label: { ar: 'ساعات تزويد أسبوعيًا في الشمال، ونحو 38 في مناطق مياهنا', en: 'hours of supply a week in the north, about 38 in Miyahuna areas' },
    detail: { ar: 'ساعات مجدولة لا مقيسة (2024). وذروة الشكاوى صيفًا تدلّ على أن بعض البيوت تحصل على أقل من المجدول.', en: 'Scheduled, not measured (2024). Summer complaint peaks suggest some homes get less than scheduled.' },
    sources: [{ publisher: 'MWI Utilities Performance Monitoring Unit — Report 2024', date: '2025', url: 'https://www.mwi.gov.jo/EBV4.0/Root_Storage/AR/EB_Info_Page/Report_2024.pdf' }],
    status: 'confirmed',
    factIds: ['incsup-f001', 'incsup-f003'],
  },
  noWater: {
    id: 'noWater',
    value: '1 / 4',
    label: { ar: 'شكوى «لا تصل المياه» لكل أربعة مشتركين في السنة', en: '"no water" complaint for every four subscribers a year' },
    detail: { ar: 'مناطق مياهنا واليرموك، 2024. سجّلت مياهنا وحدها نحو 208 آلاف شكوى من هذا النوع في 2025.', en: 'Miyahuna and Yarmouk areas, 2024. Miyahuna alone logged about 208,000 such complaints in 2025.' },
    sources: [
      { publisher: 'MWI UPMU — Report 2024', date: '2025', url: 'https://www.mwi.gov.jo/EBV4.0/Root_Storage/AR/EB_Info_Page/Report_2024.pdf' },
      { publisher: 'Miyahuna — Annual Report 2025', date: '2026', url: 'https://www.miyahuna.com.jo/ebv4.0/root_storage/ar/eb_list_page/annual_report_arabic-0.pdf' },
    ],
    status: 'confirmed',
    factIds: ['incsup-f005', 'incsup-f007'],
  },
  continuous: {
    id: 'continuous',
    value: '2.3%',
    label: { ar: 'فقط من مشتركي العاصمة لديهم تزويد دائم', en: 'of Amman subscribers have round-the-clock supply' },
    detail: { ar: 'وكانت الشبكة مضغوطة نحو 21% من الوقت (2022).', en: 'The network was pressurised about 21% of the time (2022).' },
    sources: [{ publisher: 'Miyahuna KPIs Amman 2022 (opendata.gov.jo)', date: '2022', url: 'https://opendata.gov.jo/dataset/MIGRATED-2523-2022/resource/d11f53fa-412e-4fcf-a853-50ceef857715/download/kpis_amman_2022.xlsx.xls' }],
    status: 'confirmed',
    factIds: ['opendata_jo-F010'],
  },
  gisKm: {
    id: 'gisKm',
    value: '~11,000 km',
    label: { ar: 'من شبكة المياه في نظام GIS لدى مياهنا، ولا أرقام منشورة عن دقّتها', en: "of water network in Miyahuna's GIS, with no published figure on its accuracy" },
    sources: [{ publisher: 'Miyahuna — Annual Report 2025', date: '2026', url: 'https://miyahuna.com.jo/ebv4.0/root_storage/ar/eb_list_page/annual_report_arabic-0.pdf' }],
    status: 'partially',
    factIds: ['facts_stats-F044'],
  },
  stress: {
    id: 'stress',
    value: '105%',
    label: { ar: 'إجهاد مائي: يسحب الأردن أكثر من المتجدّد المتاح', en: 'water stress: Jordan withdraws more than its renewable supply' },
    sources: [{ publisher: 'UN SDG 6.4.2 (UNSD / FAO)', date: '2023', url: 'https://unstats.un.org/sdgapi/v1/sdg/Series/Data?seriesCode=ER_H2O_STRESS&areaCode=400' }],
    status: 'confirmed',
    factIds: ['intl-F15'],
  },
  aqaba: {
    id: 'aqaba',
    value: '3,500 m³',
    label: { ar: 'يوميًا كانت تُسحب عبر 19 وصلة على خطوط 8 و16 إنش في العقبة', en: 'a day were drawn through 19 taps on 8- and 16-inch mains in Aqaba' },
    detail: { ar: 'اكتُشفت في تموز 2026 بعد أن اشتكى السكان من انقطاع المياه.', en: 'Found in July 2026 after residents reported disrupted supply.' },
    sources: [{ publisher: 'Petra — MWI', date: '2026-07-21', url: 'https://petra.gov.jo/GetSimple/index.php/en/news/authorities-foil-major-water-theft-operation-in-aqaba-arrest-suspect' }],
    status: 'confirmed',
    factIds: ['incidents_theft summary', 'design brief (fetched 2026-10-09)'],
  },
  kac: {
    id: 'kac',
    value: '57%',
    label: { ar: 'من فاقد قناة الملك عبدالله سببه الاستخراج غير المشروع', en: 'of King Abdullah Canal losses come from illegal extraction' },
    detail: { ar: 'نحو 28 مليون م³ في 2021.', en: 'About 28 million m³ in 2021.' },
    sources: [{ publisher: 'JICA, citing the Jordan Valley Authority', date: '2026-01', url: 'https://openjicareport.jica.go.jp/pdf/1000056446.pdf' }],
    status: 'confirmed',
    factIds: ['intl-F07'],
  },
} satisfies Record<string, Fact>

export const MARKET = {
  originThames: {
    text: { ar: 'Origin Tech (المملكة المتحدة) تكشف التسرّب بالأقمار الصناعية والذكاء الاصطناعي؛ وقّعت معها تيمز ووتر عقدًا لـ13 شهرًا من آذار 2026.', en: 'Origin Tech (UK) detects leaks with satellites and AI; Thames Water signed a 13-month contract from March 2026.' },
    source: { publisher: 'Thames Water', date: '2026-05-01', url: 'https://www.thameswater.co.uk/news/2026/apr/thames-water-signs-landmark-leak-detection-contract-with-origin-tech-to-save-over-100-million-litres-of-water-per-day' },
  },
  asterra: {
    text: { ar: 'ASTERRA تستخدم رادار L-band تجاريًا مدفوعًا للشبكات الحضرية والريفية.', en: 'ASTERRA uses paid commercial L-band radar on urban and rural networks.' },
    source: { publisher: 'ASTERRA SOW, Kentucky PSC filing', date: '2023-05-23', url: 'https://psc.ky.gov/pscecf/2021-00206/morganwater@gmail.com/06022023074141/ASTERRA___SOW_and_license_Terms_of_Use__For_Morgan_County_Water_District,_KY_May_23,2023.pdf' },
  },
  flowless: {
    text: { ar: 'Flowless (رام الله) جرّبت مع مياهنا نحو 2,500 اشتراك بحسّاسات تدفّق وضغط مركّبة في الشبكة.', en: 'Flowless (Ramallah) piloted ~2,500 Miyahuna connections using flow and pressure sensors installed in the network.' },
    source: { publisher: 'Flowless — Amman WMI case study', date: '2022', url: 'https://www.flowless.co/wp-content/uploads/2025/06/Amman-WMI-Case-Study.pdf' },
  },
  nisar: {
    text: { ar: 'رادار L-band المجاني أصبح متاحًا (NISAR، تموز 2026)، فلم يعد الرادار المدفوع ميزة دائمة لأحد — ونخطّط لإضافته.', en: 'Free L-band radar is now public (NISAR, July 2026), so paid radar is no lasting moat — and we plan to add it.' },
    source: { publisher: 'Alaska Satellite Facility', date: '2026-07-20', url: 'https://asf.alaska.edu/notices/nisar-l-band-data-now-publicly-available/' },
  },
  jica: {
    text: { ar: 'برنامج وزارة الاقتصاد الرقمي وجايكا (JAIES): جايكا تموّل إثبات المفهوم بالكامل لشركة أردنية مع شريك أكاديمي، وتنتهي مدّته في 31/12/2026.', en: 'MoDEE–JICA JAIES: JICA fully funds proofs of concept by a Jordanian company with an academic partner; the programme ends 31 Dec 2026.' },
    source: { publisher: 'MoDEE — JAIES PoC RFP', date: '2026-04', url: 'https://modee.gov.jo/ebv4.0/root_storage/ar/eb_tenders/rfp%20document%20poc6.pdf' },
  },
  spain: {
    text: { ar: 'إسبانيا تموّل استشارة بـ765 ألف يورو لتخطيط التحوّل الرقمي لقطاع المياه (تموز 2026).', en: 'Spain is financing a €765,000 consultancy to plan the water sector\'s digital transformation (July 2026).' },
    source: { publisher: 'Jordan News — MWI statement', date: '2026-07-20', url: 'https://www.jordannews.jo/Section-109/News/Jordan-Signs-765-000-Agreement-to-Finance-Digital-Transformation-Project-in-Water-Sector-53280' },
  },
  pe63: {
    text: { ar: 'في مواصفات مياهنا للبولي إيثيلين يقابل 2 إنش أنبوبًا قطره الخارجي 63 ملم؛ وللقطع المعدنية 2 إنش = DN50.', en: "In Miyahuna's PE specification 2 inches is a 63 mm pipe (outside diameter); for metal fittings 2 inches is DN50." },
    source: { publisher: 'Miyahuna / UNICEF Jordan — technical specifications annex', date: '—', url: 'https://www.unicef.org/jordan/media/7836/file/LRPS-9169951-Annex_C_-_Technical_Specifications.pdf' },
  },
} as const

export const VERIFIED_ON = '2026-10-09'
