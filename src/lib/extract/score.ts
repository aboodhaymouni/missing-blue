/**
 * Scoring for the extraction evaluation: compares an Extraction with hand labels, field by field.
 * An empty field that should be empty counts as correct; filling a field the report does not
 * state is the error we care most about.
 */
import type { Extraction, Field } from './rules'
import type { Expected, EvalItem } from '../../data/eval-set'

export const SCORED_FIELDS = ['outcome', 'asset', 'lineName', 'material', 'diameter', 'location', 'depth', 'count', 'flow', 'missingFromMap'] as const
export type ScoredField = (typeof SCORED_FIELDS)[number]
export type Value = string | number | boolean | null

/** Reduce an Extraction to comparable values, using the label conventions in data/eval-set.ts. */
export function comparable(x: Extraction): Record<ScoredField, Value> {
  return {
    outcome: x.outcome?.value ?? null,
    asset: x.asset?.value ?? null,
    lineName: x.lineName?.value ?? null,
    material: x.material ? (x.material.value ?? 'PLASTIC') : null,
    diameter: x.diameter ? (x.diameter.value ?? 'UNRESOLVED') : null,
    location: x.location ? (x.location.value.meters ?? 'LANDMARK') : null,
    depth: x.depth?.value ?? null,
    count: x.count?.value ?? null,
    flow: x.flow?.value ?? null,
    missingFromMap: x.missingFromMap?.value ? true : null,
  }
}

const same = (a: Value, b: Value) => (typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < 1e-6 : a === b)

export type Verdict = 'correct' | 'false-fill' | 'missed' | 'wrong'
export type FieldResult = { expected: Value; got: Value; verdict: Verdict }
export type ItemResult = {
  id: string
  fields: Record<ScoredField, FieldResult>
  correct: number
  /** filled fields whose evidence is not the report's own words at the stated position */
  unsupported: number
  /** the extraction claimed to be confirmed before an engineer looked at it */
  confirmed: boolean
}

function supported(text: string, f: Field<unknown> | null) {
  if (!f) return true
  return f.evidence.length > 0 && f.evidence.every((e) => e.text.length > 0 && text.slice(e.start, e.end).trim() === e.text)
}

export function scoreItem(item: EvalItem, x: Extraction): ItemResult {
  const got = comparable(x)
  const fields = {} as Record<ScoredField, FieldResult>
  let correct = 0
  let unsupported = 0
  for (const k of SCORED_FIELDS) {
    const e = item.expected[k as keyof Expected] as Value
    const g = got[k]
    const verdict: Verdict = same(e, g) ? 'correct' : e === null ? 'false-fill' : g === null ? 'missed' : 'wrong'
    if (verdict === 'correct') correct++
    if (!supported(item.text, x[k] as Field<unknown> | null)) unsupported++
    fields[k] = { expected: e, got: g, verdict }
  }
  return { id: item.id, fields, correct, unsupported, confirmed: x.status !== 'unconfirmed' }
}

export type Summary = {
  n: number
  outcomeCorrect: number
  fieldsCorrect: number
  fieldsTotal: number
  falseFills: number
  missed: number
  wrong: number
  unsupported: number
  confirmed: number
  perField: Record<ScoredField, number>
}

export function summarise(results: ItemResult[]): Summary {
  const perField = Object.fromEntries(SCORED_FIELDS.map((k) => [k, 0])) as Record<ScoredField, number>
  const s: Summary = { n: results.length, outcomeCorrect: 0, fieldsCorrect: 0, fieldsTotal: results.length * SCORED_FIELDS.length, falseFills: 0, missed: 0, wrong: 0, unsupported: 0, confirmed: 0, perField }
  for (const r of results) {
    for (const k of SCORED_FIELDS) {
      const v = r.fields[k].verdict
      if (v === 'correct') perField[k]++
      else if (v === 'false-fill') s.falseFills++
      else if (v === 'missed') s.missed++
      else s.wrong++
    }
    if (r.fields.outcome.verdict === 'correct') s.outcomeCorrect++
    s.fieldsCorrect += r.correct
    s.unsupported += r.unsupported
    if (r.confirmed) s.confirmed++
  }
  return s
}
