import { describe, expect, it } from 'vitest'
import { classifyCurvaAbc, summarizeCurvaAbc, type CurvaAbcRow } from './curvaAbc'

describe('classifyCurvaAbc', () => {
  it('ranks items by total_cost DESC', () => {
    const out = classifyCurvaAbc([
      { total_cost: 10, description: 'small' },
      { total_cost: 50, description: 'large' },
      { total_cost: 30, description: 'medium' },
    ])
    expect(out.map((r) => r.rank_position)).toEqual([1, 2, 3])
    expect(out.map((r) => r.description)).toEqual(['large', 'medium', 'small'])
  })

  it('tie-breaks by description ASC when total_cost equal', () => {
    const out = classifyCurvaAbc([
      { total_cost: 50, description: 'gamma' },
      { total_cost: 50, description: 'alpha' },
      { total_cost: 50, description: 'beta' },
    ])
    expect(out.map((r) => r.description)).toEqual(['alpha', 'beta', 'gamma'])
  })

  it('classifies using 80/95/100 thresholds (Pareto)', () => {
    // total = 170000; 80% = 136000, 95% = 161500
    const out = classifyCurvaAbc([
      { total_cost: 100000, description: 'a' }, // cum 100000 = 58.82% → A
      { total_cost: 40000, description: 'b' },  // cum 140000 = 82.35% → B
      { total_cost: 20000, description: 'c' },  // cum 160000 = 94.12% → B
      { total_cost: 10000, description: 'd' },  // cum 170000 = 100%  → C
    ])
    expect(out[0].classe_abc).toBe('A')
    expect(out[1].classe_abc).toBe('B')
    expect(out[2].classe_abc).toBe('B')
    expect(out[3].classe_abc).toBe('C')
  })

  it('puts items exactly at 80% boundary into A', () => {
    const out = classifyCurvaAbc([
      { total_cost: 80, description: 'a' },
      { total_cost: 20, description: 'b' },
    ])
    expect(out[0].classe_abc).toBe('A') // cum 80/100 = 0.80 → A (<=)
    expect(out[1].classe_abc).toBe('C') // cum 100/100 = 1.00 → C
  })

  it('returns null classification when budget total is zero', () => {
    const out = classifyCurvaAbc([
      { total_cost: 0, description: 'a' },
      { total_cost: null, description: 'b' },
    ])
    expect(out[0].classe_abc).toBeNull()
    expect(out[0].item_percent).toBeNull()
    expect(out[0].cumulative_percent).toBeNull()
    expect(out[1].classe_abc).toBeNull()
  })

  it('treats null total_cost as 0', () => {
    // Edge case: when one item dominates (100% of budget), strict Pareto puts it as C
    // (cumulative > 95%). Null item is 0% and trails as C.
    const out = classifyCurvaAbc([
      { total_cost: 100, description: 'a' },
      { total_cost: null, description: 'b' },
    ])
    expect(out[0].classe_abc).toBe('C')
    expect(out[0].item_percent).toBe(100)
    expect(out[1].classe_abc).toBe('C')
    expect(out[1].item_percent).toBe(0)
  })

  it('computes correct item_percent and cumulative_percent', () => {
    const out = classifyCurvaAbc([
      { total_cost: 60, description: 'a' },
      { total_cost: 30, description: 'b' },
      { total_cost: 10, description: 'c' },
    ])
    expect(out[0]).toMatchObject({ item_percent: 60, cumulative_percent: 60, classe_abc: 'A' })
    expect(out[1]).toMatchObject({ item_percent: 30, cumulative_percent: 90, classe_abc: 'B' })
    expect(out[2]).toMatchObject({ item_percent: 10, cumulative_percent: 100, classe_abc: 'C' })
  })

  it('handles single item (classe C by strict Pareto — no curve in degenerate case)', () => {
    // Degenerate: single item is 100% of budget, exceeds 95% threshold → C.
    // This matches SQL view behavior (consistency across platform).
    const out = classifyCurvaAbc([{ total_cost: 1000, description: 'only' }])
    expect(out).toHaveLength(1)
    expect(out[0].classe_abc).toBe('C')
    expect(out[0].item_percent).toBe(100)
    expect(out[0].cumulative_percent).toBe(100)
  })

  it('returns empty array for empty input', () => {
    expect(classifyCurvaAbc([])).toEqual([])
  })

  it('is a pure function (does not mutate input)', () => {
    const input = [
      { total_cost: 50, description: 'a' },
      { total_cost: 100, description: 'b' },
    ]
    const snapshot = JSON.parse(JSON.stringify(input))
    classifyCurvaAbc(input)
    expect(input).toEqual(snapshot)
  })
})

describe('summarizeCurvaAbc', () => {
  const rows = (overrides: Partial<CurvaAbcRow>[]): CurvaAbcRow[] =>
    overrides.map((o, i) => ({
      id: `id-${i}`,
      budget_id: 'budget-1',
      code: null,
      description: `item-${i}`,
      unit: 'un',
      quantity: 1,
      unit_cost: o.total_cost ?? 0,
      total_cost: o.total_cost ?? 0,
      category: null,
      confidence: null as unknown as string,
      origem: 'MANUAL',
      sinapi_codigo: null,
      sinapi_mes_referencia: null,
      rank_position: i + 1,
      budget_total: 0,
      cumulative_cost: 0,
      item_percent: null,
      cumulative_percent: null,
      classe_abc: null,
      ...o,
    }))

  it('counts items + cost per class and computes percent', () => {
    const stats = summarizeCurvaAbc(
      rows([
        { total_cost: 80, classe_abc: 'A' },
        { total_cost: 10, classe_abc: 'B' },
        { total_cost: 5, classe_abc: 'B' },
        { total_cost: 3, classe_abc: 'C' },
        { total_cost: 2, classe_abc: 'C' },
      ]),
    )
    expect(stats.totalCusto).toBe(100)
    expect(stats.totalItens).toBe(5)
    expect(stats.classeA).toEqual({ items: 1, custo: 80, percent: 80 })
    expect(stats.classeB).toEqual({ items: 2, custo: 15, percent: 15 })
    expect(stats.classeC).toEqual({ items: 2, custo: 5, percent: 5 })
  })

  it('handles empty input', () => {
    const stats = summarizeCurvaAbc([])
    expect(stats.totalCusto).toBe(0)
    expect(stats.totalItens).toBe(0)
    expect(stats.classeA.percent).toBe(0)
  })
})
