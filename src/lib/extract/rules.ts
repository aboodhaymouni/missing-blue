/**
 * Rule-based extractor for Arabic (incl. Jordanian dialect) field reports.
 *
 * It is the transparent baseline the brief asks for ("compared with simple keyword rules"),
 * and the offline fallback when no AI engine is configured. Every field it fills carries the
 * exact span of the crew's words; anything not mentioned stays empty (null).
 */
import { normaliseAr, toOriginal, type Normalised } from './normalize'
import type { Text } from '../../i18n/lang'

export type Outcome = 'illegal_connection' | 'leak' | 'licensed_use' | 'nothing_found'
export type Asset = 'main_line' | 'air_valve' | 'valve' | 'meter' | 'service_line' | 'well' | 'canal'
export type Flow = 'drip' | 'stream' | 'gush' | 'wet_ground'

export type Evidence = { start: number; end: number; text: string }
export type Field<T> = {
  value: T
  label: Text
  evidence: Evidence[]
  note?: Text
  candidates?: string[]
  /** true when the value needs an engineer's decision (e.g. "plastic" maps to several codes) */
  uncertain?: boolean
}

export type Extraction = {
  engine: 'rules' | 'claude'
  outcome: Field<Outcome> | null
  asset: Field<Asset> | null
  lineName: Field<string> | null
  material: Field<string | null> | null
  diameter: Field<number | null> | null
  location: Field<{ meters: number | null; reference: string }> | null
  depth: Field<number> | null
  count: Field<number> | null
  flow: Field<Flow> | null
  missingFromMap: Field<boolean> | null
  status: 'unconfirmed'
  warnings: Text[]
}

export const OUTCOME_LABEL: Record<Outcome, Text> = {
  illegal_connection: { ar: 'وصلة غير مرخّصة', en: 'Illegal connection' },
  leak: { ar: 'تسرّب', en: 'Leak' },
  licensed_use: { ar: 'استخدام مرخّص', en: 'Licensed use' },
  nothing_found: { ar: 'لم يُعثر على شيء', en: 'Nothing found' },
}

export const ASSET_LABEL: Record<Asset, Text> = {
  main_line: { ar: 'الخط الرئيسي', en: 'Main line' },
  air_valve: { ar: 'محبس هواء', en: 'Air valve' },
  valve: { ar: 'محبس', en: 'Valve' },
  meter: { ar: 'عدّاد', en: 'Meter' },
  service_line: { ar: 'خط فرعي / وصلة منزلية', en: 'Service line' },
  well: { ar: 'بئر', en: 'Well' },
  canal: { ar: 'قناة', en: 'Canal' },
}

export const FLOW_LABEL: Record<Flow, Text> = {
  drip: { ar: 'تنقيط', en: 'Dripping' },
  stream: { ar: 'جريان مستمر', en: 'Steady flow' },
  gush: { ar: 'تدفّق قوي', en: 'Gushing' },
  wet_ground: { ar: 'أرض رطبة / نبات', en: 'Wet ground / vegetation' },
}

// Miyahuna `piPipeMaterial` codes (observed in the public wMain schema).
export const MATERIAL_LABEL: Record<string, Text> = {
  PE: { ar: 'بولي إيثيلين (PE)', en: 'Polyethylene (PE)' },
  HDPE: { ar: 'بولي إيثيلين عالي الكثافة (HDPE)', en: 'HDPE' },
  PVC: { ar: 'بي في سي (PVC)', en: 'PVC' },
  SP: { ar: 'حديد / فولاذ (SP)', en: 'Steel pipe (SP)' },
  GP: { ar: 'مجلفن (GP)', en: 'Galvanised (GP)' },
  DIP: { ar: 'حديد مرن «دكتايل» (DIP)', en: 'Ductile iron (DIP)' },
  CAS: { ar: 'زهر (CAS)', en: 'Cast iron (CAS)' },
  AC: { ar: 'أسبست (AC)', en: 'Asbestos cement (AC)' },
}

