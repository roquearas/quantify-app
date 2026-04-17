import { supabase } from './supabase'

export type Porte = 'small' | 'medium' | 'large'
export type Urgencia = 'normal' | 'urgente' | 'express'
export type Tipologia = 'residencial' | 'comercial' | 'industrial' | 'infraestrutura'

export interface PricingMultipliers {
  porte?: Record<Porte, number>
  urgencia?: Record<Urgencia, number>
  tipologia?: Record<Tipologia, number>
}

export interface ServicePricing {
  id: string
  service_id: string
  base_price: number
  unit: string
  min_price: number | null
  max_price: number | null
  multipliers: PricingMultipliers
  from_price_display: string | null
}

export interface EstimateInput {
  pricing: ServicePricing
  /** Quantidade na unidade (m², CPU, lotes, etc). Se omitido, usa 1. */
  quantity?: number
  porte?: Porte
  urgencia?: Urgencia
  tipologia?: Tipologia
}

export interface EstimateResult {
  min: number
  max: number
  central: number
  quantity: number
  unit: string
  breakdown: {
    base_price: number
    quantity: number
    porte_factor: number
    urgencia_factor: number
    tipologia_factor: number
    subtotal: number
  }
  formatted: {
    range: string
    central: string
  }
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export function formatBRL(value: number): string {
  return BRL.format(value)
}

/**
 * Calcula estimativa de preço para um serviço.
 * Retorna faixa min/max (±20% da central) bounded pelos limites configurados.
 */
export function estimatePrice(input: EstimateInput): EstimateResult {
  const { pricing, quantity = 1, porte = 'medium', urgencia = 'normal', tipologia = 'residencial' } = input

  const porteFactor = pricing.multipliers?.porte?.[porte] ?? 1
  const urgenciaFactor = pricing.multipliers?.urgencia?.[urgencia] ?? 1
  const tipologiaFactor = pricing.multipliers?.tipologia?.[tipologia] ?? 1

  const subtotal = pricing.base_price * quantity * porteFactor * urgenciaFactor * tipologiaFactor

  // faixa ±20%, respeitando min/max absolutos
  const rawMin = subtotal * 0.85
  const rawMax = subtotal * 1.2

  const absoluteMin = pricing.min_price ?? 0
  const absoluteMax = pricing.max_price ?? Number.POSITIVE_INFINITY

  const min = Math.max(rawMin, absoluteMin)
  const max = Math.min(rawMax, absoluteMax)
  const central = Math.max(min, Math.min(max, subtotal))

  return {
    min,
    max,
    central,
    quantity,
    unit: pricing.unit,
    breakdown: {
      base_price: pricing.base_price,
      quantity,
      porte_factor: porteFactor,
      urgencia_factor: urgenciaFactor,
      tipologia_factor: tipologiaFactor,
      subtotal,
    },
    formatted: {
      range: `${formatBRL(min)} – ${formatBRL(max)}`,
      central: formatBRL(central),
    },
  }
}

/**
 * Busca o pricing configurado para um serviço pelo slug.
 * Retorna null se não houver pricing configurado.
 */
export async function getPricingBySlug(slug: string): Promise<ServicePricing | null> {
  const { data: service } = await supabase
    .from('services')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (!service) return null

  const { data } = await supabase
    .from('service_pricing')
    .select('*')
    .eq('service_id', (service as { id: string }).id)
    .maybeSingle()

  return (data as ServicePricing | null) ?? null
}

/**
 * Busca todos os pricings (usado na landing para mostrar "a partir de R$ X").
 */
export async function getAllPricings(): Promise<Record<string, ServicePricing>> {
  const { data } = await supabase
    .from('service_pricing')
    .select('*, services!inner(slug)')

  const map: Record<string, ServicePricing> = {}
  for (const row of (data ?? []) as Array<ServicePricing & { services: { slug: string } }>) {
    map[row.services.slug] = row
  }
  return map
}

/**
 * Heurística para inferir `porte` a partir de área em m².
 */
export function inferPorte(areaM2: number | null | undefined): Porte {
  if (!areaM2 || areaM2 <= 0) return 'medium'
  if (areaM2 < 150) return 'small'
  if (areaM2 > 1500) return 'large'
  return 'medium'
}

/**
 * Heurística para inferir `tipologia` a partir do texto do tipo de projeto.
 */
export function inferTipologia(projectType: string | null | undefined): Tipologia {
  if (!projectType) return 'residencial'
  const t = projectType.toLowerCase()
  if (t.includes('indust') || t.includes('galpão') || t.includes('galpao')) return 'industrial'
  if (t.includes('infra') || t.includes('rodov') || t.includes('ponte') || t.includes('saneamento')) return 'infraestrutura'
  if (t.includes('comerc') || t.includes('escrit') || t.includes('loja') || t.includes('varejo')) return 'comercial'
  return 'residencial'
}
