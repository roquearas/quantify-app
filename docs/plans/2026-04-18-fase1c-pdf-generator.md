# Fase 1C — Gerador de PDF do Orçamento

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** budget VALIDATED vira PDF baixável com: cabeçalho Quantify, dados do projeto, tabela analítica de items, totalizadores com BDI, assinatura do engenheiro validador (nome + CREA + data), hash SHA-256 no rodapé.

**Architecture:** `@react-pdf/renderer` gera PDF server-side via API route. Hash SHA-256 sobre JSON canônico dos dados (budget + items + validations) garante determinismo. PDF salvo em Supabase Storage `project-documents/budgets/{id}-{hash8}.pdf` para re-download idempotente. Cliente baixa via GET `/api/budgets/[id]/pdf`.

**Tech Stack:** `@react-pdf/renderer` (já instalado), Next.js App Router API routes, Node `crypto` para hash, Supabase Storage.

**Spec de origem:** [`docs/specs/2026-04-18-fase1-fundacao-design.md`](../specs/2026-04-18-fase1-fundacao-design.md) §4.4

---

## Decisões de design

**Hash sobre conteúdo canônico, não sobre bytes do PDF**: SHA-256 de `JSON.stringify` (chaves ordenadas) de `{budget, items (ordered by id), validations (ordered by created_at)}`. Dois benefícios: (a) hash é estável mesmo se fonte/layout PDF mudar, (b) hash pode ser renderizado DENTRO do próprio PDF (não tem problema de chicken-and-egg).

**Storage path**: `project-documents/budgets/{budget_id}/v{version}-{hash8}.pdf`. Nomenclatura permite múltiplas versões e identifica alterações.

**Autorização**: API route lê `auth.uid()` via Supabase server client. RLS no `budgets` isola por `company_id` — user só acessa seus budgets.

**Sem AI ainda**: PDF é deterministic rendering. Não há geração narrativa, só dados estruturados.

---

## Pré-requisitos

- Fase 1B mergeada ou branch base acessível
- Fixture `a8135ff8-d764-4117-add6-92fa47be24f1` (budget VALIDATED, R$ 212.687,50)
- `@react-pdf/renderer` instalado (já feito)

---

## Tasks

### Task 1: Utilitário de hash canônico

**Files:**
- Create: `src/lib/pdf/budgetHash.ts`

Código completo:

```ts
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

/**
 * Gera hash SHA-256 de uma representação canônica dos dados do budget.
 * Chaves ordenadas, números normalizados, arrays ordenados por id/created_at.
 */
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
```

### Task 2: Template React PDF

**Files:**
- Create: `src/lib/pdf/BudgetPDF.tsx`

Template completo com `@react-pdf/renderer`. Tamanho ~200 linhas. Props:
- `budget`, `project`, `items`, `validations`, `validator` (user name + CREA), `contentHash`, `generatedAt`

Estrutura do PDF (A4 retrato):
1. Header: brand Quantify + logo placeholder + "Orçamento Analítico" + código (budget_id short)
2. Info box: project name, client, area, type, BDI, price_base, version
3. Tabela de items: colunas (código, descrição/categoria, unid, qtde, custo unit., total, confiança)
4. Totalizadores: subtotal, BDI (R$), total
5. Memorial: status do budget, lista de validations com timestamp
6. Footer (cada página): "Validado por [nome], CREA-[XX]-[número] em [data]. Hash SHA-256: [hash]"

### Task 3: API route de geração

**Files:**
- Create: `src/app/api/budgets/[id]/pdf/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { BudgetPDF } from '@/lib/pdf/BudgetPDF'
import { computeBudgetHash } from '@/lib/pdf/budgetHash'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // TODO: validar auth via token do header Authorization
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
    return NextResponse.json({ error: 'Budget precisa estar VALIDATED para gerar PDF' }, { status: 400 })
  }

  // Buscar validator (último VALIDATED item_type=BUDGET)
  const finalValidation = validations.filter(v => v.item_type === 'BUDGET' && v.status === 'VALIDATED').pop()
  let validatorInfo = { name: 'Engenheiro', crea: null as string | null, when: new Date().toISOString() }
  if (finalValidation) {
    const { data: u } = await supabase.from('users').select('name, crea').eq('id', finalValidation.validated_by).single()
    if (u) validatorInfo = { name: u.name, crea: u.crea, when: finalValidation.created_at }
  }

  const hash = computeBudgetHash({
    budget: {
      id: budget.id,
      version: budget.version,
      name: budget.name,
      status: budget.status,
      bdi_percentage: budget.bdi_percentage as number | null,
      total_cost: budget.total_cost as number | null,
      price_base: budget.price_base as string,
      type: budget.type as string,
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
  })

  const project = budget.projects as Database['public']['Tables']['projects']['Row']
  const pdf = await renderToBuffer(
    BudgetPDF({
      budget,
      project,
      items,
      validations,
      validator: validatorInfo,
      contentHash: hash,
      generatedAt: new Date().toISOString(),
    })
  )

  // Salvar no storage (async, não bloqueia retorno)
  const storagePath = `budgets/${budget.id}/v${budget.version}-${hash.slice(0, 8)}.pdf`
  supabase.storage.from('project-documents').upload(storagePath, pdf, {
    contentType: 'application/pdf',
    upsert: true,
  }).catch(err => console.warn('Storage upload failed:', err))

  return new NextResponse(pdf as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="orcamento-${budget.version}-${hash.slice(0, 8)}.pdf"`,
      'X-Budget-Hash': hash,
    },
  })
}
```

### Task 4: Botão "Baixar PDF" no AdminBudgetDetail

Modificar `src/views/admin/AdminBudgetDetail.tsx` para adicionar botão quando `budget.status === 'VALIDATED'`:

```tsx
{budget.status === 'VALIDATED' && (
  <a
    href={`/api/budgets/${budget.id}/pdf`}
    target="_blank"
    rel="noopener noreferrer"
    className="btn btn-primary"
  >
    <FileDown size={14} /> Baixar PDF
  </a>
)}
```

Import `FileDown` from `lucide-react`.

### Task 5: Teste E2E

- Rodar `npm run build` → deve passar
- Rodar `npm run dev`
- Acessar `/admin/orcamentos/a8135ff8-d764-4117-add6-92fa47be24f1`
- Clicar "Baixar PDF" → deve abrir PDF em nova aba
- Verificar: header, items, totalizadores, hash no footer
- Verificar: arquivo aparece em `project-documents/budgets/a8135ff8.../v1-XXXXXXXX.pdf`

## Definition of Done

- [ ] `src/lib/pdf/budgetHash.ts` exporta `computeBudgetHash`
- [ ] `src/lib/pdf/BudgetPDF.tsx` renderiza PDF com header/items/totais/footer/hash
- [ ] `GET /api/budgets/[id]/pdf` retorna PDF quando VALIDATED; 400 quando não; 404 quando não existe
- [ ] Botão "Baixar PDF" em AdminBudgetDetail aparece apenas em VALIDATED
- [ ] Hash determinístico (mesmo PDF → mesmo hash em re-download)
- [ ] Build passa
- [ ] PR aberto

## Próxima fase

**1D — Organização de documentos por project** + geração de PDF integrada ao fluxo cliente (proposta ↔ PDF).
