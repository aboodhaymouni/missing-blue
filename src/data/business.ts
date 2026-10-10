/**
 * Business model for Missing Blue: the canvas, the value calculator's defaults, the riskiest
 * assumptions, the "why now" timeline and the hard questions. Every figure carries its source;
 * anything we estimated or assumed says so. Figures come from the FORCAST water catalogs; the IGC
 * cost per m³, the ESIA consultation record (p. 345) and the August 2026 MWI figures were checked
 * at the source on 2026-10-10.
 *
 * Pricing follows the owner's brief: no price is quoted before the pilot measures what patrols and
 * rework cost today. The canvas gives the pricing units, the market's public reference price and the
 * break-even (calculator) instead.
 */
import type { Text } from '../i18n/lang'
import { FACTS, MARKET, type Source } from './facts'

export const BIZ_SRC = {
  nrwCost: { publisher: 'JICA, citing the National NRW Policy 2024', date: '2026-01', url: 'https://openjicareport.jica.go.jp/pdf/1000056446.pdf' },
  m3Cost: { publisher: 'International Growth Centre — Jordan water tariff reforms', date: '2025-11-25', url: 'https://www.theigc.org/blogs/jordan-water-tariff-reforms-costs' },
  attacks2025: { publisher: 'Khaberni — MWI figures for 2025', date: '2026-08-11', url: 'https://www.khaberni.com/news/837149' },
  nrwGov: { publisher: 'MWI Utilities Performance Monitoring Unit — Report 2024', date: '2025', url: 'https://www.mwi.gov.jo/EBV4.0/Root_Storage/AR/EB_Info_Page/Report_2024.pdf' },
  mwiAug2026: { publisher: 'Madar Al-Saa — MWI data via Al-Mamlaka TV', date: '2026-08-20', url: 'https://alsaa.net/article/649053' },
  repairs: { publisher: 'Miyahuna — Annual Report 2025, p. 12', date: '2026', url: 'https://www.miyahuna.com.jo/ebv4.0/root_storage/ar/eb_list_page/annual_report_arabic-0.pdf' },
  alJafr: { publisher: 'JO24 — Disi air valve broken near Al-Jafr', date: '2026-08-09', url: 'https://jo24.net/article/574587' },
  disiLength: { publisher: 'EIB — Disi-Amman conveyor project page', date: '2009', url: 'https://www.eib.org/en/projects/all/20080462' },
  carrierEsia: { publisher: 'EIB register — National Water Carrier ESIA (Tetra Tech), consultation record, p. 345', date: '2022', url: 'https://www.eib.org/en/registers/all/157505254' },
  carrierLength: { publisher: 'AIIB — Aqaba-Amman Water Desalination and Conveyance Project', date: '2025', url: 'https://www.aiib.org/en/projects/details/2025/approved/jordan-aqaba-amman-water-desalination-and-conveyance-project-aawdcp.html' },
  carrierEib: { publisher: 'EIB — National Water Carrier loan, EUR 427m', date: '2025-07-24', url: 'https://www.eib.org/en/projects/all/20190712' },
  carrierEu: { publisher: 'The Jordan Times — EU support for the National Water Carrier', date: '2026-07-16', url: 'https://jordantimes.com/news/local/eu-announces-16b-euros-support-for-national-water-carrier-project' },
  carrierUs: { publisher: 'AGBI — US funds for Jordan’s desalination project', date: '2026-09-17', url: 'https://www.agbi.com/infrastructure/2026/09/us-approves-funds-for-jordans-water-desalination-project/' },
  carrierTimeline: { publisher: 'Wikipedia — Aqaba–Amman project (dates vary between sources)', date: '2026', url: 'https://en.wikipedia.org/wiki/Aqaba%E2%80%93Amman_Water_Desalination_and_Conveyance_Project' },
  orient: { publisher: 'Orient Engineering — NRW performance-based contract with Miyahuna', date: '2020', url: 'https://orientengllc.com/project/performance-based-contract-pbc-for-non-revenue-water-nrw-in-amman-areas/' },
  ifc: { publisher: 'IFC — agreement to cut water loss in Amman', date: '2024-06-06', url: 'https://www.ifc.org/en/pressroom/2024/ifc-inks-agreement-to-cut-water-loss-and-enhance-water-sustainability-in-jordan' },
  pppRfq: { publisher: 'InfraPPPWorld — RFQ for the Amman NRW project', date: '2026-03', url: 'https://www.infrapppworld.com/update/rfq-issued-for-non-revenue-water-nrw-reduction-project-in-jordan' },
  wb: { publisher: 'World Bank — Jordan Water Sector Efficiency Project', date: '2023', url: 'https://documents1.worldbank.org/curated/en/099052623124518529/pdf/BOSIB0d4798d310db097bc06922e98e0ee3.pdf' },
  wbProgress: { publisher: 'World Bank — implementation status report, Sep 2024', date: '2024-09-06', url: 'https://documents.worldbank.org/curated/en/099090624152533225/pdf/P1766191e1d41207e19abf12c247c3cd8db.pdf' },
  eibRbf: { publisher: 'EIB — results-based water-security loan for Jordan', date: '2024-07-18', url: 'https://www.eib.org/en/projects/all/20230145' },
  giz: { publisher: 'GIZ — Strong Water Utilities factsheet', date: '2025-11', url: 'https://www.giz.de/sites/default/files/media/pkb-document/2025-11/giz2025-en-swu-factsheet.pdf' },
  jicaNrw: { publisher: 'JICA — NRW management project, southern governorates', date: '2023-12', url: 'https://www.jica.go.jp/oda/project/202109551/' },
  growtech: { publisher: 'MoDEE — JICA-funded satellite and AI water PoC (Growtech)', date: '2025', url: 'https://modee.gov.jo/EN/ListDetails/AI_projects/1057/5' },
  state: { publisher: 'US International Trade Administration — Jordan water sector', date: '2026-02-26', url: 'https://www.trade.gov/country-commercial-guides/jordan-environment-and-water-sector' },
  infograph: { publisher: 'InfoGraph — exclusive Esri distributor in Jordan', date: '2026', url: 'https://infograph.com.jo/' },
  origin: { publisher: 'Origin Tech — leak detection pricing basis', date: '2026', url: 'https://www.origintech.co.uk/leak-detection' },
  asterraRadar: { publisher: 'LIDAR Magazine — ASTERRA uses ALOS-2 L-band radar', date: '2023-02-14', url: 'https://lidarmag.com/2023/02/14/l-band-locates-leaks/' },
  suezAsterra: { publisher: 'Smart Water Magazine — NI Water adopts SUEZ/ASTERRA satellite leak detection', date: '2023-01-13', url: 'https://smartwatermagazine.com/news/suez/northern-ireland-water-adopts-satellite-leak-detection-technology' },
  carrierDeveloper: { publisher: 'SUEZ / Meridiam — National Water Carrier press release', date: '2025', url: 'https://www.suez.com/en/news/press-releases/second-largest-desalination-plant-in-the-world-amman-and-aqaba' },
  sentinelFree: { publisher: 'Copernicus Data Space — free, full and open Sentinel data', date: '2026', url: 'https://dataspace.copernicus.eu/terms-and-conditions' },
  chirps: { publisher: 'CHIRPS v3 monthly rainfall (UCSB Climate Hazards Center)', date: '2015–2025', url: 'https://data.chc.ucsb.edu/products/CHIRPS/v3.0/' },
  ramtha: { publisher: 'The Jordan Times — satellite remote sensing uncovers groundwater violations', date: '2014-11-16', url: 'https://www.jordantimes.com/news/local/satellite-remote-sensing-uncovers-violations-underground-water-resources' },
  oman: { publisher: 'SatellitePro ME — Oman water authority satellite leak detection', date: '2020-08-24', url: 'https://satelliteprome.com/news/omans-public-authority-for-water-to-use-satellite-tech-to-detect-leaks/' },
  sewa: { publisher: 'Smart Water Magazine — Sharjah SEWA satellite leak detection', date: '2024-04-09', url: 'https://smartwatermagazine.com/news/smart-water-magazine/sewa-implements-satellite-leak-detection-technology-uae' },
  rezatec: { publisher: 'Companies House — Rezatec Limited insolvency record', date: '2024', url: 'https://find-and-update.company-information.service.gov.uk/company/07940023/insolvency' },
  aiPrice: { publisher: 'Anthropic — API pricing', date: '2026', url: 'https://platform.claude.com/docs/en/about-claude/pricing' },
} satisfies Record<string, Source>