/** Named carrier lines the crews mention. */
export const LINE_LABEL: Record<string, Text> = {
  Disi: { ar: 'خط الديسي', en: 'Disi conveyor' },
  KAC: { ar: 'قناة الملك عبدالله', en: 'King Abdullah Canal' },
  'Zara-Maain': { ar: 'خط الزارا-ماعين', en: "Zara–Ma'in line" },
}

/** "Plastic" without a type: several Miyahuna codes fit, so the engineer picks. */
export const PLASTIC: { candidates: string[]; label: Text; note: Text } = {
  candidates: ['PE', 'HDPE', 'PVC'],
  label: { ar: 'بلاستيك — يحتاج تحديد النوع', en: 'Plastic — type to confirm' },
  note: { ar: '«بلاستيك» يقابل أكثر من رمز في قائمة مياهنا (PE / HDPE / PVC). نحفظ كلمة الطاقم كما هي ونترك الرمز للمهندس.', en: '"Plastic" maps to several Miyahuna codes (PE / HDPE / PVC). We keep the crew\'s word and leave the code to the engineer.' },
}

// Miyahuna `piPipeDiameter_2` domain (mm), from the public wMain schema.
export const DIAMETER_DOMAIN = [17, 19, 25, 32, 50, 63, 75, 80, 99, 100, 110, 125, 150, 160, 180, 200, 250, 300, 400, 450, 500, 600, 700, 800, 900, 1000, 1200, 1300, 1400, 1500, 1600]

/** Inch → mm as the utilities write it. PE is sized by outside diameter; metal by nominal bore (DN). */
const PE_OD: Record<string, { mm: number; verified: boolean }> = {
  '0.5': { mm: 20, verified: false },
  '0.75': { mm: 25, verified: true },
  '1': { mm: 32, verified: true },
  '1.25': { mm: 40, verified: false },
  '1.5': { mm: 50, verified: false },
  '2': { mm: 63, verified: true },
  '3': { mm: 90, verified: false },
  '4': { mm: 110, verified: false },
  '6': { mm: 160, verified: false },
}
const METAL_DN: Record<string, { mm: number; verified: boolean }> = {
  '0.5': { mm: 15, verified: false },
  '0.75': { mm: 20, verified: false },
  '1': { mm: 25, verified: false },
  '1.5': { mm: 40, verified: false },
  '2': { mm: 50, verified: true },
  '3': { mm: 80, verified: false },
  '4': { mm: 100, verified: true },
  '6': { mm: 150, verified: false },
  '8': { mm: 200, verified: false },
}

// ---------- matching helpers ----------

const L = '\\p{L}\\p{N}'
/** Arabic-aware word: optional clitics (و/ف + ب/ل/ك + ال) before, limited letters after. */
function word(stem: string, suffix = 0) {
  const pre = '(?:و|ف)?(?:ب|ل|ك)?(?:ال)?'
  const suf = suffix > 0 ? `[\\p{L}]{0,${suffix}}` : ''
  return `(?<![${L}])${pre}(?:${stem})${suf}(?![${L}])`
}

type Hit = { s: number; e: number; m: RegExpExecArray }

/** Patterns are written by hand; give them the same letter normalisation as the text. */
function normPattern(p: string) {
  return p.replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
}

function findAll(n: Normalised, pattern: string): Hit[] {
  const re = new RegExp(normPattern(pattern), 'gu')
  const out: Hit[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(n.norm))) {
    out.push({ s: m.index, e: m.index + m[0].length, m })
    if (m[0].length === 0) re.lastIndex++
  }
  return out
}

function ev(src: string, n: Normalised, h: Hit): Evidence {
  const [s, e] = toOriginal(n, h.s, h.e)
  return { start: s, end: e, text: src.slice(s, e).trim() }
}

