import type { SupabaseClient } from '@supabase/supabase-js'

export type SinapiType = 'INSUMO' | 'COMPOSICAO'
export type SinapiSearchType = 'insumo' | 'composicao' | 'both'

export interface SinapiSearchResult {
  tipo: SinapiType
  id: string
  codigo: string
  descricao: string
  unidade: string
  categoria_ou_grupo: string | null
  preco_unitario: number
  similarity: number
}

export interface SinapiSearchParams {
  query: string
  estado: string
  mesReferencia: string
  desonerado: boolean
  tipo?: SinapiSearchType
  limit?: number
}

export interface SinapiFilterOption {
  estado: string
  mesReferencia: string
  desonerado: boolean
}

export interface LinkBudgetItemSinapiParams {
  itemId: string
  userId: string
  sinapiType: SinapiType
  sinapiId: string
  updateCost?: boolean
}

export async function searchSinapi(
  supabase: SupabaseClient,
  params: SinapiSearchParams,
): Promise<SinapiSearchResult[]> {
  const { data, error } = await supabase.rpc('search_sinapi', {
    p_query: params.query,
    p_estado: params.estado,
    p_mes_referencia: params.mesReferencia,
    p_desonerado: params.desonerado,
    p_type: params.tipo ?? 'both',
    p_limit: params.limit ?? 20,
  })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as SinapiSearchResult[]
}

export async function linkBudgetItemSinapi(
  supabase: SupabaseClient,
  params: LinkBudgetItemSinapiParams,
): Promise<string> {
  const { data, error } = await supabase.rpc('link_budget_item_sinapi', {
    p_item_id: params.itemId,
    p_user_id: params.userId,
    p_sinapi_type: params.sinapiType,
    p_sinapi_id: params.sinapiId,
    p_update_cost: params.updateCost ?? true,
  })
  if (error) throw new Error(error.message)
  return data as string
}

/**
 * Lista combinações únicas (estado, mês, desonerado) com imports concluídos com sucesso.
 * Ordenado por mês desc (mais recente primeiro).
 */
export async function loadSinapiFilters(
  supabase: SupabaseClient,
): Promise<SinapiFilterOption[]> {
  const { data, error } = await supabase
    .from('sinapi_import_log')
    .select('estado, mes_referencia, desonerado')
    .eq('status', 'OK')
    .order('mes_referencia', { ascending: false })
  if (error) throw new Error(error.message)
  return dedupeFilters(
    (data ?? []).map((r) => ({
      estado: String(r.estado),
      mesReferencia: String(r.mes_referencia),
      desonerado: Boolean(r.desonerado),
    })),
  )
}

export function dedupeFilters(
  options: SinapiFilterOption[],
): SinapiFilterOption[] {
  const seen = new Set<string>()
  const out: SinapiFilterOption[] = []
  for (const opt of options) {
    const key = `${opt.estado}|${opt.mesReferencia}|${opt.desonerado}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(opt)
  }
  return out
}

/**
 * Formata preço BRL para exibição. (Pura — sem dependência de DOM.)
 */
export function formatSinapiPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}