/** Sources in the order they first appear on the business-model page (for the global footnote registry). */
export const BIZ_ORDER: Source[] = Object.values(BIZ_SRC)

/* ------------------------------------------------------------------ segments */

export type SegmentId = 'waj' | 'utilities' | 'contractors' | 'carriers' | 'funders'

export const SEGMENTS: { id: SegmentId; tag: string; color: string; dashed?: boolean; short: Text; role: Text; name: Text; why: Text; sources: Source[] }[] = [
  {
    id: 'waj', tag: 'A', color: '#011c47', short: { ar: 'سلطة المياه', en: 'Water Authority' }, role: { ar: 'المشتري الأول', en: 'First buyer' },
    name: { ar: 'سلطة المياه: وحدتا الرقابة الداخلية والفاقد المركزية', en: 'Water Authority (WAJ): Internal Control and Central NRW units' },
    why: { ar: 'مسؤولة عن الخطوط الناقلة. سجّل خط الديسي وحده 1,802 اعتداء في 2025، أكثر من أي عام منذ 2014، ثم 1,459 في 2026 حتى 20 آب.', en: 'Answers for the carrier lines. The Disi line alone logged 1,802 attacks in 2025, more than in any year since 2014, then 1,459 in 2026 by 20 August.' },
    sources: [...FACTS.disi.sources, BIZ_SRC.mwiAug2026],
  },
  {
    id: 'utilities', tag: 'B', color: '#1a6ff0', short: { ar: 'شركات المياه', en: 'Water companies' }, role: { ar: 'المشتري الثاني', en: 'Second buyer' },
    name: { ar: 'شركات المياه: مياهنا واليرموك والعقبة (GIS والفاقد)', en: 'Water companies: Miyahuna, Yarmouk, Aqaba (GIS and NRW)' },
    why: { ar: 'الفاقد 68% في المفرق و61% في البلقاء (2024/25). وعمّان وحدها سجّلت نحو 56 ألف إصلاح في 2025، وكل إصلاح زيارة ميدانية يجب أن تصل إلى السجل.', en: 'NRW is 68% in Mafraq and 61% in Balqa (2024/25). Amman alone logged about 56,000 repairs in 2025, each a field visit their records should hold.' },
    sources: [BIZ_SRC.nrwGov, BIZ_SRC.repairs],
  },
  {
    id: 'contractors', tag: 'C', color: '#8f5300', short: { ar: 'مقاولو الفاقد', en: 'NRW contractors' }, role: { ar: 'التالي', en: 'Next' },
    name: { ar: 'مقاولو الفاقد المدفوعون على النتائج', en: 'NRW contractors paid on results' },
    why: { ar: 'عقد أداء مع مياهنا منذ 2020 يشمل كشف الاستخدام غير المشروع، وشراكة لثلث عمّان قيد الطرح. في المدينة يحتاجون البلاغ الميداني والسجلات، لا ترتيب الصور الفضائية.', en: 'A performance contract with Miyahuna since 2020 covers illegal use; a PPP for a third of Amman is in procurement. In the city they need field reporting and records, not satellite ranking.' },
    sources: [BIZ_SRC.orient, BIZ_SRC.ifc],
  },
  {
    id: 'carriers', tag: 'D', color: '#6f4bd8', short: { ar: 'مشغّلو النواقل', en: 'Carrier operators' }, role: { ar: 'التالي', en: 'Next' },
    name: { ar: 'مشغّلو النواقل: الديسي والناقل الوطني (BOT)', en: 'Carrier operators: Disi and the National Water Carrier (BOT)' },
    why: { ar: 'في جلسة التشاور حول دراسة الأثر البيئي للناقل الوطني (2022) نبّه أحد المشاركين إلى أن «الناس يسرقون المياه من ناقل الديسي»، وكان الرد المسجّل: على مطوّر المشروع أن يعدّ خطة أمنية لمعالجة السرقة وينفّذها.', en: 'At the National Carrier’s ESIA consultation (2022), a participant warned that “people are stealing water from Al-Disi Conveyor”; the recorded reply: the BOT developer must prepare and implement a security plan to address theft.' },
    sources: [BIZ_SRC.carrierEsia],
  },
  {
    id: 'funders', tag: 'F', color: '#011c47', dashed: true, short: { ar: 'برامج التمويل', en: 'Funding programmes' }, role: { ar: 'يدفع التجربة', en: 'Pays the pilot' },
    name: { ar: 'برامج تموّل خفض الفاقد', en: 'Programmes funding water-loss cuts' },
    why: { ar: 'البنك الدولي خصّص 209 ملايين دولار للفاقد، وقرض بنك الاستثمار الأوروبي يُصرف على النتائج.', en: 'The World Bank set aside USD 209m for NRW; the EIB loan is paid out against results.' },
    sources: [BIZ_SRC.wb, BIZ_SRC.eibRbf],
  },
]

