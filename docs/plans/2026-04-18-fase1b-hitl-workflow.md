# Fase 1B — HITL Workflow + UI de Review Item-por-Item

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** engenheiro revisa um `budget` item-por-item, aprovando/corrigindo/rejeitando cada linha. Cada ação registra uma `validation`. Ao aprovar todos os itens, o budget vai para `VALIDATED` — pronto pra virar proposta comercial.

**Architecture:** UI em `/admin/budgets/[id]/review` para review. Fluxo de estados do `budget.status` (enum `validation_status`): AI_DRAFT → IN_REVIEW → VALIDATED/REJECTED. Itens mantêm `confidence` (HIGH/MEDIUM/LOW = 🟢🟡🔴). Trilha em `validations` linka `user_id`, `budget_id`, item afetado, antes/depois (JSON em `changes`).

**Tech Stack:** Next.js 15 + React 19 + Supabase client tipado + Tailwind-ish CSS existente. Sem novos pacotes.

**Spec de origem:** [`docs/specs/2026-04-18-fase1-fundacao-design.md`](../specs/2026-04-18-fase1-fundacao-design.md) §4.3

---

## Pré-requisitos

- Fase 1A mergeada (ou branch base `feature/fase1a-schema-reconciliation` acessível)
- Migration 007 aplicada (trigger `trg_create_project_on_accept` ativa)
- Tipos em `src/lib/database.types.ts` alinhados com banco
- Pelo menos 1 `budget` com `status='AI_DRAFT'` e alguns `budget_items` para testar (criar via SQL se necessário)

## Convenções

- Branch: `feature/fase1b-hitl-workflow` (já criada)
- Worktree: `.worktrees/fase1b-hitl-workflow/`
- Commits: `feat(scope)`, `fix(scope)`, `chore:`, `docs:`
- Sem novos pacotes npm — só componentes React + Supabase queries

---

## Task 1: Seed de dados de teste (budget com items)

**Files:**
- Create: `scripts/seed-hitl-fixtures.ts`

Justificativa: pra implementar a UI precisamos de budgets com items em AI_DRAFT no banco. Cria via script (não migration — é dado de teste, não parte do schema).

- [ ] **Step 1: Criar o script**

```ts
// scripts/seed-hitl-fixtures.ts
#!/usr/bin/env node
import { Client } from 'pg'

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) { console.error('DATABASE_URL não definida'); process.exit(1) }

async function main() {
  const client = new Client({ connectionString: dbUrl })
  await client.connect()
  try {
    // 1. Pegar um project existente (ou criar)
    const proj = await client.query(`
      SELECT id, company_id FROM projects
      WHERE name ILIKE 'FIXTURE HITL%'
      LIMIT 1
    `)
    let projectId: string
    let companyId: string
    if (proj.rows.length === 0) {
      const newProj = await client.query(`
        INSERT INTO projects (name, type, status, company_id, client_name)
        VALUES (
          'FIXTURE HITL ' || to_char(now(), 'YYYYMMDDHH24MISS'),
          'RESIDENTIAL'::project_type,
          'STUDY'::project_status,
          (SELECT id FROM companies LIMIT 1),
          'Cliente Fixture'
        )
        RETURNING id, company_id
      `)
      projectId = newProj.rows[0].id
      companyId = newProj.rows[0].company_id
    } else {
      projectId = proj.rows[0].id
      companyId = proj.rows[0].company_id
    }

    // 2. Criar budget AI_DRAFT
    const budget = await client.query(`
      INSERT INTO budgets (name, version, type, status, price_base, project_id, bdi_percentage)
      VALUES (
        'Budget HITL fixture v' || to_char(now(), 'HH24MISS'),
        1,
        'ANALYTICAL'::budget_type,
        'AI_DRAFT'::validation_status,
        'SINAPI'::price_base,
        $1,
        25.0
      )
      RETURNING id
    `, [projectId])
    const budgetId = budget.rows[0].id

    // 3. Criar 5 budget_items com confianças variadas
    const items = [
      { code: '74209/001', desc: 'Concreto fck=30 MPa', unit: 'm3', qty: 125, unitCost: 485, conf: 'HIGH', origin: 'IMPORTED', cat: 'Estrutura' },
      { code: '73964/004', desc: 'Aço CA-50 cortado e dobrado', unit: 'kg', qty: 18750, unitCost: 8.5, conf: 'HIGH', origin: 'IMPORTED', cat: 'Estrutura' },
      { code: '87878', desc: 'Alvenaria bloco cerâmico', unit: 'm2', qty: 850, unitCost: 62.5, conf: 'MEDIUM', origin: 'AI_GENERATED', cat: 'Alvenaria' },
      { code: '89957', desc: 'Instalações elétricas (estimativa)', unit: 'vb', qty: 1, unitCost: 95000, conf: 'LOW', origin: 'AI_GENERATED', cat: 'Elétrica' },
      { code: '89711', desc: 'Instalações hidráulicas (estimativa)', unit: 'vb', qty: 1, unitCost: 68000, conf: 'LOW', origin: 'AI_GENERATED', cat: 'Hidráulica' },
    ]
    for (const it of items) {
      await client.query(`
        INSERT INTO budget_items (code, description, unit, quantity, unit_cost, total_cost, confidence, origin, category, budget_id)
        VALUES ($1, $2, $3, $4, $5, $4::numeric * $5::numeric, $6::confidence_level, $7::item_origin, $8, $9)
      `, [it.code, it.desc, it.unit, it.qty, it.unitCost, it.conf, it.origin, it.cat, budgetId])
    }

    console.log(`✅ Fixture criado: project=${projectId} budget=${budgetId} (5 items)`)
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Rodar e confirmar**

```bash
DATABASE_URL="postgresql://postgres.rrfmfybklhlaoaxmhdyr:j172ijJDfyP5Wx00@aws-1-us-east-1.pooler.supabase.com:5432/postgres" npx tsx scripts/seed-hitl-fixtures.ts
```

Expected: `✅ Fixture criado: project=... budget=... (5 items)`. Anotar o budget_id retornado — será usado em testes.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-hitl-fixtures.ts
git commit -m "chore(fixtures): script para popular budget HITL de teste"
```