const NEG = /(?:ما\s*في|مافي|لا\s*يوجد|ما\s*فيه|بدون|ما|مش|لم|ولا|ليس|مفيش)\s*$/u
function negated(n: Normalised, at: number) {
  return NEG.test(n.norm.slice(Math.max(0, at - 14), at))
}

const AR_NUM: Record<string, number> = {
  'نص': 0.5, 'نصف': 0.5, 'ربع': 0.25, 'ثلاث ارباع': 0.75, 'ثلاثه ارباع': 0.75,
  'واحد': 1, 'اثنين': 2, 'اثنتين': 2, 'ثنتين': 2, 'ثلاث': 3, 'ثلاثه': 3, 'اربع': 4, 'اربعه': 4,
  'خمس': 5, 'خمسه': 5, 'ست': 6, 'سته': 6, 'ثمان': 8, 'ثمانيه': 8, 'عشر': 10, 'عشره': 10,
}

function parseNum(tok: string): number | null {
  const t = tok.trim()
  const frac = t.match(/^(\d+)\s*\/\s*(\d+)$/)
  if (frac) return Number(frac[1]) / Number(frac[2])
  const mixed = t.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/)
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3])
  if (/^\d+(?:\.\d+)?$/.test(t)) return Number(t)
  return AR_NUM[t] ?? null
}

// ---------- the extractor ----------