export const USERS: Text = {
  ar: 'يستخدمه: فرق التفتيش، ومهندسو الفاقد، وموظفو GIS. ويستفيد منه في النهاية: بيوت آخر الخط التي لا يصلها ما يُسحب قبلها.',
  en: 'Used by inspection crews, water-loss engineers and GIS staff. Benefits, in the end, the homes at the end of the line that never get what is drawn off before them.',
}

/* ------------------------------------------------------------------ canvas blocks */

export type Item = { text: Text; for?: SegmentId[]; sources?: Source[]; estimate?: boolean }
export type BlockId = 'partners' | 'activities' | 'resources' | 'value' | 'relationships' | 'channels' | 'segments' | 'costs' | 'revenue'
export type Block = { id: BlockId; n: string; title: Text; question: Text; items: Item[]; note?: Text }

export const BLOCKS: Record<Exclude<BlockId, 'segments'>, Block> = {
  value: {
    id: 'value', n: '02',
    title: { ar: 'القيمة المقدّمة', en: 'Value propositions' },
    question: { ar: 'لماذا يدفعون؟', en: 'Why would they pay?' },
    items: [
      { for: ['waj', 'carriers'], text: { ar: 'أين نبحث، ولماذا: مواقع مرتّبة على امتداد الخطوط الصحراوية، لكل منها بطاقة دليل قبل/بعد، ولا اتهام فيها.', en: 'Where to look, and why: ranked sites along desert carrier lines, each with a before/after evidence card and no accusation.' } },
      { for: ['waj', 'utilities', 'contractors'], text: { ar: 'بلاغ عربي بلا ورق: صوت أو نص أو صورة باللهجة، وحقول مع كلمات الطاقم نفسها، ولا شيء مخترَع.', en: 'Arabic reporting without paper: voice, text or photo in dialect, fields with the crew’s own words, nothing invented.' } },
      { for: ['utilities', 'contractors'], text: { ar: 'سجلات تتحسّن وحدها: كل وصلة غير مرسومة تصل مسودة تعديل بصيغة مياهنا نفسها، متقطّعة حتى يعتمدها مهندس.', en: 'Records that improve themselves: every unmapped connection arrives as a draft edit in Miyahuna’s own GIS format, dashed until an engineer approves it.' } },
      { for: ['waj', 'carriers'], text: { ar: 'أثر قابل للتدقيق: من أبلغ ومتى وماذا قال ومن اعتمد، لكل حالة تُتابَع قانونيًا (1,265 قضية اعتداء على المياه كانت منظورة أمام المحاكم في آب 2026).', en: 'An auditable trail: who reported, when, in what words, and who approved, for every case taken further (1,265 water-attack cases were pending in court in August 2026).' }, sources: [BIZ_SRC.mwiAug2026] },
      { for: ['funders', 'waj'], text: { ar: 'نتائج تُعَدّ: حالات إضافية مؤكّدة لم تكن في سجل المرفق، تناسب التمويل المرتبط بالنتائج.', en: 'Results you can count: extra confirmed cases that were not in the utility’s register, which fit results-based financing.' }, sources: [BIZ_SRC.eibRbf] },
      { text: { ar: 'تشغيل رخيص: الصور مجانية (والمنافسون يشترون رادارًا تجاريًا) والذكاء الاصطناعي بنحو قرشين للبلاغ، فيتبع السعر ما تُثبت التجربة أنه يوفّره، لا فاتورة بيانات.', en: 'Cheap to run: the imagery is free (competitors buy commercial radar) and the AI costs about JOD 0.02 a report, so the price can follow what the pilot shows it saves, not a data bill.' }, sources: [BIZ_SRC.sentinelFree, BIZ_SRC.asterraRadar, BIZ_SRC.aiPrice] },
    ],
  },
  channels: {
    id: 'channels', n: '03',
    title: { ar: 'القنوات', en: 'Channels' },
    question: { ar: 'كيف نصل إليهم؟', en: 'How do we reach them?' },
    items: [
      { for: ['funders', 'waj'], text: { ar: 'تجربة ممولة من برنامج قائم: البنك الدولي، أو GIZ في المفرق والكرك والطفيلة حتى 2028، أو جايكا في الجنوب.', en: 'A pilot funded by a running programme: the World Bank, GIZ in Mafraq, Karak and Tafilah to 2028, or JICA in the south.' }, sources: [BIZ_SRC.wb, BIZ_SRC.giz, BIZ_SRC.jicaNrw] },
      { for: ['funders'], text: { ar: 'سابقة لها موعد: تموّل جايكا بالكامل إثبات مفهوم بالذكاء الاصطناعي لشركة أردنية مع باحث جامعي، ومنها مشروع مياه بالأقمار والذكاء الاصطناعي؛ وتنتهي هذه الدورة في 31/12/2026 دون إعلان دورة لاحقة.', en: 'A precedent with a deadline: JICA fully funds AI proofs of concept by a Jordanian company with a university researcher, including a satellite-and-AI water project; this round ends on 31 Dec 2026 and no later round has been announced.' }, sources: [MARKET.jica.source, BIZ_SRC.growtech] },
      { for: ['utilities'], text: { ar: 'داخل Esri التي يستخدمونها: إنفوغراف، موزّع Esri الحصري منذ 1992، يخدم مياهنا والوزارة.', en: 'Inside the Esri they already use: InfoGraph, Esri’s exclusive distributor since 1992, serves Miyahuna and the ministry.' }, sources: [BIZ_SRC.infograph] },
      { for: ['contractors'], text: { ar: 'ترخيص للبلاغ الميداني والسجلات ضمن عقود الأداء، للمشغّل الذي يفوز بعقد فاقد عمّان.', en: 'A field-reporting and records licence inside performance contracts, for the operator that wins the Amman NRW contract.' }, sources: [BIZ_SRC.pppRfq] },
      { for: ['carriers'], text: { ar: 'رصد السرقة طبقةً في الخطة الأمنية لمطوّر الناقل، بجانب أي مورّد لكشف التسرّب.', en: 'Theft screening as a layer in the carrier developer’s security plan, beside any leak-detection vendor.' }, sources: [BIZ_SRC.carrierEsia] },
    ],
  },
  relationships: {
    id: 'relationships', n: '04',
    title: { ar: 'العلاقة مع العملاء', en: 'Customer relationships' },
    question: { ar: 'كيف نعمل معهم؟', en: 'How do we work with them?' },
    items: [
      { for: ['waj', 'utilities'], text: { ar: 'تجربة نصمّمها معهم: تتجدّد القائمة المرتّبة خلال الموسم الجاف (حزيران–أيلول)، وتعمل عليها الطواقم طوال السنة بدورة أسبوعية: زيارة ← بلاغ ← اعتماد.', en: 'A pilot designed with them: the ranked list is refreshed through the dry season (June–September) and worked all year on a weekly loop: visit → report → approve.' }, sources: [BIZ_SRC.chirps] },
      { for: ['waj', 'utilities', 'contractors'], text: { ar: 'تدريب الطواقم بالعربية على تطبيق واحد للصوت والنص والصورة.', en: 'Crew onboarding in Arabic, on one app for voice, text and photo.' } },
      { for: ['funders', 'waj'], text: { ar: 'لوحة نتائج مشتركة: الحالات الإضافية المؤكّدة مقابل الدوريات، والكلفة لكل حالة، ونسبة إعادة المخططات.', en: 'A shared scorecard: extra confirmed cases against patrols, cost per case, drawing rework rate.' } },
      { for: ['carriers'], text: { ar: 'تقرير شهري لرصد السرقة على الممر يدخل في الخطة الأمنية للمشغّل.', en: 'A monthly theft-screening report on the corridor, for the operator’s security plan.' } },
      { text: { ar: 'الإنسان صاحب القرار: النظام يقترح والمهندس يعتمد. المسارات والإحداثيات تبقى على خادم المرفق، والذكاء الاصطناعي لا يرى إلا نص البلاغ، ويمكن العمل بالقواعد وحدها ودون صوت.', en: 'People decide: the system suggests, engineers approve. Routes and coordinates stay on the utility’s server; the AI sees only the report text, and the rules engine can run alone, with voice off.' } },
    ],
  },
  revenue: {
    id: 'revenue', n: '05',
    title: { ar: 'مصادر الإيراد', en: 'Revenue streams' },
    question: { ar: 'كيف نتقاضى؟', en: 'How do we charge?' },
    items: [
      { for: ['funders'], text: { ar: 'التجربة: 10–12 أسبوعًا، ممر واحد ومنطقة واحدة، مبلغ ثابت يدفعه البرنامج.', en: 'The pilot: 10–12 weeks, one corridor and one district, a fixed fee paid by the programme.' } },
      { for: ['waj', 'carriers'], text: { ar: 'مراقبة الممرات: اشتراك سنوي لكل كيلومتر مع حدّ أدنى لكل جهة، وهي الوحدة التي يسعّر بها السوق.', en: 'Corridor monitoring: an annual subscription per kilometre with a minimum per buyer, the unit the market prices in.' }, sources: [BIZ_SRC.origin, MARKET.asterra.source] },
      { for: ['utilities', 'contractors'], text: { ar: 'البلاغ الميداني والسجلات: ترخيص سنوي لكل طاقم، ويعمل في المدن أيضًا.', en: 'Field reporting and records: an annual licence per crew, which works in cities too.' } },
      { for: ['funders', 'waj'], text: { ar: 'دفعة نتائج: عن كل حالة إضافية مؤكّدة من قائمتنا على الممرات المراقَبة، تثبتها طواقم المرفق نفسه.', en: 'A results payment: per extra confirmed case from our list on monitored corridors, verified by the utility’s own crews.' } },
      { for: ['utilities', 'contractors'], text: { ar: 'لمرة واحدة: الربط مع نظام GIS لدى المرفق وتدريب الطواقم.', en: 'One-off: connecting to the utility’s GIS and crew training.' } },
    ],
    note: { ar: 'السعر يُحدَّد بعد أن تقيس التجربة كلفة الدوريات وإعادة العمل اليوم. حاسبة التعادل أدناه تبيّن متى يغطي الاشتراك كلفته.', en: 'The price is set after the pilot measures what patrols and rework cost today. The break-even calculator below shows when the subscription pays for itself.' },
  },
  activities: {
    id: 'activities', n: '06',
    title: { ar: 'الأنشطة الرئيسية', en: 'Key activities' },
    question: { ar: 'ماذا نفعل كل أسبوع؟', en: 'What do we do every week?' },
    items: [
      { text: { ar: 'رصد التغيّر في صور الموسم الجاف وترتيب المواقع بصيغة معلنة.', en: 'Change detection on dry-season imagery and site ranking with a published formula.' } },
      { text: { ar: 'استخراج حقول البلاغ العربي مع الدليل، وتقييمه على بلاغات محجوزة.', en: 'Arabic report extraction with evidence, scored on held-out reports.' } },
      { text: { ar: 'الربط مع GIS: صيغة wMain، وتصدير EPSG:28191، والاعتماد، وسجل التدقيق.', en: 'GIS integration: the wMain schema, EPSG:28191 export, approval, audit trail.' } },
      { text: { ar: 'تشغيل التجارب مع الطواقم وقياس الحالات الإضافية.', en: 'Running pilots with crews and measuring extra cases.' } },
    ],
  },
  resources: {
    id: 'resources', n: '07',
    title: { ar: 'الموارد الرئيسية', en: 'Key resources' },
    question: { ar: 'على ماذا نعتمد؟', en: 'What do we rely on?' },
    items: [
      { text: { ar: 'أرشيف Sentinel-2 المجاني منذ 2017؛ ورادار NISAR، المجاني منذ 20 تموز 2026، للخطوة التالية: التسرّب تحت السطح.', en: 'The free Sentinel-2 archive since 2017; and NISAR radar, free since 20 July 2026, for the next step: leaks below the surface.' }, sources: [BIZ_SRC.sentinelFree, MARKET.nisar.source] },
      { text: { ar: 'منظومتنا: الترتيب، والاستخراج المقيّد بالدليل، وتصدير wMain، و35 بلاغًا اصطناعيًا موسومًا يدويًا.', en: 'Our pipeline: ranking, evidence-bound extraction, wMain export, 35 hand-labelled synthetic reports.' } },
      { text: { ar: 'معرفة السجلات الأردنية: رموز wMain، وأقطار البلاستيك والمعدن، وإزاحة شبكة فلسطين.', en: 'Know-how of Jordan’s records: wMain codes, plastic vs metal diameters, the Palestine Grid datum shift.' } },
      { text: { ar: 'فريق GIS وبيانات وعمليات ميدانية، وباحث ذكاء اصطناعي جامعي نضمّه (تمويل جايكا يشترطه).', en: 'A GIS, data and field-operations team, and a university AI researcher to bring in (JICA funding requires one).' }, sources: [MARKET.jica.source] },
    ],
  },
  partners: {
    id: 'partners', n: '08',
    title: { ar: 'الشركاء الرئيسيون', en: 'Key partners' },
    question: { ar: 'مَن نحتاج؟', en: 'Who do we need?' },
    items: [
      { text: { ar: 'سلطة المياه وشركات المياه: المسارات (تبقى عندهم)، والطواقم، والاعتماد. لم نتواصل معهم بعد، والتجربة أول ما نطلبه.', en: 'WAJ and the water companies: routes (kept with them), crews, approvals. Not yet approached; the pilot is our first ask.' } },
      { text: { ar: 'ممولون نتوجّه إليهم للتجربة: البنك الدولي، بنك الاستثمار الأوروبي، GIZ، جايكا، والخارجية الأمريكية (أكثر من 12 مشروع فاقد قيد التنفيذ في 2026).', en: 'Funders to approach for the pilot: World Bank, EIB, GIZ, JICA, and the US State Department (12+ water-loss projects under way in 2026).' }, sources: [BIZ_SRC.state] },
      { text: { ar: 'إنفوغراف (Esri) ومقاولو عقود الأداء: قنوات نتوجّه إليها.', en: 'InfoGraph (Esri) and performance-contract operators: channels to approach.' }, sources: [BIZ_SRC.infograph, BIZ_SRC.orient] },
      { text: { ar: 'مورّدون بشروطهم العامة دون اتفاق: كوبرنيكوس (Sentinel-2)، وناسا ووكالة الفضاء الهندية (NISAR)، وAnthropic (واجهة Claude).', en: 'Suppliers on public terms, no agreement needed: Copernicus (Sentinel-2), NASA–ISRO (NISAR), Anthropic (Claude API).' } },
    ],
  },
  costs: {
    id: 'costs', n: '09',
    title: { ar: 'هيكل التكاليف', en: 'Cost structure' },
    question: { ar: 'أين يذهب المال؟', en: 'Where does the money go?' },
    items: [
      { text: { ar: 'الفريق: الكلفة الثابتة الكبرى (مهندس GIS وبيانات، مطوّر، مسؤول عمليات ميدانية).', en: 'The team: the main fixed cost (GIS/data engineer, developer, field-operations lead).' } },
      { text: { ar: 'الصور الفضائية: صفر دينار.', en: 'Satellite imagery: JOD 0.' }, sources: [BIZ_SRC.sentinelFree] },
      { text: { ar: 'الذكاء الاصطناعي: نحو قرشين للبلاغ الواحد بالأسعار المعلنة.', en: 'AI: about JOD 0.02 per report at list prices.' }, sources: [BIZ_SRC.aiPrice], estimate: true },
      { text: { ar: 'خادم سحابي، أو خادم داخل المرفق حين تبقى البيانات عنده.', en: 'A cloud server, or one inside the utility when its data must stay there.' } },
      { text: { ar: 'دورة شراء حكومية طويلة نختصرها بتجارب تموّلها البرامج، وكلفة ثابتة نبقيها صغيرة: شركة تحليلات فضائية بريطانية دخلت الحراسة القضائية في 2023.', en: 'A long public sales cycle, shortened by programme-funded pilots, and fixed costs kept small: a UK satellite-analytics firm went into administration in 2023.' }, sources: [BIZ_SRC.rezatec] },
    ],
  },
}