---

## Task 2: Rota e página admin para listar budgets em IN_REVIEW

**Files:**
- Create: `src/app/(admin)/admin/budgets/page.tsx`
- Create: `src/views/admin/AdminBudgets.tsx`

Essa página é o novo ponto de entrada da fila de validação de orçamentos.

- [ ] **Step 1: Criar a página (finíssima, só importa a view)**

`src/app/(admin)/admin/budgets/page.tsx`:
```tsx
import AdminBudgets from '../../../../views/admin/AdminBudgets'

export default function Page() {
  return <AdminBudgets />
}
```

- [ ] **Step 2: Criar a view**

`src/views/admin/AdminBudgets.tsx`:
```tsx
'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ClipboardCheck, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { formatBRL } from '../../lib/pricingEngine'

interface BudgetRow {
  id: string
  name: string
  version: number
  status: 'AI_DRAFT' | 'IN_REVIEW' | 'VALIDATED' | 'REJECTED'
  total_cost: number | null
  confidence: number | null
  created_at: string
  projects: {
    id: string
    name: string
    client_name: string | null
    companies: { name: string } | null
  } | null
}

const statusLabel: Record<string, { label: string; badge: string; icon: JSX.Element }> = {
  AI_DRAFT: { label: 'Rascunho IA', badge: 'badge-draft', icon: <Clock size={14} /> },
  IN_REVIEW: { label: 'Em revisão', badge: 'badge-review', icon: <ClipboardCheck size={14} /> },
  VALIDATED: { label: 'Validado', badge: 'badge-validated', icon: <CheckCircle2 size={14} /> },
  REJECTED: { label: 'Rejeitado', badge: 'badge-rejected', icon: <XCircle size={14} /> },
}

export default function AdminBudgets() {
  const [rows, setRows] = useState<BudgetRow[]>([])
  const [filter, setFilter] = useState<'ALL' | 'AI_DRAFT' | 'IN_REVIEW' | 'VALIDATED' | 'REJECTED'>('IN_REVIEW')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    let q = supabase
      .from('budgets')
      .select('id, name, version, status, total_cost, confidence, created_at, projects!inner(id, name, client_name, companies(name))')
      .order('created_at', { ascending: false })
    if (filter !== 'ALL') q = q.eq('status', filter)
    const { data } = await q
    setRows((data as unknown as BudgetRow[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Orçamentos</h2>
          <p>Revisão humana antes de enviar proposta ao cliente.</p>
        </div>
        <div className="filter-tabs">
          {(['IN_REVIEW', 'AI_DRAFT', 'VALIDATED', 'REJECTED', 'ALL'] as const).map((f) => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'Todos' : statusLabel[f]?.label ?? f}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="loading">Carregando...</div> : (
        rows.length === 0 ? (
          <div className="card empty-state">
            <h3>Nada aqui</h3>
            <p>Nenhum orçamento com esse status.</p>
          </div>
        ) : (
          <div className="grid grid-2">
            {rows.map((b) => {
              const s = statusLabel[b.status]
              return (
                <Link key={b.id} href={`/admin/budgets/${b.id}`} className="card budget-card">
                  <div className="card-header">
                    <div>
                      <h3>{b.name}</h3>
                      <p>{b.projects?.name} · {b.projects?.client_name || b.projects?.companies?.name || '—'}</p>
                    </div>
                    <span className={`badge ${s.badge}`}>{s.icon} {s.label}</span>
                  </div>
                  <dl className="detail-list">
                    <dt>Versão</dt><dd>v{b.version}</dd>
                    <dt>Total</dt><dd>{b.total_cost != null ? formatBRL(Number(b.total_cost)) : '—'}</dd>
                    {b.confidence != null && (<><dt>Confiança</dt><dd>{Number(b.confidence).toFixed(0)}%</dd></>)}
                  </dl>
                </Link>
              )
            })}
          </div>
        )
      )}
    </>
  )
}
```

