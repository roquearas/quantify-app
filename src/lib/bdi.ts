/**
 * BDI (Benefícios e Despesas Indiretas) — fórmula TCU 2622/2013 simplificada.
 *
 * Composição (em %):
 *   - lucro
 *   - impostos (ISS + PIS + COFINS + CPRB; federal + municipal consolidado)
 *   - despesas_indiretas (administração central + seguros + garantia + despesas financeiras)
 *   - risco
 *
 * Fórmula (todos em decimal):
 *   BDI = [(1 + desp_ind + risco) * (1 + lucro)] / (1 - impostos) - 1
 *
 * Aplicado em cascata sobre subtotal dos itens; cada item pode ter override
 * individual (`bdi_override_percent`) que suplanta o BDI global.
 */

export interface BdiBreakdown {
  /** Margem de lucro (%) */
  lucro: number
  /** Impostos totais (ISS + PIS + COFINS + CPRB) (%) */
  impostos: number
  /** Despesas indiretas: admin central + seguros + garantia + financeiras (%) */
  despesas_indiretas: number
  /** Risco / contingência (%) */
  risco: number
}

export interface BdiApplyItem {
  /** Subtotal do item antes de BDI */
  total_cost: number | null
  /** Override de BDI % no item. `null` = usa BDI global do orçamento. */
  bdi_override_percent: number | null
}

export interface BdiTotals {
  /** Soma dos subtotais sem BDI */
  subtotal: number
  /** Valor total do BDI em R$ (cada item usa seu BDI efetivo) */
  bdiAmount: number
  /** subtotal + bdiAmount */
  total: number
  /** BDI médio efetivo (%) = bdiAmount / subtotal * 100; 0 se subtotal=0 */
  bdiEffectivePercent: number
}

/**
 * Computa BDI % pela fórmula TCU a partir de um breakdown.
 * Retorna NaN se impostos ≥ 100% (divisão inválida).
 *
 * @example
 * computeBdiFromBreakdown({ lucro: 8, impostos: 10.65, despesas_indiretas: 5, risco: 0.35 })
 * // → ~24.46 (%)
 */
export function computeBdiFromBreakdown(b: Readonly<BdiBreakdown>): number {
  const lucro = num(b.lucro) / 100
  const impostos = num(b.impostos) / 100
  const despIndir = num(b.despesas_indiretas) / 100
  const risco = num(b.risco) / 100
  if (impostos >= 1) return Number.NaN
  const numerator = (1 + despIndir + risco) * (1 + lucro)
  const denominator = 1 - impostos
  const bdiDecimal = numerator / denominator - 1
  return round2(bdiDecimal * 100)
}

/**
 * Aplica BDI a uma lista de itens. Cada item usa `bdi_override_percent`
 * se presente, senão usa o `globalBdiPercent`.
 *
 * Itens com `total_cost` null/negativo são ignorados (tratados como 0).
 */
export function applyBdi(
  items: readonly BdiApplyItem[],
  globalBdiPercent: number | null | undefined,
): BdiTotals {
  const g = Math.max(0, num(globalBdiPercent))
  let subtotal = 0
  let bdiAmount = 0
  for (const it of items) {
    const cost = Math.max(0, num(it.total_cost))
    const effective = it.bdi_override_percent != null ? Math.max(0, num(it.bdi_override_percent)) : g
    subtotal += cost
    bdiAmount += cost * (effective / 100)
  }
  const total = subtotal + bdiAmount
  const bdiEffectivePercent = subtotal > 0 ? round2((bdiAmount / subtotal) * 100) : 0
  return {
    subtotal: round2(subtotal),
    bdiAmount: round2(bdiAmount),
    total: round2(total),
    bdiEffectivePercent,
  }
}

/** Valores de referência típicos (TCU 2622/2013, obra de edificação padrão). */
export const BDI_DEFAULTS: Readonly<BdiBreakdown> = Object.freeze({
  lucro: 8.0,
  impostos: 10.65,
  despesas_indiretas: 5.0,
  risco: 0.35,
})

/** Faixas de referência aceitáveis do TCU (para validação visual). */
export const BDI_RANGES = Object.freeze({
  lucro: { min: 6.16, max: 8.96 },
  impostos: { min: 0, max: 15 }, // varia por UF/regime
  despesas_indiretas: { min: 3.5, max: 8.0 },
  risco: { min: 0.0, max: 2.0 },
  total: { min: 18.0, max: 30.0 },
})

/**
 * Type guard + coerção para BdiBreakdown a partir de um valor JSON desconhecido.
 * Retorna null se não for um objeto com pelo menos um campo numérico válido.
 */
export function parseBdiBreakdown(value: unknown): BdiBreakdown | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const v = value as Record<string, unknown>
  const lucro = num(v.lucro)
  const impostos = num(v.impostos)
  const despIndir = num(v.despesas_indiretas)
  const risco = num(v.risco)
  const hasAny = (v.lucro ?? v.impostos ?? v.despesas_indiretas ?? v.risco) !== undefined
  if (!hasAny) return null
  return { lucro, impostos, despesas_indiretas: despIndir, risco }
}

function num(v: unknown): number {
  if (v === null || v === undefined) return 0
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
