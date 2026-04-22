/**
 * Helpers de seed para E2E.
 *
 * Usa SERVICE_ROLE_KEY pra escrever direto, contornando RLS.
 * Env obrigatórios:
 * - `E2E_SUPABASE_URL` (ou `NEXT_PUBLIC_SUPABASE_URL`)
 * - `E2E_SERVICE_ROLE_KEY` (ou `SUPABASE_SERVICE_ROLE_KEY`)
 * - `E2E_ADMIN_EMAIL` — pra descobrir `company_id` do usuário de teste
 *
 * Cada seed retorna um `cleanup()` que remove o que criou (CASCADE em
 * project deleta budgets + items). A company e o user do admin não são
 * tocados — são setup permanente do ambiente de teste.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export interface SeedItemInput {
  description: string
  unit?: string
  quantity: number
  unit_cost: number
  category?: string
}

export interface SeededBudget {
  budgetId: string
  projectId: string
  companyId: string
  cleanup: () => Promise<void>
}

export interface SeedBudgetOptions {
  name: string
  items: SeedItemInput[]
  /** Estado usado no project (default: SP). Afeta a RPC de sugestão SINAPI. */
  state?: string
  /** BDI em % aplicado ao budget. Default: 20. */
  bdiPercentage?: number
  /** Status inicial. Default: IN_REVIEW (pronto pra revisar). */
  status?: 'AI_DRAFT' | 'IN_REVIEW' | 'VALIDATED' | 'REJECTED'
  /** Tipo do budget. Default: ANALYTICAL. */
  budgetType?: 'PARAMETRIC' | 'ANALYTICAL' | 'HYBRID' | 'ADDITIVE'
}

function serviceClient(): SupabaseClient {
  const url = process.env.E2E_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.E2E_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'seed: faltam E2E_SUPABASE_URL/E2E_SERVICE_ROLE_KEY (ou NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)',
    )
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Descobre o `company_id` do usuário admin de teste (via E2E_ADMIN_EMAIL).
 * Esse user é pré-criado e tem `is_super_admin=true` no ambiente de teste.
 */
async function getAdminCompanyId(db: SupabaseClient): Promise<string> {
  const email = process.env.E2E_ADMIN_EMAIL
  if (!email) throw new Error('seed: E2E_ADMIN_EMAIL não setado')
  const { data, error } = await db
    .from('users')
    .select('id, company_id')
    .eq('email', email)
    .single()
  if (error || !data) throw new Error(`seed: usuário admin ${email} não encontrado: ${error?.message ?? 'vazio'}`)
  if (!data.company_id) throw new Error(`seed: usuário admin ${email} sem company_id`)
  return data.company_id as string
}

/**
 * Cria project + budget (status default IN_REVIEW) + items MANUAL.
 * O budget e items herdam o company_id via `project.company_id` (RLS usa projeto).
 */
export async function seedBudgetInReview(opts: SeedBudgetOptions): Promise<SeededBudget> {
  const db = serviceClient()
  const companyId = await getAdminCompanyId(db)

  // 1) Project
  const { data: proj, error: projErr } = await db
    .from('projects')
    .insert({
      name: `E2E ${opts.name} ${Date.now()}`,
      type: 'RESIDENTIAL',
      status: 'STUDY',
      state: opts.state ?? 'SP',
      company_id: companyId,
    })
    .select('id')
    .single()
  if (projErr || !proj) throw new Error(`seed: falha ao criar project: ${projErr?.message}`)
  const projectId = proj.id as string

  // 2) Budget
  const { data: bud, error: budErr } = await db
    .from('budgets')
    .insert({
      name: opts.name,
      type: opts.budgetType ?? 'ANALYTICAL',
      status: opts.status ?? 'IN_REVIEW',
      price_base: 'SINAPI',
      bdi_percentage: opts.bdiPercentage ?? 20,
      project_id: projectId,
    })
    .select('id')
    .single()
  if (budErr || !bud) {
    await db.from('projects').delete().eq('id', projectId)
    throw new Error(`seed: falha ao criar budget: ${budErr?.message}`)
  }
  const budgetId = bud.id as string

  // 3) Items
  if (opts.items.length > 0) {
    const rows = opts.items.map((it) => ({
      description: it.description,
      unit: it.unit ?? 'un',
      quantity: it.quantity,
      unit_cost: it.unit_cost,
      total_cost: Number((it.quantity * it.unit_cost).toFixed(2)),
      category: it.category ?? null,
      origem: 'MANUAL',
      budget_id: budgetId,
    }))
    const { error: itErr } = await db.from('budget_items').insert(rows)
    if (itErr) {
      await db.from('projects').delete().eq('id', projectId) // cascata
      throw new Error(`seed: falha ao criar budget_items: ${itErr.message}`)
    }
  }

  return {
    budgetId,
    projectId,
    companyId,
    cleanup: async () => {
      // Deletar project cascata em budgets → budget_items
      await db.from('projects').delete().eq('id', projectId)
    },
  }
}
