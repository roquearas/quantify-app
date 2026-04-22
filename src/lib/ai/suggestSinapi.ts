import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Fase 2F: fuzzy-match SINAPI via pg_trgm.
 *
 * Fluxo:
 *  1. Agente (ou reviewer) chama `suggestSinapi` com a descrição de um item.
 *  2. RPC `suggest_sinapi_composicao` retorna top-N composições por similaridade.
 *  3. Reviewer aceita (→ `linkBudgetItemSinapi`) ou ignora.
 *
 * Threshold default 0.30 para evitar ruído — pg_trgm opera em [0, 1].
 */

export interface SinapiSuggestion {
  codigo: string
  descricao: string
  unidade: string
  preco_unitario: number
  estado: string
  mes_referencia: string
  desonerado: boolean
  /** Similaridade pg_trgm (0..1). Quanto maior, melhor. */
  score: number
}

export interface SuggestSinapiParams {
  description: string
  estado?: string
  mesReferencia?: string | null
  desonerado?: boolean
  limit?: number
  threshold?: number
}

/**
 * Heurística de confiança para UI:
 *  - ≥ 0.60 → alta (mostra o badge com destaque, pré-selecionável)
 *  - ≥ 0.40 → média (mostra badge neutro)
 *  - ≥ 0.30 → baixa (mostra como sugestão fraca)
 *  - < 0.30 → não sugere (RPC filtra)
 */
export type SuggestionConfidence = 'high' | 'medium' | 'low'

export function scoreConfidence(score: number): SuggestionConfidence {
  if (score >= 0.6) return 'high'
  if (score >= 0.4) return 'medium'
  return 'low'
}

/**
 * Wrapper do RPC `suggest_sinapi_composicao`.
 *
 * Retorna array vazio quando:
 *  - descrição é vazia/whitespace
 *  - nenhuma composição atinge o threshold
 *  - SINAPI ainda não foi importado (tabela vazia)
 */
export async function suggestSinapi(
  supabase: SupabaseClient,
  params: SuggestSinapiParams,
): Promise<SinapiSuggestion[]> {
  const description = (params.description ?? '').trim()
  if (!description) return []

  const { data, error } = await supabase.rpc('suggest_sinapi_composicao', {
    p_description: description,
    p_estado: params.estado ?? 'SP',
    p_mes_referencia: params.mesReferencia ?? undefined,
    p_desonerado: params.desonerado ?? true,
    p_limit: params.limit ?? 5,
    p_threshold: params.threshold ?? 0.3,
  })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as SinapiSuggestion[]
}

/**
 * Retorna a melhor sugestão (maior score) ou null.
 * Útil para o agente pré-preencher `suggested_sinapi_codigo` no budget_item.
 */
export async function bestSinapiSuggestion(
  supabase: SupabaseClient,
  params: SuggestSinapiParams,
): Promise<SinapiSuggestion | null> {
  const suggestions = await suggestSinapi(supabase, { ...params, limit: 1 })
  return suggestions[0] ?? null
}

/**
 * Formata score para UI (ex.: "87%").
 */
export function formatScorePercent(score: number): string {
  const pct = Math.round(score * 100)
  return `${pct}%`
}
