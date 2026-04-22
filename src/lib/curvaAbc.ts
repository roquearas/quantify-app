import type { SupabaseClient } from '@supabase/supabase-js'

export type CurvaAbcClasse = 'A' | 'B' | 'C'

/** Linha crua vinda da view v_budget_items_curva_abc */
export interface CurvaAbcRow {
  id: string | null
  budget_id: string | null
  code: string | null
  description: string | null
  unit: string | null
  quantity: number | null
  unit_cost: number | null
  total_cost: number | null
  category: string | null
  origem: string | null
  sinapi_codigo: string | null
  sinapi_mes_referencia: string | null
  rank_position: number | null
  budget_total: number | null
  cumulative_cost: number | null
  item_percent: number | null
  cumulative_percent: number | null
  classe_abc: string | null
}

/** Estatísticas agregadas por classe */
export interface CurvaAbcStats {
  totalCusto: number
  totalItens: number
  classeA: { items: number; custo: number; percent: number }
  classeB: { items: number; custo: number; percent: number }
  classeC: { items: number; custo: number; percent: number }
}

export async function loadCurvaAbc(
  supabase: SupabaseClient,
  budgetId: string,
): Promise<CurvaAbcRow[]> {
  const { data, error } = await supabase
    .from('v_budget_items_curva_abc')
    .select('*')
    .eq('budget_id', budgetId)
    .order('rank_position', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as CurvaAbcRow[]
}

/**
 * Versão TypeScript-side da classificação ABC, usada como referência/fallback
 * e para testar o comportamento. A view SQL usa a mesma regra (80/95/100).
 *
 * @param items — itens com total_cost (null tratado como 0)
 * @returns itens ranqueados + classificados
 */
export function classifyCurvaAbc<T extends { total_cost: number | null; description?: string | null }>(
  items: readonly T[],
): Array<T & {
  rank_position: number
  item_percent: number | null
  cumulative_percent: number | null
  classe_abc: CurvaAbcClasse | null
}> {
  const budgetTotal = items.reduce((acc, it) => acc + Math.max(0, Number(it.total_cost ?? 0)), 0)

  const sorted = [...items].sort((a, b) => {
    const diff = Number(b.total_cost ?? 0) - Number(a.total_cost ?? 0)
    if (diff !== 0) return diff
    return String(a.description ?? '').localeCompare(String(b.description ?? ''))
  })

  let cumulative = 0
  return sorted.map((it, idx) => {
    const custo = Math.max(0, Number(it.total_cost ?? 0))
    cumulative += custo
    const itemPct = budgetTotal > 0 ? round2(custo / budgetTotal * 100) : null
    const cumulativePct = budgetTotal > 0 ? round2(cumulative / budgetTotal * 100) : null
    let classe: CurvaAbcClasse | null = null
    if (budgetTotal > 0) {
      const ratio = cumulative / budgetTotal
      classe = ratio <= 0.80 ? 'A' : ratio <= 0.95 ? 'B' : 'C'
    }
    return {
      ...it,
      rank_position: idx + 1,
      item_percent: itemPct,
      cumulative_percent: cumulativePct,
      classe_abc: classe,
    }
  })
}

/** Agrega stats por classe. */
export function summarizeCurvaAbc(rows: readonly CurvaAbcRow[]): CurvaAbcStats {
  const stats: CurvaAbcStats = {
    totalCusto: 0,
    totalItens: rows.length,
    classeA: { items: 0, custo: 0, percent: 0 },
    classeB: { items: 0, custo: 0, percent: 0 },
    classeC: { items: 0, custo: 0, percent: 0 },
  }

  for (const r of rows) {
    const custo = Number(r.total_cost ?? 0)
    stats.totalCusto += custo
    if (r.classe_abc === 'A') {
      stats.classeA.items += 1
      stats.classeA.custo += custo
    } else if (r.classe_abc === 'B') {
      stats.classeB.items += 1
      stats.classeB.custo += custo
    } else if (r.classe_abc === 'C') {
      stats.classeC.items += 1
      stats.classeC.custo += custo
    }
  }

  if (stats.totalCusto > 0) {
    stats.classeA.percent = round2(stats.classeA.custo / stats.totalCusto * 100)
    stats.classeB.percent = round2(stats.classeB.custo / stats.totalCusto * 100)
    stats.classeC.percent = round2(stats.classeC.custo / stats.totalCusto * 100)
  }

  return stats
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