- [ ] **Step 3: Adicionar link de navegação no AdminLayout**

Modificar `src/components/AdminLayout.tsx` para incluir link `/admin/budgets` no menu. Buscar o array/lista existente de links e adicionar:

```tsx
{ href: '/admin/budgets', label: 'Orçamentos', icon: <ClipboardCheck size={16} /> }
```

(Se o formato do menu for diferente, adapte preservando o padrão).

- [ ] **Step 4: Build + commit**

```bash
npm run build
git add src/app/\(admin\)/admin/budgets/page.tsx src/views/admin/AdminBudgets.tsx src/components/AdminLayout.tsx
git commit -m "feat(admin): lista de budgets com filtro por status (HITL fila)"
```

---

## Task 3: Detalhe do budget — visualização de items

**Files:**
- Create: `src/app/(admin)/admin/budgets/[id]/page.tsx`
- Create: `src/views/admin/AdminBudgetDetail.tsx`

- [ ] **Step 1: Criar a página**

`src/app/(admin)/admin/budgets/[id]/page.tsx`:
```tsx
import AdminBudgetDetail from '../../../../../views/admin/AdminBudgetDetail'

export default function Page() {
  return <AdminBudgetDetail />
}
```

- [ ] **Step 2: Criar a view (read-only por enquanto — edit vem em tasks seguintes)**

