/**
 * AI extraction client. Calls the local /api/extract endpoint (Claude, see server/extract-plugin.ts).
 * The model must quote the exact words behind every field; the server drops any field whose quote
 * is not in the report, and this file checks again, so a field never appears without its evidence.
 */
import { extractRules, FIELD_ORDER, MATERIAL_LABEL, OUTCOME_LABEL, ASSET_LABEL, FLOW_LABEL, DIAMETER_DOMAIN, LINE_LABEL, PLASTIC, type Extraction, type Field, type Evidence, type Outcome, type Asset, type Flow } from './rules'
import type { Text } from '../../i18n/lang'

export type AiStatus = { available: boolean; model?: string; reason?: string }

export async function aiStatus(): Promise<AiStatus> {
  try {
    const r = await fetch('./api/health', { cache: 'no-store' })
    if (!r.ok) return { available: false, reason: `HTTP ${r.status}` }
    return (await r.json()) as AiStatus
  } catch {
    return { available: false, reason: 'offline' }
  }
}

type AiField = { value: string | number | boolean | null; quote: string | null }
type AiResponse = {
  model: string
  fallback?: boolean
  fields: Record<string, AiField>
  notes?: Text[]
  dropped?: { field: string; quote: string | null }[]
  ms?: number
}

export type AiResult =
  | { ok: true; extraction: Extraction; model: string; dropped: number; ms: number }
  | { ok: false; error: string }

/** Why the AI could not run, in the engineer's words. */
export const AI_ERROR: Record<string, Text> = {
  'not-configured': { ar: 'الذكاء الاصطناعي غير مفعّل على هذا الجهاز.', en: 'AI is not configured on this machine.' },
  auth: { ar: 'مفتاح الذكاء الاصطناعي مرفوض.', en: 'The AI key was rejected.' },
  'rate-limited': { ar: 'طلبات كثيرة خلال دقيقة؛ حاول بعد قليل.', en: 'Too many requests this minute; try again shortly.' },
  'upstream-rate-limited': { ar: 'الخدمة مشغولة؛ حاول بعد قليل.', en: 'The AI service is busy; try again shortly.' },
  offline: { ar: 'لا اتصال بخدمة الذكاء الاصطناعي.', en: 'Cannot reach the AI service.' },
  refused: { ar: 'رفض النموذج هذا البلاغ.', en: 'The model declined this report.' },
}

function locate(text: string, quote: string | null): Evidence | null {
  if (!quote) return null
  const q = quote.trim()
  if (!q) return null
  const i = text.indexOf(q)
  if (i < 0) return null
  return { start: i, end: i + q.length, text: q }
}

/** Turn the checked server answer into the same Extraction shape the rules engine produces. */
export function toExtraction(text: string, res: AiResponse): Extraction {
  const base = extractRules(text)
  const out: Extraction = { ...base, engine: 'claude', warnings: [] }
  const f = res.fields || {}

  const build: { [K in keyof Extraction]?: (v: AiField['value'], e: Evidence) => Extraction[K] } = {
    outcome: (v, e) => (typeof v === 'string' && v in OUTCOME_LABEL ? { value: v as Outcome, label: OUTCOME_LABEL[v as Outcome], evidence: [e] } : null),
    asset: (v, e) => (typeof v === 'string' && v in ASSET_LABEL ? { value: v as Asset, label: ASSET_LABEL[v as Asset], evidence: [e] } : null),
    lineName: (v, e) => (typeof v === 'string' && v ? { value: v, label: LINE_LABEL[v] ?? { ar: v, en: v }, evidence: [e] } : null),
    material: (v, e) => {
      if (typeof v !== 'string') return null
      if (v in MATERIAL_LABEL) return { value: v, label: MATERIAL_LABEL[v], evidence: [e] }
      return { value: null, label: PLASTIC.label, evidence: [e], candidates: PLASTIC.candidates, uncertain: true, note: PLASTIC.note }
    },
    diameter: (v, e) => {
      if (typeof v === 'number' && Number.isFinite(v)) return { value: v, label: { ar: `${v} ملم`, en: `${v} mm` }, evidence: [e], uncertain: !DIAMETER_DOMAIN.includes(v) }
      return { value: null, label: { ar: `${e.text} — يحتاج نوع المادة`, en: `${e.text} — needs the material` }, evidence: [e], uncertain: true }
    },
    location: (v, e) => {
      const meters = typeof v === 'number' && Number.isFinite(v) ? v : null
      return { value: { meters, reference: e.text }, label: meters != null ? { ar: `${meters} م`, en: `${meters} m` } : { ar: e.text, en: e.text }, evidence: [e] }
    },
    depth: (v, e) => (typeof v === 'number' && Number.isFinite(v) ? { value: v, label: { ar: `${v} م`, en: `${v} m` }, evidence: [e] } : null),
    count: (v, e) => (typeof v === 'number' && Number.isFinite(v) ? { value: v, label: { ar: String(v), en: String(v) }, evidence: [e] } : null),
    flow: (v, e) => (typeof v === 'string' && v in FLOW_LABEL ? { value: v as Flow, label: FLOW_LABEL[v as Flow], evidence: [e] } : null),
    missingFromMap: (v, e) => (v === true ? { value: true, label: { ar: 'غير مرسوم على الخريطة', en: 'Not on the utility map' }, evidence: [e] } : null),
  }

  for (const { key } of FIELD_ORDER) {
    const make = build[key] as ((v: AiField['value'], e: Evidence) => unknown) | undefined
    const raw = f[key as string]
    const e = locate(text, raw?.quote ?? null)
    ;(out as Record<string, unknown>)[key] = make && raw && e ? make(raw.value, e) : null
  }

  // Keep the rules engine's Miyahuna-specific notes (e.g. 2 in PE = 63 mm) when both agree.
  for (const { key } of FIELD_ORDER) {
    const a = out[key] as Field<unknown> | null
    const b = base[key] as Field<unknown> | null
    if (a && b && JSON.stringify(a.value) === JSON.stringify(b.value) && b.note && !a.note) a.note = b.note
  }
  for (const n of res.notes ?? []) if (n?.ar && n?.en) out.warnings.push(n)
  for (const d of res.dropped ?? []) {
    const label = FIELD_ORDER.find((x) => x.key === d.field)?.label ?? { ar: d.field, en: d.field }
    out.warnings.push({ ar: `اقترح النموذج قيمة لحقل «${label.ar}» دون دليل في نص البلاغ، فحذفناها.`, en: `The model proposed a value for "${label.en}" with no evidence in the report, so it was removed.` })
  }
  return out
}

export async function extractAI(text: string): Promise<AiResult> {
  let res: AiResponse
  try {
    const r = await fetch('./api/extract', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text }) })
    if (!r.ok) {
      const body = (await r.json().catch(() => ({}))) as { error?: string }
      return { ok: false, error: body.error ?? `HTTP ${r.status}` }
    }
    res = (await r.json()) as AiResponse
  } catch {
    return { ok: false, error: 'offline' }
  }
  return { ok: true, extraction: toExtraction(text, res), model: res.model, dropped: res.dropped?.length ?? 0, ms: res.ms ?? 0 }
}
