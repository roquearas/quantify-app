import { describe, expect, it, vi } from 'vitest'
import {
  bestSinapiSuggestion,
  formatScorePercent,
  scoreConfidence,
  suggestSinapi,
  type SinapiSuggestion,
} from './suggestSinapi'

function mockSupabase(response: {
  data: SinapiSuggestion[] | null
  error: { message: string } | null
}) {
  return {
    rpc: vi.fn().mockResolvedValue(response),
  } as unknown as Parameters<typeof suggestSinapi>[0]
}

const sample: SinapiSuggestion = {
  codigo: '92725',
  descricao: 'CONCRETO USINADO BOMBEADO FCK 25 MPA',
  unidade: 'm3',
  preco_unitario: 520.45,
  estado: 'SP',
  mes_referencia: '2025-03-01',
  desonerado: true,
  score: 0.82,
}

describe('scoreConfidence', () => {
  it('returns high for >= 0.6', () => {
    expect(scoreConfidence(0.6)).toBe('high')
    expect(scoreConfidence(0.99)).toBe('high')
  })

  it('returns medium for [0.4, 0.6)', () => {
    expect(scoreConfidence(0.4)).toBe('medium')
    expect(scoreConfidence(0.59)).toBe('medium')
  })

  it('returns low for < 0.4', () => {
    expect(scoreConfidence(0.3)).toBe('low')
    expect(scoreConfidence(0.39)).toBe('low')
    expect(scoreConfidence(0)).toBe('low')
  })
})

describe('formatScorePercent', () => {
  it('rounds to integer percent', () => {
    expect(formatScorePercent(0.826)).toBe('83%')
    expect(formatScorePercent(0.5)).toBe('50%')
    expect(formatScorePercent(0)).toBe('0%')
    expect(formatScorePercent(1)).toBe('100%')
  })
})

describe('suggestSinapi', () => {
  it('returns empty array when description is empty/whitespace (no RPC call)', async () => {
    const supabase = mockSupabase({ data: [sample], error: null })
    expect(await suggestSinapi(supabase, { description: '' })).toEqual([])
    expect(await suggestSinapi(supabase, { description: '   ' })).toEqual([])
    // rpc should not have been called
    expect((supabase as unknown as { rpc: ReturnType<typeof vi.fn> }).rpc).not.toHaveBeenCalled()
  })

  it('calls suggest_sinapi_composicao RPC with defaults', async () => {
    const supabase = mockSupabase({ data: [sample], error: null })
    const result = await suggestSinapi(supabase, { description: 'concreto 25' })
    expect(result).toEqual([sample])
    const rpc = (supabase as unknown as { rpc: ReturnType<typeof vi.fn> }).rpc
    expect(rpc).toHaveBeenCalledWith('suggest_sinapi_composicao', {
      p_description: 'concreto 25',
      p_estado: 'SP',
      p_mes_referencia: undefined,
      p_desonerado: true,
      p_limit: 5,
      p_threshold: 0.3,
    })
  })

  it('passes through explicit params', async () => {
    const supabase = mockSupabase({ data: [], error: null })
    await suggestSinapi(supabase, {
      description: 'alvenaria',
      estado: 'RJ',
      mesReferencia: '2025-02-01',
      desonerado: false,
      limit: 10,
      threshold: 0.5,
    })
    const rpc = (supabase as unknown as { rpc: ReturnType<typeof vi.fn> }).rpc
    expect(rpc).toHaveBeenCalledWith('suggest_sinapi_composicao', {
      p_description: 'alvenaria',
      p_estado: 'RJ',
      p_mes_referencia: '2025-02-01',
      p_desonerado: false,
      p_limit: 10,
      p_threshold: 0.5,
    })
  })

  it('trims description before calling RPC', async () => {
    const supabase = mockSupabase({ data: [], error: null })
    await suggestSinapi(supabase, { description: '  concreto  ' })
    const rpc = (supabase as unknown as { rpc: ReturnType<typeof vi.fn> }).rpc
    expect(rpc).toHaveBeenCalledWith(
      'suggest_sinapi_composicao',
      expect.objectContaining({ p_description: 'concreto' }),
    )
  })

  it('returns empty array when RPC returns null data', async () => {
    const supabase = mockSupabase({ data: null, error: null })
    expect(await suggestSinapi(supabase, { description: 'x' })).toEqual([])
  })

  it('throws when RPC returns error', async () => {
    const supabase = mockSupabase({ data: null, error: { message: 'boom' } })
    await expect(
      suggestSinapi(supabase, { description: 'x' }),
    ).rejects.toThrow('boom')
  })
})

describe('bestSinapiSuggestion', () => {
  it('returns top suggestion when present', async () => {
    const supabase = mockSupabase({ data: [sample], error: null })
    expect(await bestSinapiSuggestion(supabase, { description: 'concreto' })).toEqual(
      sample,
    )
  })

  it('forces limit=1 in RPC call', async () => {
    const supabase = mockSupabase({ data: [sample], error: null })
    await bestSinapiSuggestion(supabase, { description: 'concreto', limit: 10 })
    const rpc = (supabase as unknown as { rpc: ReturnType<typeof vi.fn> }).rpc
    expect(rpc).toHaveBeenCalledWith(
      'suggest_sinapi_composicao',
      expect.objectContaining({ p_limit: 1 }),
    )
  })

  it('returns null when no suggestions', async () => {
    const supabase = mockSupabase({ data: [], error: null })
    expect(await bestSinapiSuggestion(supabase, { description: 'xyz' })).toBeNull()
  })

  it('returns null when description is empty', async () => {
    const supabase = mockSupabase({ data: [sample], error: null })
    expect(await bestSinapiSuggestion(supabase, { description: '' })).toBeNull()
  })
})
