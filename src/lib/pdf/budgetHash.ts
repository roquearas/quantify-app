import { createHash } from 'node:crypto'

export interface BudgetHashInput {
  budget: {
    id: string
    version: number
    name: string
    status: string
    bdi_percentage: number | null
    total_cost: number | null
    price_base: string
    type: string
  }
  items: Array<{
    id: string
    code: string | null
    description: string
    unit: string
    quantity: number
    unit_cost: number | null
    total_cost: number | null
    confidence: string
    category: string | null
  }>
  validations: Array<{
    id: string
    status: string
    item_type: string | null
    item_name: string | null
    comment: string | null
    created_at: string
  }>
}

export function computeBudgetHash(input: BudgetHashInput): string {
  const canonical = {
    budget: sortKeys(input.budget),
    items: [...input.items].sort((a, b) => a.id.localeCompare(b.id)).map(sortKeys),
    validations: [...input.validations].sort((a, b) => a.created_at.localeCompare(b.created_at)).map(sortKeys),
  }
  const json = JSON.stringify(canonical)
  return createHash('sha256').update(json).digest('hex')
}

function sortKeys<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(obj).sort()) out[k] = obj[k]
  return out as T
}