`src/views/admin/AdminBudgetDetail.tsx`:
```tsx
'use client'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, ClipboardCheck } from 'lucide-react'
import { formatBRL } from '../../lib/pricingEngine'

interface BudgetItem {
  id: string
  code: string | null
  description: string
  unit: string
  quantity: number
  unit_cost: number | null
  total_cost: number | null
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  origin: 'AI_GENERATED' | 'MANUAL' | 'IMPORTED' | 'COMPOSITION'
  category: string | null
}

interface Budget {
  id: string
  name: string
  version: number
  status: 'AI_DRAFT' | 'IN_REVIEW' | 'VALIDATED' | 'REJECTED'
  total_cost: number | null
  bdi_percentage: number | null
  project_id: string
  projects: { name: string; client_name: string | null } | null
}

const confColor: Record<BudgetItem['confidence'], string> = {
  HIGH: '#16A085', MEDIUM: '#E67E22', LOW: '#C0392B',
}
const confLabel: Record<BudgetItem['confidence'], string> = {
  HIGH: '🟢 Alta', MEDIUM: '🟡 Média', LOW: '🔴 Baixa',
}

export default function AdminBudgetDetail() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [budget, setBudget] = useState<Budget | null>(null)
  const [items, setItems] = useState<BudgetItem[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const [bRes, iRes] = await Promise.all([
      supabase.from('budgets').select('id, name, version, status, total_cost, bdi_percentage, project_id, projects!inner(name, client_name)').eq('id', id).single(),
      supabase.from('budget_items').select('*').eq('budget_id', id).order('category').order('description'),
    ])
    setBudget((bRes.data as unknown as Budget) || null)
    setItems((iRes.data as unknown as BudgetItem[]) || [])
    setLoading(false)
  }

  useEffect(() => { if (id) load() }, [id])

  if (loading) return <div className="loading">Carregando...</div>
  if (!budget) return <div className="empty-state"><h3>Orçamento não encontrado</h3></div>

  const subtotal = items.reduce((s, it) => s + Number(it.total_cost ?? 0), 0)
  const bdiMult = budget.bdi_percentage ? 1 + Number(budget.bdi_percentage) / 100 : 1
  const total = subtotal * bdiMult

  return (
    <>
      <div className="page-header">
        <div>
          <Link href="/admin/budgets" className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }}>
            <ArrowLeft size={14} /> Voltar
          </Link>
          <h2>{budget.name}</h2>
          <p>{budget.projects?.name} · {budget.projects?.client_name || '—'} · v{budget.version}</p>
        </div>
        <div className="detail-actions">
          {budget.status === 'IN_REVIEW' && (
            <Link href={`/admin/budgets/${budget.id}/review`} className="btn btn-primary">
              <ClipboardCheck size={14} /> Revisar
            </Link>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>Itens ({items.length})</h3></div>
        <table className="budget-items-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descrição</th>
              <th>Unid.</th>
              <th style={{ textAlign: 'right' }}>Qtde</th>
              <th style={{ textAlign: 'right' }}>Custo unit.</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th>Confiança</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.code || '—'}</td>
                <td>
                  {it.description}
                  {it.category && <small style={{ display: 'block', color: 'var(--text-muted)' }}>{it.category}</small>}
                </td>
                <td>{it.unit}</td>
                <td style={{ textAlign: 'right' }}>{Number(it.quantity).toLocaleString('pt-BR')}</td>
                <td style={{ textAlign: 'right' }}>{it.unit_cost != null ? formatBRL(Number(it.unit_cost)) : '—'}</td>
                <td style={{ textAlign: 'right' }}>{it.total_cost != null ? formatBRL(Number(it.total_cost)) : '—'}</td>
                <td style={{ color: confColor[it.confidence] }}>{confLabel[it.confidence]}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={5} style={{ textAlign: 'right' }}><strong>Subtotal</strong></td><td style={{ textAlign: 'right' }}><strong>{formatBRL(subtotal)}</strong></td><td /></tr>
            {budget.bdi_percentage != null && (
              <tr><td colSpan={5} style={{ textAlign: 'right' }}>BDI ({Number(budget.bdi_percentage).toFixed(1)}%)</td><td style={{ textAlign: 'right' }}>{formatBRL(total - subtotal)}</td><td /></tr>
            )}
            <tr><td colSpan={5} style={{ textAlign: 'right' }}><strong>Total com BDI</strong></td><td style={{ textAlign: 'right' }}><strong>{formatBRL(total)}</strong></td><td /></tr>
          </tfoot>
        </table>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Build + commit**

```bash
npm run build
git add src/app/\(admin\)/admin/budgets/\[id\]/page.tsx src/views/admin/AdminBudgetDetail.tsx
git commit -m "feat(admin): p\u00e1gina de detalhe do budget com tabela de itens + confian\u00e7a"
```

---

## Task 4: Migration 008 — status transition helpers + RLS checks

**Files:**
- Create: `supabase/migrations/008_budget_status_transitions.sql` (aplicada via MCP)

Adiciona RPC functions para as transições de status, que garantem trilha em `validations` e validações de regras (ex: só pode ir pra VALIDATED se todos items revisados).

- [ ] **Step 1: Escrever o SQL**

```sql
-- Move budget de AI_DRAFT → IN_REVIEW (requer items)
CREATE OR REPLACE FUNCTION submit_budget_for_review(p_budget_id UUID)
RETURNS void AS $$
DECLARE
  item_count INT;
BEGIN
  SELECT COUNT(*) INTO item_count FROM budget_items WHERE budget_id = p_budget_id;
  IF item_count = 0 THEN
    RAISE EXCEPTION 'Budget % não tem items — não pode ir para revisão', p_budget_id;
  END IF;
  UPDATE budgets
  SET status = 'IN_REVIEW'::validation_status, updated_at = now()
  WHERE id = p_budget_id AND status = 'AI_DRAFT'::validation_status;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Budget % não está em AI_DRAFT', p_budget_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Valida um item (aprovação ou correção)