export function extractRules(src: string): Extraction {
  const n = normaliseAr(src)
  const warnings: Text[] = []
  const pick = <T,>(
    pats: { re: string; value: T; label: Text; checkNeg?: boolean }[],
  ): Field<T> | null => {
    for (const p of pats) {
      const hits = findAll(n, p.re).filter((h) => !(p.checkNeg && negated(n, h.s)))
      if (hits.length) return { value: p.value, label: p.label, evidence: hits.map((h) => ev(src, n, h)) }
    }
    return null
  }

  // Outcome: illegal beats leak beats licensed beats nothing-found (a visit can mention several).
  const illegalRe = [
    `${word('وصل(?:ه|ات|تين|تان)?|ربط|خط|بربيش|ماسوره|تمديد(?:ه)?')}\\s*(?:\\p{L}+\\s*){0,2}?(?:غير\\s*(?:مرخص|قانوني|شرعي|مشروع|نظامي)|مخالف)\\p{L}*`,
    word('غير\\s*مرخص', 2),
    word('اعتداء|تعدي|اعتداءات', 2),
    word('مسحوب|مسروق|سرق|سرقه', 2),
    word('وصلات?\\s*مخالف', 2),
  ].join('|')
  const leakRe = [
    word('تسريب|تسرب|كسر|مكسور|نزيز|شرخ', 2),
    word('بتنقط|بنقط|ينقط|تنقيط|بيشرشر|يشرشر|نافوره|طافح', 2),
    `${word('مي|مياه|المي')}\\s*${word('طالعه|بتطلع|نازله|بتسيل', 1)}`,
  ].join('|')
  const licensedRe = [word('(?<!غير\\s)مرخص(?:ه)?', 0), word('اشتراك(?:ها|ه)?\\s*نظامي', 1), word('نظامي(?:ه)?', 0), word('رخصه', 1)].join('|')
  const nothingRe = [
    `${word('ما|ولا')}\\s*(?:لقينا|وجدنا|شفنا|في)\\s*(?:اشي|شي|شيء|اي\\s*(?:اشي|شي|شيء))`,
    word('لم\\s*نجد|لا\\s*يوجد\\s*(?:اي|شي)', 3),
    word('كل\\s*اشي\\s*سليم|كله\\s*سليم|الوضع\\s*سليم|سليم\\s*100', 2),
    `${word('ما\\s*في|مافي|لا\\s*يوجد|ما\\s*لقينا', 0)}\\s*${word('تسريب|تسرب|اعتداء|اعتداءات|كسر|وصلات?|وصله', 1)}`,
    word('شغال\\s*تمام|كله\\s*تمام|تمام\\s*التمام', 0),
  ].join('|')

  let outcome: Field<Outcome> | null = null
  const ill = findAll(n, illegalRe).filter((h) => !negated(n, h.s))
  const leak = findAll(n, leakRe).filter((h) => !negated(n, h.s))
  const lic = findAll(n, licensedRe).filter((h) => !negated(n, h.s) && !/غير\s*$/u.test(n.norm.slice(Math.max(0, h.s - 5), h.s)))
  const none = findAll(n, nothingRe)
  if (ill.length) outcome = { value: 'illegal_connection', label: OUTCOME_LABEL.illegal_connection, evidence: ill.map((h) => ev(src, n, h)) }
  else if (leak.length) outcome = { value: 'leak', label: OUTCOME_LABEL.leak, evidence: leak.map((h) => ev(src, n, h)) }
  else if (lic.length) outcome = { value: 'licensed_use', label: OUTCOME_LABEL.licensed_use, evidence: lic.map((h) => ev(src, n, h)) }
  else if (none.length) outcome = { value: 'nothing_found', label: OUTCOME_LABEL.nothing_found, evidence: none.map((h) => ev(src, n, h)) }
  if (ill.length && leak.length) warnings.push({ ar: 'البلاغ يذكر وصلة مخالفة وتسرّبًا معًا؛ اعتمدنا «وصلة غير مرخّصة» ويحتاج تأكيد المهندس.', en: 'The report mentions both an illegal connection and a leak; we chose "illegal connection" pending the engineer.' })

  // Asset and named line
  const asset = pick<Asset>([
    { re: word('محبس\\s*(?:ال)?هوا(?:ء)?|بلف\\s*(?:ال)?هوا(?:ء)?|صمام\\s*(?:ال)?هواء', 0), value: 'air_valve', label: ASSET_LABEL.air_valve },
    { re: `${word('خط')}\\s*${word('رئيسي|ناقل|الديسي|ديسي|الزارا|زارا', 0)}|${word('الناقل', 0)}`, value: 'main_line', label: ASSET_LABEL.main_line },
    { re: word('قناه\\s*الملك\\s*عبد\\s*الله|القناه', 0), value: 'canal', label: ASSET_LABEL.canal },
    { re: `(?<!(?:جنب|بجانب|قرب|عند|حد|مقابل)\\s{1,3})${word('عداد', 2)}`, value: 'meter', label: ASSET_LABEL.meter },
    { re: `${word('خط')}\\s*${word('فرعي', 0)}|${word('وصله\\s*منزليه|اشتراك\\s*منزلي', 0)}`, value: 'service_line', label: ASSET_LABEL.service_line },
    { re: word('بئر|بير|ابار|بيار', 0), value: 'well', label: ASSET_LABEL.well },
    { re: word('محبس|بلف|صمام', 0), value: 'valve', label: ASSET_LABEL.valve },
  ])
  const lineName = pick<string>([
    { re: word('الديسي|ديسي', 0), value: 'Disi', label: LINE_LABEL.Disi },
    { re: word('قناه\\s*الملك\\s*عبد\\s*الله', 0), value: 'KAC', label: LINE_LABEL.KAC },
    { re: word('الزارا|زارا|زارا\\s*ماعين', 0), value: 'Zara-Maain', label: LINE_LABEL['Zara-Maain'] },
  ])

  // Material (Miyahuna codes). "Plastic" is ambiguous: keep the crew's words, offer candidates.
  let material: Field<string | null> | null = null
  const matPats: { re: string; code: string | null; cands?: string[] }[] = [
    { re: word('اتش\\s*دي|hdpe', 0), code: 'HDPE' },
    { re: word('بولي\\s*ايثيلين|بولي|pe', 0), code: 'PE' },
    { re: word('يو\\s*بي\\s*في\\s*سي|بي\\s*في\\s*سي|pvc|upvc', 0), code: 'PVC' },
    { re: word('بلاستيك|بلاستك|بلاستيكي|بربيش', 1), code: null, cands: ['PE', 'HDPE', 'PVC'] },
    { re: word('مجلفن|جلفنه|مجلفنه|جلفن', 1), code: 'GP' },
    { re: word('دكتايل|دكتيل|زهر\\s*مرن|حديد\\s*مرن', 0), code: 'DIP' },
    { re: word('زهر', 0), code: 'CAS' },
    { re: word('اسبست|اسبستوس|اترنيت', 0), code: 'AC' },
    { re: word('حديد|ستيل|فولاذ|ستانلس', 0), code: 'SP' },
  ]
  for (const p of matPats) {
    const hits = findAll(n, p.re)
    if (!hits.length) continue
    if (p.code) {
      material = { value: p.code, label: MATERIAL_LABEL[p.code], evidence: hits.map((h) => ev(src, n, h)) }
    } else {
      material = {
        value: null,
        label: PLASTIC.label,
        evidence: hits.map((h) => ev(src, n, h)),
        candidates: p.cands,
        uncertain: true,
        note: PLASTIC.note,
      }
    }
    break
  }
  const plasticFamily = material ? material.value === null || ['PE', 'HDPE', 'PVC'].includes(material.value) : false
  const metalFamily = material ? ['SP', 'GP', 'DIP', 'CAS'].includes(material.value ?? '') : false

  // Diameter
  let diameter: Field<number | null> | null = null
  const inchRe = `(\\d+\\s+\\d+\\s*/\\s*\\d+|\\d+\\s*/\\s*\\d+|\\d+(?:\\.\\d+)?|نص|نصف|ربع|ثلاث(?:ه)?\\s*ارباع|ثلاث(?:ه)?|اربع(?:ه)?|ست(?:ه)?|ثمان(?:يه)?|اثنين|واحد)\\s*(?:"|${word('انش|انشات|اينش|انج', 0)})`
  const twoInch = word('انشين|انشان', 0)
  const mmRe = `(\\d+)\\s*(?:${word('ملم|مم|ملي|مللي', 0)}|mm)`
  const inchHits = findAll(n, inchRe)
  const twoHits = findAll(n, twoInch)
  const mmHits = findAll(n, mmRe)
  if (mmHits.length) {
    const v = Number(mmHits[0].m[1])
    diameter = { value: v, label: { ar: `${v} ملم`, en: `${v} mm` }, evidence: [ev(src, n, mmHits[0])] }
  } else if (inchHits.length || twoHits.length) {
    const h = inchHits[0] ?? twoHits[0]
    const inches = inchHits.length ? parseNum(h.m[1] ?? '') : 2
    if (inches != null) {
      const key = String(inches)
      const said = { ar: `${inches === 0.75 ? '3/4' : inches === 0.5 ? '1/2' : inches} إنش`, en: `${inches === 0.75 ? '3/4' : inches === 0.5 ? '1/2' : inches} in` }
      const pe = PE_OD[key]
      const dn = METAL_DN[key]
      if (plasticFamily && pe) {
        diameter = {
          value: pe.mm,
          label: { ar: `${pe.mm} ملم (قطر خارجي)`, en: `${pe.mm} mm (outside diameter)` },
          evidence: [ev(src, n, h)],
          note: pe.verified
            ? { ar: `${said.ar} بلاستيك = ${pe.mm} ملم حسب مواصفة مياهنا للبولي إيثيلين (القطر الخارجي)، وليس تحويلًا حسابيًا.`, en: `${said.en} plastic = ${pe.mm} mm per Miyahuna's PE specification (outside diameter), not a straight conversion.` }
            : { ar: `مقاس قياسي للبولي إيثيلين؛ لم نجده مكتوبًا في وثائق مياهنا — يحتاج تأكيد.`, en: `Standard PE sizing; not found in Miyahuna's documents — to confirm.` },
          uncertain: !pe.verified,
        }
      } else if (metalFamily && dn) {
        diameter = {
          value: dn.mm,
          label: { ar: `DN${dn.mm} (قطر اسمي)`, en: `DN${dn.mm} (nominal bore)` },
          evidence: [ev(src, n, h)],
          note: { ar: `للقطع المعدنية: ${said.ar} = DN${dn.mm}.`, en: `For metal: ${said.en} = DN${dn.mm}.` },
          uncertain: !dn.verified,
        }
      } else {
        diameter = {
          value: null,
          label: { ar: `${said.ar} — يحتاج نوع المادة`, en: `${said.en} — needs the material` },
          evidence: [ev(src, n, h)],
          candidates: [pe ? `${pe.mm} mm (PE OD)` : '', dn ? `DN${dn.mm}` : ''].filter(Boolean),
          uncertain: true,
          note: { ar: 'المقاس بالإنش يختلف بين البلاستيك (قطر خارجي) والمعدن (قطر اسمي).', en: 'Inch sizes differ between plastic (outside diameter) and metal (nominal bore).' },
        }
      }
      if (diameter?.value != null && !DIAMETER_DOMAIN.includes(diameter.value)) {
        warnings.push({ ar: `القطر ${diameter.value} ملم غير موجود في قائمة أقطار مياهنا؛ سيبقى فارغًا عند التصدير.`, en: `${diameter.value} mm is not in Miyahuna's diameter list; it will be left empty on export.` })
      }
    }
  }

  // Location: "على بعد 15 متر من الشارع"
  let location: Field<{ meters: number | null; reference: string }> | null = null
  const locHits = findAll(n, `(?:${word('علي|ع', 0)}\\s*)?${word('بعد', 0)}\\s*(\\d+(?:\\.\\d+)?|${Object.keys(AR_NUM).join('|')})\\s*(?:${word('متر|مترا|امتار|م', 0)})\\s*(?:${word('من|عن', 0)})\\s*((?:ال)?\\p{L}+(?:\\s+(?:ال)?\\p{L}+)?)`)
  const locHits2 = locHits.length ? locHits : findAll(n, `(\\d+(?:\\.\\d+)?)\\s*(?:${word('متر|مترا|امتار|م', 0)})\\s*(?:${word('من|عن', 0)})\\s*((?:ال)?\\p{L}+(?:\\s+(?:ال)?\\p{L}+)?)`)
  if (locHits2.length) {
    const h = locHits2[0]
    const meters = parseNum(h.m[1]) ?? Number(h.m[1])
    const evid = ev(src, n, h)
    const refWords = evid.text.split(/\s+/).slice(-2).join(' ')
    location = { value: { meters, reference: refWords }, label: { ar: `${meters} م من ${refWords.replace(/^(من|عن)\s*/, '')}`, en: `${meters} m from ${refWords}` }, evidence: [evid] }
  } else {
    const near = findAll(n, `${word('جنب|بجانب|قرب|عند|حد|مقابل', 0)}\\s*((?:ال)?\\p{L}+(?:\\s+(?:ال)?\\p{L}+)?)`)
    if (near.length) {
      const evid = ev(src, n, near[0])
      location = { value: { meters: null, reference: evid.text }, label: { ar: evid.text, en: evid.text }, evidence: [evid] }
    }
  }

  // Depth
  let depth: Field<number> | null = null
  const dHits = findAll(n, `${word('عمق', 0)}\\s*(?:تقريبا\\s*)?(\\d+(?:\\.\\d+)?|نص|نصف|ربع|متر)\\s*(${word('متر|مترا|م|سم|سانتي', 0)})?`)
  if (dHits.length) {
    const h = dHits[0]
    let v = h.m[1] === 'متر' ? 1 : parseNum(h.m[1]) ?? Number(h.m[1])
    if (h.m[2] && /سم|سانتي/u.test(h.m[2])) v = v / 100
    depth = { value: v, label: { ar: `${v} م`, en: `${v} m` }, evidence: [ev(src, n, h)] }
  }

  // Count
  let count: Field<number> | null = null
  const twoConn = findAll(n, word('وصلتين|وصلتان|خطين', 0))
  const nConn = findAll(n, `(\\d+)\\s*${word('وصلات|وصله|خطوط|اعتداءات|وصلات\\s*مخالفه', 0)}`)
  if (nConn.length) count = { value: Number(nConn[0].m[1]), label: { ar: `${nConn[0].m[1]}`, en: `${nConn[0].m[1]}` }, evidence: [ev(src, n, nConn[0])] }
  else if (twoConn.length) count = { value: 2, label: { ar: '2', en: '2' }, evidence: [ev(src, n, twoConn[0])] }

  // Flow / signs
  const flow = pick<Flow>([
    { re: word('نافوره|بيطلع\\s*بقوه|طالعه\\s*بقوه|بقوه|ضغط\\s*عالي|فوار', 1), value: 'gush', label: FLOW_LABEL.gush, checkNeg: true },
    { re: word('بيشرشر|يشرشر|شرشره|بتسيل|سيل', 1), value: 'stream', label: FLOW_LABEL.stream, checkNeg: true },
    { re: word('بتنقط|بنقط|ينقط|تنقيط|نقط', 1), value: 'drip', label: FLOW_LABEL.drip, checkNeg: true },
    { re: word('رطوبه|مبلول|مبلوله|بركه|طين|اعشاب|خضار|عشب', 1), value: 'wet_ground', label: FLOW_LABEL.wet_ground, checkNeg: true },
  ])

  // Not on the map?
  const missing = findAll(n, `(?:${word('مش|غير|ما\\s*هو', 0)})\\s*(?:${word('مرسوم|موجود|مبين', 1)})\\s*(?:${word('علي|ع', 0)})\\s*(?:${word('الخريطه|الخارطه|المخطط|الخرايط|السيستم|النظام', 0)})|${word('مش\\s*علي\\s*الخريطه|خارج\\s*المخطط', 0)}`)
  const missingFromMap: Field<boolean> | null = missing.length
    ? { value: true, label: { ar: 'غير مرسوم على الخريطة', en: 'Not on the utility map' }, evidence: missing.map((h) => ev(src, n, h)) }
    : null

  if (!outcome) warnings.push({ ar: 'لم نجد نتيجة الزيارة في النص؛ تُترك فارغة.', en: 'No visit outcome found in the text; left empty.' })

  return {
    engine: 'rules',
    outcome,
    asset,
    lineName,
    material,
    diameter,
    location,
    depth,
    count,
    flow,
    missingFromMap,
    status: 'unconfirmed',
    warnings,
  }
}

/** Fields shown to the engineer, in display order. */
export const FIELD_ORDER: { key: keyof Extraction; label: Text }[] = [
  { key: 'outcome', label: { ar: 'النتيجة', en: 'Outcome' } },
  { key: 'asset', label: { ar: 'الأصل', en: 'Asset' } },
  { key: 'lineName', label: { ar: 'اسم الخط', en: 'Line' } },
  { key: 'material', label: { ar: 'المادة', en: 'Material' } },
  { key: 'diameter', label: { ar: 'القطر', en: 'Diameter' } },
  { key: 'location', label: { ar: 'الموقع', en: 'Location' } },
  { key: 'depth', label: { ar: 'العمق', en: 'Depth' } },
  { key: 'count', label: { ar: 'العدد', en: 'Count' } },
  { key: 'flow', label: { ar: 'شدة الجريان', en: 'Flow' } },
  { key: 'missingFromMap', label: { ar: 'على الخريطة؟', en: 'On the map?' } },
]