/* ------------------------------------------------------------------ calculator */

export const USD_TO_JOD = 0.709 // the dinar's fixed peg

/** ASTERRA's public price signal: USD 70,000 a year for 373 miles of pipe (Kentucky, 2023). */
export const ASTERRA_JOD_PER_KM = Math.round(((70_000 / (373 * 1.609344)) * USD_TO_JOD) * 10) / 10

export const CALC = {
  /** JOD 1.93: what one cubic metre cost the government to supply in 2024 (IGC). */
  jodPerM3: { value: 1.93, source: BIZ_SRC.m3Cost },
  /** JOD 0.525: the top household tariff per cubic metre (same IGC article). */
  tariffTop: { value: 0.525, source: BIZ_SRC.m3Cost },
  /** Over 14,000 attacks of every kind in 2025 lost over 27 million m³: about 1,930 m³ each (our division). A placeholder. */
  m3PerCase: { value: Math.round(27_000_000 / 14_000 / 10) * 10, source: BIZ_SRC.attacks2025 },
  /** Disi: 1,802 attacks in 2025 over 325 km — all already found; for scale only. */
  disiAttacksPer100Km: Math.round((1802 / 325) * 100),
  /** Our assumption until the pilot measures it. */
  casesPer100Km: 3,
  priceRef: { value: ASTERRA_JOD_PER_KM, source: MARKET.asterra.source },
  alJafrM3PerDay: { value: 5000, source: BIZ_SRC.alJafr },
}