CREATE OR REPLACE FUNCTION validate_budget_item(
  p_item_id UUID,
  p_user_id UUID,
  p_action TEXT,           -- 'APPROVE' | 'REJECT' | 'EDIT'
  p_comment TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_budget_id UUID;
  v_item_name TEXT;
  v_status validation_status;
  v_validation_id UUID;
BEGIN
  SELECT bi.budget_id, bi.description INTO v_budget_id, v_item_name
  FROM budget_items bi WHERE bi.id = p_item_id;

  IF v_budget_id IS NULL THEN
    RAISE EXCEPTION 'Budget item % não encontrado', p_item_id;
  END IF;

  -- Mapear ação → status
  v_status := CASE p_action
    WHEN 'APPROVE' THEN 'VALIDATED'::validation_status
    WHEN 'REJECT'  THEN 'REJECTED'::validation_status
    WHEN 'EDIT'    THEN 'IN_REVIEW'::validation_status
    ELSE NULL
  END;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Ação inválida: % (esperado APPROVE, REJECT ou EDIT)', p_action;
  END IF;

  INSERT INTO validations (
    status, comment, changes, validated_by, budget_id,
    item_type, item_name
  )
  VALUES (
    v_status, p_comment, p_changes, p_user_id, v_budget_id,
    'BUDGET_ITEM', v_item_name
  )
  RETURNING id INTO v_validation_id;

  -- Se EDIT, aplicar as mudanças
  IF p_action = 'EDIT' AND p_changes IS NOT NULL THEN
    UPDATE budget_items SET
      description = COALESCE((p_changes->>'description'), description),
      quantity = COALESCE((p_changes->>'quantity')::numeric, quantity),
      unit_cost = COALESCE((p_changes->>'unit_cost')::numeric, unit_cost),
      total_cost = COALESCE(
        (p_changes->>'total_cost')::numeric,
        COALESCE((p_changes->>'quantity')::numeric, quantity) * COALESCE((p_changes->>'unit_cost')::numeric, unit_cost)
      ),
      updated_at = now()
    WHERE id = p_item_id;
  END IF;

  RETURN v_validation_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Conclui revisão: se TODOS items aprovados, marca budget VALIDATED
CREATE OR REPLACE FUNCTION finalize_budget_review(p_budget_id UUID, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  total_items INT;
  approved_items INT;
  rejected_items INT;
  v_subtotal NUMERIC;
  v_bdi NUMERIC;
BEGIN
  SELECT COUNT(*) INTO total_items FROM budget_items WHERE budget_id = p_budget_id;

  SELECT COUNT(DISTINCT v.item_name) INTO approved_items
  FROM validations v
  WHERE v.budget_id = p_budget_id AND v.status = 'VALIDATED' AND v.item_type = 'BUDGET_ITEM'
    AND v.created_at = (
      SELECT MAX(v2.created_at) FROM validations v2
      WHERE v2.budget_id = v.budget_id AND v2.item_name = v.item_name
    );

  SELECT COUNT(DISTINCT v.item_name) INTO rejected_items
  FROM validations v
  WHERE v.budget_id = p_budget_id AND v.status = 'REJECTED' AND v.item_type = 'BUDGET_ITEM'
    AND v.created_at = (
      SELECT MAX(v2.created_at) FROM validations v2
      WHERE v2.budget_id = v.budget_id AND v2.item_name = v.item_name
    );

  IF rejected_items > 0 THEN
    UPDATE budgets SET status = 'REJECTED'::validation_status, updated_at = now()
    WHERE id = p_budget_id;
    INSERT INTO validations (status, comment, validated_by, budget_id, item_type)
    VALUES ('REJECTED'::validation_status, 'Budget rejeitado: ' || rejected_items || ' item(ns) com problema', p_user_id, p_budget_id, 'BUDGET');
    RETURN 'REJECTED';
  ELSIF approved_items >= total_items THEN
    -- Atualizar total_cost do budget
    SELECT COALESCE(SUM(total_cost), 0) INTO v_subtotal FROM budget_items WHERE budget_id = p_budget_id;
    SELECT bdi_percentage INTO v_bdi FROM budgets WHERE id = p_budget_id;
    UPDATE budgets SET
      status = 'VALIDATED'::validation_status,
      total_cost = v_subtotal * (1 + COALESCE(v_bdi, 0) / 100),
      updated_at = now()
    WHERE id = p_budget_id;
    INSERT INTO validations (status, comment, validated_by, budget_id, item_type)
    VALUES ('VALIDATED'::validation_status, 'Budget validado: ' || total_items || ' itens aprovados', p_user_id, p_budget_id, 'BUDGET');
    RETURN 'VALIDATED';
  ELSE
    RETURN 'PENDING:' || (total_items - approved_items) || '_items_restantes';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
```

- [ ] **Step 2: Aplicar via Supabase MCP**

Via tool `mcp__*__apply_migration`:
- name: `onda_b9_budget_hitl_rpc_functions`
- query: conteúdo de 008

- [ ] **Step 3: Verificar via MCP `execute_sql`**

```sql
SELECT proname FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname='public' AND p.proname IN (
  'submit_budget_for_review', 'validate_budget_item', 'finalize_budget_review'
);
```

Expected: 3 rows.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/008_budget_status_transitions.sql
git commit -m "feat(db): RPC functions para HITL (submit/validate/finalize budget)"
```

---

## Task 5: Botão "Enviar para revisão" no AdminBudgetDetail

**Files:**
- Modify: `src/views/admin/AdminBudgetDetail.tsx`

- [ ] **Step 1: Adicionar botão e handler**

Buscar o `<div className="detail-actions">` em AdminBudgetDetail.tsx. Adicionar botão ANTES do "Revisar":

```tsx
          {budget.status === 'AI_DRAFT' && (
            <button
              className="btn btn-primary"
              onClick={async () => {
                const { error } = await supabase.rpc('submit_budget_for_review', { p_budget_id: budget.id })
                if (error) { alert('Erro: ' + error.message); return }
                await load()
              }}
            >
              <ClipboardCheck size={14} /> Enviar para revisão
            </button>
          )}
```

- [ ] **Step 2: Build + commit**

```bash
npm run build
git add src/views/admin/AdminBudgetDetail.tsx
git commit -m "feat(admin): bot\u00e3o enviar budget para revis\u00e3o (AI_DRAFT → IN_REVIEW)"
```

---

## Task 6: View de revisão item-por-item

**Files:**
- Create: `src/app/(admin)/admin/budgets/[id]/review/page.tsx`
- Create: `src/views/admin/AdminBudgetReview.tsx`

- [ ] **Step 1: Criar a página (thin wrapper)**

`src/app/(admin)/admin/budgets/[id]/review/page.tsx`:
```tsx
import AdminBudgetReview from '../../../../../../views/admin/AdminBudgetReview'
export default function Page() { return <AdminBudgetReview /> }
```

- [ ] **Step 2: Criar a view de review**

`src/views/admin/AdminBudgetReview.tsx`:
```tsx
'use client'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { ArrowLeft, CheckCircle2, XCircle, Edit3, Send } from 'lucide-react'
import { formatBRL } from '../../lib/pricingEngine'

interface BudgetItem {
  id: string
  code: string | null
  description: string
  unit: string
  quantity: number
  unit_cost: number | null
  total_cost: number | null
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  category: string | null
}

interface Validation {
  id: string
  status: string
  item_name: string | null
  comment: string | null
  created_at: string
  validated_by: string
}

interface Budget {
  id: string
  name: string
  status: string
  project_id: string
  projects: { name: string } | null
}

const confColor: Record<BudgetItem['confidence'], string> = {
  HIGH: '#16A085', MEDIUM: '#E67E22', LOW: '#C0392B',
}

export default function AdminBudgetReview() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { user } = useAuth()
  const [budget, setBudget] = useState<Budget | null>(null)
  const [items, setItems] = useState<BudgetItem[]>([])
  const [validations, setValidations] = useState<Validation[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editFields, setEditFields] = useState<{ quantity: string; unit_cost: string }>({ quantity: '', unit_cost: '' })

  async function load() {
    setLoading(true)
    const [bRes, iRes, vRes] = await Promise.all([
      supabase.from('budgets').select('id, name, status, project_id, projects!inner(name)').eq('id', id).single(),
      supabase.from('budget_items').select('*').eq('budget_id', id).order('category').order('description'),
      supabase.from('validations').select('*').eq('budget_id', id).order('created_at'),
    ])
    setBudget((bRes.data as unknown as Budget) || null)
    setItems((iRes.data as unknown as BudgetItem[]) || [])
    setValidations((vRes.data as unknown as Validation[]) || [])
    setLoading(false)
  }

  useEffect(() => { if (id) load() }, [id])

  // Último status de validação por item_name
  const itemStatusMap = new Map<string, string>()
  for (const v of validations) {
    if (v.item_name) itemStatusMap.set(v.item_name, v.status)
  }

  async function onAction(itemId: string, action: 'APPROVE' | 'REJECT') {
    if (!user) return alert('Não autenticado')
    let comment: string | null = null
    if (action === 'REJECT') {
      comment = window.prompt('Motivo da rejeição:')
      if (!comment) return
    }
    const { error } = await supabase.rpc('validate_budget_item', {
      p_item_id: itemId,
      p_user_id: user.id,
      p_action: action,
      p_comment: comment,
    })
    if (error) return alert('Erro: ' + error.message)
    await load()
  }

  async function onEdit(itemId: string) {
    if (!user) return alert('Não autenticado')
    const changes = {
      quantity: editFields.quantity ? Number(editFields.quantity) : undefined,
      unit_cost: editFields.unit_cost ? Number(editFields.unit_cost) : undefined,
    }
    const { error } = await supabase.rpc('validate_budget_item', {
      p_item_id: itemId,
      p_user_id: user.id,
      p_action: 'EDIT',
      p_comment: 'Editado na revisão',
      p_changes: changes,
    })
    if (error) return alert('Erro: ' + error.message)
    setEditing(null)
    await load()
  }

  async function onFinalize() {
    if (!user) return
    if (!confirm('Finalizar revisão? Itens aprovados serão validados; se houver rejeição, o budget vai para REJECTED.')) return
    const { data, error } = await supabase.rpc('finalize_budget_review', {
      p_budget_id: id,
      p_user_id: user.id,
    })
    if (error) return alert('Erro: ' + error.message)
    alert('Resultado: ' + data)
    router.push(`/admin/budgets/${id}`)
  }

  if (loading) return <div className="loading">Carregando...</div>
  if (!budget) return <div className="empty-state"><h3>Orçamento não encontrado</h3></div>
  if (budget.status !== 'IN_REVIEW') {
    return (
      <div className="empty-state">
        <h3>Orçamento não está em revisão</h3>
        <p>Status atual: {budget.status}</p>
        <Link href={`/admin/budgets/${id}`} className="btn btn-outline">Ver detalhes</Link>
      </div>
    )
  }

  const approvedCount = items.filter((it) => itemStatusMap.get(it.description) === 'VALIDATED').length
  const rejectedCount = items.filter((it) => itemStatusMap.get(it.description) === 'REJECTED').length
  const pendingCount = items.length - approvedCount - rejectedCount

  return (
    <>
      <div className="page-header">
        <div>
          <Link href={`/admin/budgets/${id}`} className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }}>
            <ArrowLeft size={14} /> Voltar
          </Link>
          <h2>Revisar: {budget.name}</h2>
          <p>{budget.projects?.name} · {items.length} itens ({approvedCount} aprovados, {rejectedCount} rejeitados, {pendingCount} pendentes)</p>
        </div>
        <div className="detail-actions">
          <button className="btn btn-primary" onClick={onFinalize} disabled={pendingCount > 0 && rejectedCount === 0}>
            <Send size={14} /> Finalizar revisão
          </button>
        </div>
      </div>

      <div className="card">
        <table className="budget-items-table">
          <thead>
            <tr>
              <th style={{ width: 24 }}></th>
              <th>Descrição</th>
              <th>Unid.</th>
              <th style={{ textAlign: 'right' }}>Qtde</th>
              <th style={{ textAlign: 'right' }}>Custo unit.</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const status = itemStatusMap.get(it.description)
              const isEditing = editing === it.id
              return (
                <tr key={it.id} style={{ opacity: status === 'VALIDATED' ? 0.7 : 1 }}>
                  <td style={{ color: confColor[it.confidence] }}>●</td>
                  <td>
                    {it.description}
                    {it.category && <small style={{ display: 'block', color: 'var(--text-muted)' }}>{it.category}</small>}
                    {status && <small style={{ color: status === 'VALIDATED' ? '#16A085' : '#C0392B' }}>{status === 'VALIDATED' ? '✓ aprovado' : '✗ rejeitado'}</small>}
                  </td>
                  <td>{it.unit}</td>
                  <td style={{ textAlign: 'right' }}>
                    {isEditing
                      ? <input type="number" value={editFields.quantity} onChange={(e) => setEditFields({ ...editFields, quantity: e.target.value })} style={{ width: 80 }} />
                      : Number(it.quantity).toLocaleString('pt-BR')}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {isEditing
                      ? <input type="number" value={editFields.unit_cost} onChange={(e) => setEditFields({ ...editFields, unit_cost: e.target.value })} style={{ width: 100 }} />
                      : (it.unit_cost != null ? formatBRL(Number(it.unit_cost)) : '—')}
                  </td>
                  <td style={{ textAlign: 'right' }}>{it.total_cost != null ? formatBRL(Number(it.total_cost)) : '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    {isEditing ? (
                      <>
                        <button className="btn btn-sm btn-primary" onClick={() => onEdit(it.id)}>Salvar</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
                      </>
                    ) : (
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button className="btn btn-xs btn-outline" title="Aprovar" onClick={() => onAction(it.id, 'APPROVE')}><CheckCircle2 size={12} /></button>
                        <button className="btn btn-xs btn-outline" title="Editar" onClick={() => { setEditing(it.id); setEditFields({ quantity: String(it.quantity), unit_cost: String(it.unit_cost || '') }) }}><Edit3 size={12} /></button>
                        <button className="btn btn-xs btn-outline" title="Rejeitar" onClick={() => onAction(it.id, 'REJECT')}><XCircle size={12} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {validations.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header"><h3>Trilha de validações ({validations.length})</h3></div>
          <ul className="history-list">
            {validations.map((v) => (
              <li key={v.id}>
                <strong>{v.status}</strong> — {v.item_name || '(budget)'}
                <span>{new Date(v.created_at).toLocaleString('pt-BR')}</span>
                {v.comment && <p>{v.comment}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3: Build + commit**

```bash
npm run build
git add src/app/\(admin\)/admin/budgets/\[id\]/review/page.tsx src/views/admin/AdminBudgetReview.tsx
git commit -m "feat(admin): view de revis\u00e3o item-por-item com aprovar/editar/rejeitar + trilha"
```

---

## Task 7: Teste manual E2E no browser

**Files:** nenhuma alteração.

- [ ] **Step 1: Rodar dev**

```bash
npm run dev
```

- [ ] **Step 2: Usar a fixture criada no Task 1**

Pegar o `budget_id` criado. Abrir `http://localhost:3000/admin/budgets/<id>`.

- [ ] **Step 3: Fluxo feliz**

1. Verifica que aparece na lista `/admin/budgets` com filtro "Rascunho IA"
2. Clica → detalhe mostra os 5 items
3. Clica "Enviar para revisão" → move para IN_REVIEW
4. Clica "Revisar" → `/admin/budgets/[id]/review`
5. Aprovar itens 1-3, editar item 4 (mudar unit_cost), aprovar item 4 editado, rejeitar item 5
6. Tentar "Finalizar revisão" — deve completar como REJECTED (porque tem 1 rejeitado)

- [ ] **Step 4: Re-seed e refazer cenário VALIDATED**

```bash
DATABASE_URL="..." npx tsx scripts/seed-hitl-fixtures.ts  # cria outro budget
```

1. Agora aprovar TODOS os 5 itens
2. "Finalizar revisão" → deve completar como VALIDATED
3. Verificar no banco: `budgets.total_cost` preenchido com soma × BDI

- [ ] **Step 5: Registrar resultados**

Criar `docs/plans/fase1b-teste-hitl.md` com:

```markdown
# Fase 1B — Teste manual HITL

Data: YYYY-MM-DD

## Cenário 1: rejeição
- [x] Budget AI_DRAFT → IN_REVIEW via botão
- [x] Itens 1-3 aprovados, item 4 editado e aprovado, item 5 rejeitado
- [x] Finalizar → budget REJECTED, trilha completa em validations

## Cenário 2: validação completa
- [x] Todos 5 itens aprovados
- [x] Finalizar → budget VALIDATED, total_cost = subtotal × (1 + BDI/100)

## Observações
<...>
```

```bash
git add docs/plans/fase1b-teste-hitl.md
git commit -m "docs(test): registro do teste manual E2E do HITL"
```

---

## Task 8: Atualizar spec com status + PR

**Files:**
- Modify: `docs/plans/2026-04-18-fase1-index.md`
- Modify: `docs/specs/2026-04-18-fase1-fundacao-design.md` (opcional — marcar §4.3 como implementado)

- [ ] **Step 1: Atualizar índice Fase 1**

Marcar 1B como ✅ Completo.

- [ ] **Step 2: Push e PR**

```bash
git push -u origin feature/fase1b-hitl-workflow
gh pr create --title "feat: Fase 1B — HITL workflow + review item-por-item de budgets" --body "..."
```

PR body cobre: mudanças, migration 008 (RPC functions), views novas, teste manual.

---

## Definition of Done (Fase 1B)

- [ ] Migration 008 (RPC functions) aplicada e verificada
- [ ] `/admin/budgets` lista orçamentos com filtro por status
- [ ] `/admin/budgets/[id]` mostra detalhe + items + totalizadores
- [ ] `/admin/budgets/[id]/review` permite aprovar/editar/rejeitar cada item
- [ ] `finalize_budget_review` transita corretamente para VALIDATED ou REJECTED
- [ ] Trilha em `validations` mostra quem validou cada item e quando
- [ ] Build passa, teste manual E2E cobre cenário de aprovação + rejeição
- [ ] PR aberto

## Próximo sub-plano

Ao completar 1B, escrever **1C (Gerador de PDF do orçamento)** em `docs/plans/2026-04-18-fase1c-pdf-generator.md`. Dependências de 1C em 1B:
- Budget com status VALIDATED disponível para geração do PDF
- Trilha de validação para incluir no rodapé (hash + CREA)
