/**
 * The business model's value calculator: what a corridor subscription costs a buyer, what the water
 * it helps protect is worth, and the break-even point. Pure arithmetic, no imports, so it can be tested
 * on its own (server/biz.test.ts).
 */
export type BizInputs = {
  /** kilometres of line monitored */
  km: number
  /** JOD per km per year */
  pricePerKm: number
  /** confirmed cases per 100 km per year that come from the ranked list */
  casesPer100Km: number
  /** cubic metres lost per case */
  m3PerCase: number
  /** JOD per cubic metre */
  jodPerM3: number
}

export type BizOutputs = {
  annualCost: number
  cases: number
  m3: number
  value: number
  net: number
  /** value per JOD spent; null when the service costs nothing */
  multiple: number | null
  /** cases per 100 km per year at which value equals cost; null when a case is worth nothing */
  breakEvenPer100Km: number | null
  /** the highest price per km at which the assumed cases still pay for the service */
  maxPricePerKm: number
  /** months of value needed to cover a year of cost; null when there is no value */
  paybackMonths: number | null
}

const clean = (x: number) => (Number.isFinite(x) && x > 0 ? x : 0)

export function roi(input: BizInputs): BizOutputs {
  const km = clean(input.km)
  const price = clean(input.pricePerKm)
  const rate = clean(input.casesPer100Km)
  const perCase = clean(input.m3PerCase) * clean(input.jodPerM3)
  const annualCost = km * price
  const cases = (km / 100) * rate
  const m3 = cases * clean(input.m3PerCase)
  const value = cases * perCase
  return {
    annualCost,
    cases,
    m3,
    value,
    net: value - annualCost,
    multiple: annualCost > 0 ? value / annualCost : null,
    breakEvenPer100Km: perCase > 0 ? (price * 100) / perCase : null,
    maxPricePerKm: (rate * perCase) / 100,
    paybackMonths: value > 0 ? (annualCost / value) * 12 : null,
  }
}

/** Days of an event losing `m3PerDay` that cost as much as `amount` JOD. */
export function daysToCost(amount: number, m3PerDay: number, jodPerM3: number) {
  const perDay = clean(m3PerDay) * clean(jodPerM3)
  return perDay > 0 ? clean(amount) / perDay : null
}
