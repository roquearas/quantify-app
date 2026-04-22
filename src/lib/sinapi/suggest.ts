import type { SupabaseClient } from '@supabase/supabase-js'

export type SinapiSuggestionType = 'INSUMO' | 'COMPOSICAO'

export interface SinapiSuggestion {
  item_id: string
  item_description: string
  sinapi_type: SinapiSuggestionType
  sinapi_id: string
  sinapi_codigo: string
  sinapi_descricao: string
  sinapi_unidade: string
  sinapi_preco_unitario: number
  similarity: number
}

export interface SuggestOptions {
  minSimilarity?: number
  estado?: string
  mesReferencia?: string
  desonerado?: boolean
}

/**
 * Fase 2F — batch fuzzy-match.
 *
 * Chama a RPC `suggest_sinapi_for_budget`, que:
 * - percorre items MANUAL/AI_DRAFT do budget,
 * - pra cada um, roda `search_sinapi` com a descrição do item,
 * - devolve o melhor match (só 1 por item), filtrado por similarity.
 *
 * Defaults da RPC:
 * - `estado`: `projects.state` do budget
 * - `mes_referencia`: último `sinapi_import_log.status='OK'` pra (estado, desonerado)
 * - `desonerado`: `true`
 * - `min_similarity`: `0.35`
 *
 * Erros (RPC): "Estado não resolvido" / "Nenhum import SINAPI OK".
 */
export async function suggestSinapiForBudget(
  supabase: SupabaseClient,
  budgetId: string,
  options: SuggestOptions = {},
): Promise<SinapiSuggestion[]> {
  const { data, error } = await supabase.rpc('suggest_sinapi_for_budget', {
    p_budget_id: budgetId,
    p_min_similarity: options.minSimilarity ?? 0.35,
    p_estado: options.estado ?? null,
    p_mes_referencia: options.mesReferencia ?? null,
    p_desonerado: options.desonerado ?? true,
  })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as SinapiSuggestion[]
}
