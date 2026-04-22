import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { BudgetPDF } from '@/lib/pdf/BudgetPDF'
import { computeBudgetHash } from '@/lib/pdf/budgetHash'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [bRes, iRes, vRes] = await Promise.all([
    supabase.from('budgets').select('*, projects!inner(*)').eq('id', id).single(),
    supabase.from('budget_items').select('*').eq('budget_id', id),
    supabase.from('validations').select('*').eq('budget_id', id).order('created_at'),
  ])

  if (bRes.error || !bRes.data) {
    return NextResponse.json({ error: 'Budget não encontrado' }, { status: 404 })
  }

  const budget = bRes.data
  const items = iRes.data || []
  const validations = vRes.data || []

  if (budget.status !== 'VALIDATED') {
    return NextResponse.json({ error: 'Budget precisa estar VALIDATED para gerar PDF', status: budget.status }, { status: 400 })
  }

  const finalValidation = [...validations]
    .reverse()
    .find(v => v.item_type === 'BUDGET' && v.status === 'VALIDATED')

  let validatorInfo: { name: string; crea: string | null; when: string } = {
    name: 'Engenheiro responsável',
    crea: null,
    when: budget.updated_at ?? new Date().toISOString(),
  }
  if (finalValidation) {
    const { data: u } = await supabase
      .from('users')
      .select('name, crea')
      .eq('id', finalValidation.validated_by)
      .single()
    if (u) {
      validatorInfo = {
        name: u.name,
        crea: u.crea,
        when: finalValidation.created_at,
      }
    }
  }

  const hashInput = {
    budget: {
      id: budget.id,
      version: budget.version,
      name: budget.name,
      status: budget.status,
      bdi_percentage: budget.bdi_percentage != null ? Number(budget.bdi_percentage) : null,
      total_cost: budget.total_cost != null ? Number(budget.total_cost) : null,
      price_base: budget.price_base as string,
      type: budget.type as string,
      memorial_md: budget.memorial_md,
    },
    items: items.map(it => ({
      id: it.id,
      code: it.code,
      description: it.description,
      unit: it.unit,
      quantity: Number(it.quantity),
      unit_cost: it.unit_cost != null ? Number(it.unit_cost) : null,
      total_cost: it.total_cost != null ? Number(it.total_cost) : null,
      confidence: it.confidence as string,
      category: it.category,
    })),
    validations: validations.map(v => ({
      id: v.id,
      status: v.status as string,
      item_type: v.item_type,
      item_name: v.item_name,
      comment: v.comment,
      created_at: v.created_at,
    })),
  }
  const hash = computeBudgetHash(hashInput)

  const project = budget.projects as Database['public']['Tables']['projects']['Row']

  const pdf = await renderToBuffer(
    BudgetPDF({
      budget: {
        id: budget.id,
        name: budget.name,
        version: budget.version,
        status: budget.status as string,
        type: budget.type as string,
        price_base: budget.price_base as string,
        bdi_percentage: budget.bdi_percentage != null ? Number(budget.bdi_percentage) : null,
        total_cost: budget.total_cost != null ? Number(budget.total_cost) : null,
        memorial_md: budget.memorial_md,
        created_at: budget.created_at,
      },
      project: {
        id: project.id,
        name: project.name,
        type: project.type as string,
        client_name: project.client_name,
        city: project.city,
        state: project.state,
        total_area: project.total_area != null ? Number(project.total_area) : null,
      },
      items: items.map(it => ({
        id: it.id,
        code: it.code,
        description: it.description,
        unit: it.unit,
        quantity: Number(it.quantity),
        unit_cost: it.unit_cost != null ? Number(it.unit_cost) : null,
        total_cost: it.total_cost != null ? Number(it.total_cost) : null,
        confidence: it.confidence as string,
        category: it.category,
      })),
      validations: validations.map(v => ({
        id: v.id,
        status: v.status as string,
        item_type: v.item_type,
        item_name: v.item_name,
        comment: v.comment,
        created_at: v.created_at,
      })),
      validator: validatorInfo,
      contentHash: hash,
      generatedAt: new Date().toISOString(),
    })
  )

  // Upload assíncrono — não bloqueia resposta
  const storagePath = `budgets/${budget.id}/v${budget.version}-${hash.slice(0, 8)}.pdf`
  void supabase.storage
    .from('project-documents')
    .upload(storagePath, pdf, { contentType: 'application/pdf', upsert: true })
    .catch(err => console.warn('[pdf] storage upload failed:', err))

  return new NextResponse(pdf as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="orcamento-v${budget.version}-${hash.slice(0, 8)}.pdf"`,
      'X-Budget-Hash': hash,
      'Cache-Control': 'private, max-age=0, no-cache',
    },
  })
}
