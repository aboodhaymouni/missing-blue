/**
 * Tests for the business-model calculator (src/lib/biz.ts). Run: npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { daysToCost, roi } from '../src/lib/biz.ts'

const near = (a: number | null, b: number, tol = 0.01) => {
  assert.ok(a !== null, `expected ${b}, got null`)
  assert.ok(Math.abs(a - b) <= tol, `expected ${b}, got ${a}`)
}

test('the Disi defaults give the numbers the page shows', () => {
  // 325 km at JOD 82.7/km, 3 extra cases per 100 km, 1,930 m3 saved per case, JOD 1.93 per m3
  const r = roi({ km: 325, pricePerKm: 82.7, casesPer100Km: 3, m3PerCase: 1930, jodPerM3: 1.93 })
  near(r.annualCost, 26_877.5)
  near(r.cases, 9.75)
  near(r.m3, 18_817.5)
  near(r.value, 36_317.8, 0.1)
  near(r.multiple, 1.351, 0.001)
  near(r.breakEvenPer100Km, 2.220, 0.001) // 8,270 / 3,724.9
  near(r.maxPricePerKm, 111.747, 0.001)
  near(r.paybackMonths, 8.88, 0.01)
})

test('at the top household tariff the break-even rises to about 8 cases per 100 km', () => {
  const r = roi({ km: 325, pricePerKm: 82.7, casesPer100Km: 3, m3PerCase: 1930, jodPerM3: 0.525 })
  near(r.breakEvenPer100Km, 8.162, 0.001) // 8,270 / 1,013.25
  assert.ok(r.multiple !== null && r.multiple < 1, 'three cases do not pay at tariff value')
})

test('break-even is where value equals cost', () => {
  const base = { km: 440, pricePerKm: 120, m3PerCase: 1500, jodPerM3: 1.5 }
  const be = roi({ ...base, casesPer100Km: 1 }).breakEvenPer100Km!
  const r = roi({ ...base, casesPer100Km: be })
  near(r.net, 0, 1e-6)
  near(r.multiple, 1, 1e-9)
})

test('the max price is the price that breaks even at the assumed case rate', () => {
  const r = roi({ km: 100, pricePerKm: 50, casesPer100Km: 3, m3PerCase: 1000, jodPerM3: 2 })
  near(r.maxPricePerKm, 60) // 3 cases x 2,000 JOD / 100 km
  const atMax = roi({ km: 100, pricePerKm: r.maxPricePerKm, casesPer100Km: 3, m3PerCase: 1000, jodPerM3: 2 })
  near(atMax.net, 0, 1e-9)
})

test('nonsense input never produces NaN or negative money', () => {
  const r = roi({ km: -5, pricePerKm: Number.NaN, casesPer100Km: Infinity, m3PerCase: 0, jodPerM3: -1 })
  for (const v of [r.annualCost, r.cases, r.m3, r.value, r.net, r.maxPricePerKm]) assert.ok(Number.isFinite(v) && v >= 0)
  assert.equal(r.multiple, null)
  assert.equal(r.breakEvenPer100Km, null)
  assert.equal(r.paybackMonths, null)
})

test('daysToCost: an Al-Jafr-size event (5,000 m3/day) against a year of the Disi subscription', () => {
  near(daysToCost(26_877.5, 5000, 1.93), 2.785, 0.001)
  assert.equal(daysToCost(1000, 0, 1.93), null)
})