export const PRESETS: { id: string; km: number; label: Text; sources: Source[] }[] = [
  { id: 'disi', km: 325, label: { ar: 'خط الديسي · 325 كم', en: 'Disi line · 325 km' }, sources: [BIZ_SRC.disiLength] },
  { id: 'carrier', km: 440, label: { ar: 'الناقل الوطني · نحو 440 كم', en: 'National Carrier · ~440 km' }, sources: [BIZ_SRC.carrierLength] },
  { id: 'pilot', km: 100, label: { ar: 'ممر تجربة · 100 كم', en: 'Pilot corridor · 100 km' }, sources: [] },
]

/** Where scale comes from: corridor detection alone is small. */
export const SCALE: { text: Text; sources: Source[] } = {
  text: {
    ar: 'الرصد وحده سوق صغير: الديسي والناقل الوطني نحو 765 كم، أي قرابة 63 ألف دينار في السنة بسعر السوق المرجعي. أما الحجم فيأتي من البلاغ الميداني والسجلات على نحو 32 ألف كم من شبكات الشركات الثلاث (عمّان وحدها سجّلت نحو 56 ألف إصلاح في 2025)، ثم من المنطقة.',
    en: 'Detection alone is a small market: Disi and the National Carrier are about 765 km, roughly JOD 63,000 a year at the market reference price. Scale comes from field reporting and records across about 32,000 km of the three utilities’ networks (Amman alone logged about 56,000 repairs in 2025), and then from the region.',
  },
  sources: [BIZ_SRC.nrwGov, BIZ_SRC.repairs, BIZ_SRC.oman],
}

