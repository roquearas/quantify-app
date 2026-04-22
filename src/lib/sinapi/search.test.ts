import { describe, expect, it } from 'vitest'
import { dedupeFilters, formatSinapiPrice } from './search'

describe('dedupeFilters', () => {
  it('dedupes combinations by estado+mes+desonerado', () => {
    const input = [
      { estado: 'SP', mesReferencia: '2026-03-01', desonerado: true },
      { estado: 'SP', mesReferencia: '2026-03-01', desonerado: true },
      { estado: 'SP', mesReferencia: '2026-03-01', desonerado: false },
      { estado: 'RJ', mesReferencia: '2026-03-01', desonerado: true },
    ]
    const out = dedupeFilters(input)
    expect(out).toHaveLength(3)
    expect(out[0]).toEqual(input[0])
    expect(out[1]).toEqual(input[2])
    expect(out[2]).toEqual(input[3])
  })

  it('preserves order (first occurrence wins)', () => {
    const out = dedupeFilters([
      { estado: 'SP', mesReferencia: '2026-03-01', desonerado: true },
      { estado: 'MG', mesReferencia: '2026-02-01', desonerado: false },
      { estado: 'SP', mesReferencia: '2026-03-01', desonerado: true },
    ])
    expect(out.map((o) => o.estado)).toEqual(['SP', 'MG'])
  })

  it('handles empty input', () => {
    expect(dedupeFilters([])).toEqual([])
  })
})

describe('formatSinapiPrice', () => {
  it('formats integer in BRL with 2 decimals', () => {
    const result = formatSinapiPrice(1234)
    // Supabase/Node Intl may use NBSP; normalize spacing
    expect(result.replace(/\s/g, ' ')).toMatch(/R\$\s?1\.234,00/)
  })

  it('formats fractional', () => {
    const result = formatSinapiPrice(42.5)
    expect(result.replace(/\s/g, ' ')).toMatch(/R\$\s?42,50/)
  })

  it('formats zero', () => {
    const result = formatSinapiPrice(0)
    expect(result.replace(/\s/g, ' ')).toMatch(/R\$\s?0,00/)
  })
})
