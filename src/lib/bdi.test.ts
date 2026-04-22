import { describe, expect, it } from 'vitest'
import {
  applyBdi,
  BDI_DEFAULTS,
  computeBdiFromBreakdown,
  parseBdiBreakdown,
} from './bdi'

describe('computeBdiFromBreakdown', () => {
  it('computes TCU formula for reference values', () => {
    // BDI = [(1 + 0.05 + 0.0035) * (1 + 0.08)] / (1 - 0.1065) - 1
    //     = (1.0535 * 1.08) / 0.8935 - 1
    //     = 1.13778 / 0.8935 - 1 ≈ 0.2734 ≈ 27.34%
    const out = computeBdiFromBreakdown(BDI_DEFAULTS)
    expect(out).toBeCloseTo(27.34, 1)
  })

  it('is zero when all components are zero', () => {
    expect(computeBdiFromBreakdown({ lucro: 0, impostos: 0, despesas_indiretas: 0, risco: 0 })).toBe(0)
  })

  it('equals lucro when only lucro is set (no impostos, no desp_ind, no risco)', () => {
    // BDI = [(1+0+0)*(1+0.08)]/(1-0) - 1 = 0.08 = 8%
    expect(computeBdiFromBreakdown({ lucro: 8, impostos: 0, despesas_indiretas: 0, risco: 0 })).toBe(8)
  })

  it('returns NaN when impostos >= 100% (division by zero or negative)', () => {
    expect(computeBdiFromBreakdown({ lucro: 5, impostos: 100, despesas_indiretas: 5, risco: 0 })).toBeNaN()
    expect(computeBdiFromBreakdown({ lucro: 5, impostos: 150, despesas_indiretas: 5, risco: 0 })).toBeNaN()
  })

  it('handles string inputs (coerces via Number)', () => {
    const out = computeBdiFromBreakdown({
      lucro: '8' as unknown as number,
      impostos: '10.65' as unknown as number,
      despesas_indiretas: '5' as unknown as number,
      risco: '0.35' as unknown as number,
    })
    expect(out).toBeCloseTo(27.34, 1)
  })

  it('coerces null/undefined to zero', () => {
    const out = computeBdiFromBreakdown({
      lucro: 8,
      impostos: null as unknown as number,
      despesas_indiretas: undefined as unknown as number,
      risco: 0,
    })
    // BDI = (1+0+0)*(1+0.08)/(1-0) - 1 = 0.08 = 8%
    expect(out).toBe(8)
  })
})

describe('applyBdi', () => {
  it('applies global BDI to all items when no overrides', () => {
    const out = applyBdi(
      [
        { total_cost: 100, bdi_override_percent: null },
        { total_cost: 200, bdi_override_percent: null },
      ],
      24,
    )
    // subtotal = 300, bdi = 300 * 0.24 = 72, total = 372
    expect(out.subtotal).toBe(300)
    expect(out.bdiAmount).toBe(72)
    expect(out.total).toBe(372)
    expect(out.bdiEffectivePercent).toBe(24)
  })

  it('uses override when present (even if zero)', () => {
    const out = applyBdi(
      [
        { total_cost: 100, bdi_override_percent: 28 }, // override 28%
        { total_cost: 100, bdi_override_percent: null }, // usa global 24%
        { total_cost: 100, bdi_override_percent: 0 },   // override 0% (válido)
      ],
      24,
    )
    // bdi = 100*0.28 + 100*0.24 + 100*0 = 28+24+0 = 52
    expect(out.subtotal).toBe(300)
    expect(out.bdiAmount).toBe(52)
    expect(out.total).toBe(352)
    expect(out.bdiEffectivePercent).toBeCloseTo(17.33, 1)
  })

  it('handles empty list', () => {
    const out = applyBdi([], 24)
    expect(out.subtotal).toBe(0)
    expect(out.bdiAmount).toBe(0)
    expect(out.total).toBe(0)
    expect(out.bdiEffectivePercent).toBe(0)
  })

  it('treats null/negative total_cost as 0', () => {
    const out = applyBdi(
      [
        { total_cost: null, bdi_override_percent: null },
        { total_cost: -50, bdi_override_percent: null },
        { total_cost: 100, bdi_override_percent: null },
      ],
      10,
    )
    // só o item 100 conta: bdi = 10
    expect(out.subtotal).toBe(100)
    expect(out.bdiAmount).toBe(10)
    expect(out.total).toBe(110)
  })

  it('uses 0% when global BDI is null/undefined/negative', () => {
    const out1 = applyBdi([{ total_cost: 100, bdi_override_percent: null }], null)
    expect(out1.total).toBe(100)
    const out2 = applyBdi([{ total_cost: 100, bdi_override_percent: null }], undefined)
    expect(out2.total).toBe(100)
    const out3 = applyBdi([{ total_cost: 100, bdi_override_percent: null }], -5)
    expect(out3.total).toBe(100)
  })

  it('rounds totals to 2 decimals', () => {
    const out = applyBdi([{ total_cost: 33.333, bdi_override_percent: null }], 24)
    // 33.333 * 1.24 = 41.33292 → 41.33
    expect(out.total).toBe(41.33)
  })
})

describe('parseBdiBreakdown', () => {
  it('parses a valid JSON object', () => {
    const out = parseBdiBreakdown({ lucro: 8, impostos: 10.65, despesas_indiretas: 5, risco: 0.35 })
    expect(out).toEqual({ lucro: 8, impostos: 10.65, despesas_indiretas: 5, risco: 0.35 })
  })

  it('returns null for null/undefined/array', () => {
    expect(parseBdiBreakdown(null)).toBeNull()
    expect(parseBdiBreakdown(undefined)).toBeNull()
    expect(parseBdiBreakdown([1, 2, 3])).toBeNull()
  })

  it('returns null for object without any BDI field', () => {
    expect(parseBdiBreakdown({ foo: 'bar' })).toBeNull()
  })

  it('coerces missing fields to 0 (partial object)', () => {
    const out = parseBdiBreakdown({ lucro: 10 })
    expect(out).toEqual({ lucro: 10, impostos: 0, despesas_indiretas: 0, risco: 0 })
  })
})