/* ------------------------------------------------------------------ risks, timing, questions */

export const RISKS: { assumption: Text; test: Text; ifWrong: Text }[] = [
  {
    assumption: { ar: 'القائمة المرتّبة تجد حالات إضافية لم تكن في سجل المرفق. في اختبارنا المكتبي لأعلى 40 موقعًا: نصفها إنذار كاذب واضح، و35% مزارع أو بيوت بلاستيكية جديدة، و15% غير مفسَّر.', en: 'The ranked list finds extra cases the utility’s register didn’t hold. In our desk test of the top 40 sites: half were obvious false alarms, 35% new farms or greenhouses, 15% unexplained.' },
    test: { ar: 'الحالات الإضافية المؤكّدة لكل 100 كم في السنة، مقارنةً بنقطة التعادل في الحاسبة (نحو 2.2 بسعر السوق المرجعي).', en: 'Extra confirmed cases per 100 km a year, against the calculator’s break-even (about 2.2 at the market reference price).' },
    ifWrong: { ar: 'إن بقيت دون التعادل بعد موسم: نوقف «الرصد» ونبيع البلاغ الميداني والسجلات وحدهما. خط الإيقاف هو نقطة التعادل نفسها.', en: 'Below break-even after a season: drop Detect, sell field reporting and records on their own. Our kill line is our break-even.' },
  },
  {
    assumption: { ar: 'جهة ما تدفع بعد التجربة.', en: 'Someone pays after the pilot.' },
    test: { ar: 'بند في موازنة أو طلب موقّع للسنة الثانية قبل الأسبوع 12.', en: 'A budget line or a signed year-2 order by week 12.' },
    ifWrong: { ar: 'نتوقف عن بيع الرصد لسلطة المياه، ونبيع عبر مقاولي عقود الأداء وخطة الناقل الأمنية.', en: 'Stop selling detection to WAJ; sell through performance-contract operators and the Carrier’s security plan.' },
  },
  {
    assumption: { ar: 'يشتري مشغّلو النواقل منّا لا من مورّدهم: سويز تشغّل الديسي وتشارك في تطوير الناقل وتبيع ASTERRA في بريطانيا.', en: 'Carrier operators buy from us, not their own vendor: SUEZ runs Disi, co-develops the Carrier and resells ASTERRA in the UK.' },
    test: { ar: 'نسأل في الأسبوع الأول: هل ترصد خدمتهم السرقة، وتأخذ بلاغ الطاقم بالعربية؟', en: 'Ask in week 1: does their service flag theft and take Arabic crew reports?' },
    ifWrong: { ar: 'إن لم تكن، نبيع رصد السرقة والسجلات طبقةً بجانب مورّد التسرّب.', en: 'If not, sell theft screening and records as a layer beside the leak vendor.' },
  },
  {
    assumption: { ar: 'المرفق يسمح بمعالجة مساراته وبلاغاته.', en: 'The utility lets us process its routes and reports.' },
    test: { ar: 'تشغيل النظام على خادم داخل المرفق؛ والذكاء الاصطناعي لا يرى إلا نص البلاغ.', en: 'Run on a server inside the utility; the AI sees only the report text.' },
    ifWrong: { ar: 'القواعد وحدها على خادمهم ودون صوت (94% من الحقول صحيحة على 25 بلاغًا اصطناعيًا محجوزًا).', en: 'Rules only, on their server, voice off (94% of fields right on 25 held-out synthetic reports).' },
  },
  {
    assumption: { ar: 'الذكاء الاصطناعي يقرأ لغة الطواقم الحقيقية.', en: 'The AI reads real crew language.' },
    test: { ar: 'تقييم بلاغات التجربة الحقيقية بالطريقة نفسها التي قيّمنا بها البلاغات المحجوزة.', en: 'Score real pilot reports the way we scored the held-out set.' },
    ifWrong: { ar: 'إن لم يتفوّق على القواعد، تبقى القواعد هي الأساس ويُستخدم Claude للمراجعة.', en: 'If it doesn’t beat the rules, rules stay the default and Claude assists review.' },
  },
]

export const WHY_NOW: { when: Text; what: Text; sources: Source[] }[] = [
  { when: { ar: '2025', en: '2025' }, what: { ar: 'خط الديسي يسجّل 1,802 اعتداء، أكثر من أي عام منذ 2014.', en: 'The Disi line logs 1,802 attacks, more than in any year since 2014.' }, sources: FACTS.disi.sources },
  { when: { ar: 'حتى 20 آب 2026', en: 'To 20 Aug 2026' }, what: { ar: '1,459 اعتداء آخر على الخط نفسه في 2026.', en: '1,459 more attacks on the same line in 2026.' }, sources: [BIZ_SRC.mwiAug2026] },
  { when: { ar: '2025–2026', en: '2025–2026' }, what: { ar: 'تمويل الناقل الوطني: 427 مليون يورو من بنك الاستثمار الأوروبي، و203 ملايين دولار منحة أمريكية، وحتى 1.6 مليار يورو من الاتحاد الأوروبي.', en: 'National Carrier financing: EUR 427m from the EIB, a USD 203m US grant, up to EUR 1.6bn from the EU.' }, sources: [BIZ_SRC.carrierEib, BIZ_SRC.carrierUs, BIZ_SRC.carrierEu] },
  { when: { ar: 'تموز 2026', en: 'Jul 2026' }, what: { ar: 'بيانات رادار NISAR تصبح مجانية.', en: 'NISAR radar data become free.' }, sources: [MARKET.nisar.source] },
  { when: { ar: 'نحو 2027', en: '~2027' }, what: { ar: 'بدء متوقّع لإنشاء الناقل (التواريخ تختلف بين المصادر)، ومحضر التشاور يطلب خطة أمنية ضد السرقة.', en: 'Carrier construction expected to start (dates vary by source); the consultation record asks for an anti-theft security plan.' }, sources: [BIZ_SRC.carrierTimeline, BIZ_SRC.carrierEsia] },
  { when: { ar: '2028', en: '2028' }, what: { ar: 'هدف البنك الدولي: 10 ملايين م³ أقل من الفاقد سنويًا، وآخر تقرير متابعة منشور (أيلول 2024) ما زال يُظهر صفرًا.', en: 'World Bank target: 10 million m³ a year less NRW; the latest published progress report (Sep 2024) still showed 0.' }, sources: [BIZ_SRC.wb, BIZ_SRC.wbProgress] },
]

/** Headline figures for the "why it matters" strip. */
export const STAKES: { value: Text; label: Text; sources: Source[] }[] = [
  { value: { ar: '350 مليون دينار', en: 'JOD 350m' }, label: { ar: 'كلفة الفاقد التقديرية على سلطة المياه والشركات الثلاث كل سنة', en: 'estimated yearly cost of water losses to WAJ and the three utilities' }, sources: [BIZ_SRC.nrwCost] },
  { value: { ar: '+14,000', en: '14,000+' }, label: { ar: 'اعتداء على الشبكات والمصادر في 2025، ضاع بسببها أكثر من 27 مليون م³', en: 'attacks on networks and sources in 2025, losing over 27 million m³' }, sources: [BIZ_SRC.attacks2025] },
  { value: { ar: '1.93 دينار', en: 'JOD 1.93' }, label: { ar: 'كلفة تزويد المتر المكعب الواحد على الحكومة (2024)', en: 'what one cubic metre cost the government to supply (2024)' }, sources: [BIZ_SRC.m3Cost] },
  { value: { ar: '4.2 مليون م³', en: '4.2m m³' }, label: { ar: 'وفّرتها تقديرًا هيئة المياه العُمانية بكشف التسرّب بالأقمار في 2019: المنطقة تشتري هذا', en: 'estimated saving by Oman’s water authority with satellite leak detection in 2019: the region buys this' }, sources: [BIZ_SRC.oman, BIZ_SRC.sewa] },
]

/** The questions a judge or a buyer is most likely to ask, with the team's answer. */
export const QA: { q: Text; a: Text; sources?: Source[] }[] = [
  {
    q: { ar: '«هذه الاعتداءات كشفناها أصلًا. ماذا تجدون أنتم ولا نجده نحن؟»', en: '“We already caught those attacks. What do you find that we don’t?”' },
    a: { ar: 'لا نحسب أيًّا منها. نحسب فقط الحالات التي تأتي من قائمتنا ولم تكن في سجلّكم، ونقارنها بدورياتكم على الممر نفسه. ونحو حالتين لكل 100 كم في السنة تكفيان لتغطية اشتراك بسعر السوق.', en: 'None of those count for us. We count only cases from our list that weren’t in your register, measured against your patrols on the same corridor, and about two per 100 km a year pay for a market-rate subscription.' },
  },
  {
    q: { ar: '«إيجاد الوصلة لا يعيد كلفة الضخ. لماذا 1.93 دينار؟»', en: '“Finding a tap doesn’t refund the pumping. Why JOD 1.93?”' },
    a: { ar: '1.93 دينار هي كلفة تزويد المتر على الحكومة، أي قيمة الماء الذي لا يصل إلى بيوت آخر الخط. وبأعلى تعرفة منزلية (0.525 دينار) يلزم نحو 8 حالات إضافية لكل 100 كم في السنة، والتجربة تبيّن في أي جهة من هذا الخط نقف.', en: 'JOD 1.93 is what each cubic metre costs the government to supply: the value of water the homes at the end of the line never get. At the top household tariff (JOD 0.525) it takes about 8 extra cases per 100 km a year, and the pilot shows which side of that line we are on.' },
    sources: [BIZ_SRC.m3Cost],
  },
  {
    q: { ar: '«من يدفع بعد التجربة؟ وهل سألتموهم؟»', en: '“Who pays after the pilot, and have you asked them?”' },
    a: { ar: 'ليس بعد. نطلب أن تُدفع التجربة من أموال الفاقد الملتزم بها أصلًا (209 ملايين دولار من البنك الدولي، وقرض بنك الاستثمار الأوروبي المرتبط بالنتائج). وإن لم يظهر بند في موازنة أو طلب للسنة الثانية قبل الأسبوع 12، نتوقف عن بيع الرصد لسلطة المياه.', en: 'Not yet. We ask for the pilot to be paid from NRW money already committed (the World Bank’s USD 209m, the EIB’s results-based loan); if there is no budget line or year-2 order by week 12, we stop selling detection to WAJ.' },
    sources: [BIZ_SRC.wb, BIZ_SRC.eibRbf],
  },
  {
    q: { ar: '«سويز تشغّل الديسي وتشارك في الناقل وتبيع ASTERRA. لماذا أنتم؟»', en: '“SUEZ runs Disi, co-develops the Carrier and resells ASTERRA. Why you?”' },
    a: { ar: 'رادار ASTERRA يبحث عن تسرّب الماء المعالَج تحت الأرض، ولا يُباع لرصد السرقة ولا لأخذ بلاغ الطاقم بالعربية ولا للكتابة في سجلات GIS الأردنية. نحن طبقة السرقة والسجلات بجانب مورّد التسرّب.', en: 'ASTERRA’s radar looks for treated-water leaks underground; it isn’t sold to flag theft, take Arabic crew reports or write back to Jordanian GIS. We sit beside their leak vendor as the theft-and-records layer.' },
    sources: [BIZ_SRC.disiLength, BIZ_SRC.carrierDeveloper, BIZ_SRC.suezAsterra, BIZ_SRC.asterraRadar],
  },
  {
    q: { ar: '«هذه بنية تحتية حساسة. أين تذهب البلاغات والصوت؟»', en: '“This is critical infrastructure. Where do reports and voice go?”' },
    a: { ar: 'المسارات والإحداثيات لا تغادر خادمكم، والذكاء الاصطناعي لا يرى إلا نص البلاغ. وإن لزم أن يبقى النص في الأردن، تعمل القواعد وحدها على خادمكم دون صوت (94% من الحقول صحيحة على 25 بلاغًا اصطناعيًا محجوزًا).', en: 'Routes and coordinates never leave your server, and the AI sees only the report text. If that must stay in Jordan too, the rules engine runs alone on your server with voice off (94% of fields right on 25 held-out synthetic reports).' },
  },
]

/** Earlier satellite work in Jordan: proof that the method finds illegal water use here. */
export const PRECEDENT: { text: Text; sources: Source[] } = {
  text: {
    ar: 'وليست الفكرة غريبة على الوزارة: استخدمت الاستشعار عن بعد منذ 2014 في الرمثا، فوجدت 51 ألف دونم مروية مقابل 21 ألفًا في السجلات.',
    en: 'Nor is the idea new to the ministry: it used remote sensing in Ramtha in 2014 and found 51,000 irrigated dunums against 21,000 on record.',
  },
  sources: [BIZ_SRC.ramtha],
}
