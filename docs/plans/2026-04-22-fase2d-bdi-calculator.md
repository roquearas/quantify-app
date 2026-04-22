# Fase 2D — BDI Calculator + Overrides por Item

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** engenheiro revisor consegue **editar o BDI global do budget** e **aplicar BDI diferente por item** (ex: fundação 22% / acabamento 28%) com feedback visual imediato do total antes/depois. O PDF passa a mostrar BDI em cascata (por item quando houver override). Sem breakdown de componentes (Lucro/Impostos/etc.) — MVP só cuida do número final.

**Architecture:**
- Schema **já existe**: `budgets.bdi_percentage` (Fase 1) + `budget_items.bdi_override_percent` (migration 010, Fase 2A). Nada a criar.
- Pure lib `src/lib/budget/bdi.ts` — `computeBudgetTotals(items, bdi_percent)` retorna `{ subtotal, bdiAmount, total, perItem: [{ id, net, bdiEffective, gross }] }`. Puro, testável, reusado por UI + PDF.
- UI: nova seção "BDI" em `AdminBudgetReview.tsx` acima da tabela (editor do BDI global + preview antes/depois). Coluna extra na tabela de itens com input de override. Persiste via `supabase.rpc('update_budget_bdi', ...)` / `update_budget_item_bdi_override`.
- PDF: `BudgetPDF.tsx` mostra BDI efetivo por item quando houver override, e uma linha "BDI efetivo médio" nos totalizadores.

**Tech Stack:** Next.js 15 + React 19 + Supabase client. Vitest para pure fn. Sem novos pacotes npm.

**Spec de origem:** [`docs/specs/2026-04-18-fase2-engine-orcamento-design.md`](../specs/2026-04-18-fase2-engine-orcamento-design.md) §3.4 + §4.5.

---

## Pré-requisitos

- Fase 2A mergeada ✅ (migration 010 com `bdi_override_percent`)
- Fase 2B mergeada ✅
- Fase 2C mergeada ✅ (curva ABC presente no review — o BDI vai conviver com ela)
- Budget de teste com items valorados (seed de 1B cobre)

## Convenções

- Branch: `feature/fase2d-bdi-calculator`
- Worktree: `.worktrees/fase2d-bdi-calculator/`
- Commits: `feat(fase2d): …` / `test(fase2d): …` / `docs(fase2d): …`
- Sem novos pacotes npm

---

## Task 1: Pure function `computeBudgetTotals`

**Files:**
- Create: `src/lib/budget/bdi.ts`
- Create: `src/lib/budget/bdi.test.ts`

Razão: mesma lógica precisa rodar em 3 lugares — preview ao vivo no review, PDF, e eventualmente no backend pra persistir `budget.total_cost` caso futuro. Pure fn evita drift.

- [ ] **Step 1: Tipos e assinatura**

```ts
// src/lib/budget/bdi.ts
export interface BdiInputItem {
  id: string
  total_cost: number | null          // custo direto do item (pre-BDI)
  bdi_override_percent: number | null
}

export interface BdiPerItem {
  id: string
  net: number                 // custo direto
  bdi_effective_percent: number
  bdi_amount: number
  gross: number               // net + bdi_amount
  overridden: boolean
}

export interface BudgetTotals {
  subtotal: number            // Σ net
  bdiAmount: number           // Σ bdi_amount
  total: number               // Σ gross
  bdiEffectiveAvg: number     // média ponderada pelo net (bdiAmount / subtotal * 100, ou 0)
  perItem: BdiPerItem[]
}

export function computeBudgetTotals(
  items: readonly BdiInputItem[],
  bdiPercentBudget: number | null,
): BudgetTotals
```

- [ ] **Step 2: Implementação**

Regras:
1. `bdi_effective_percent` por item: `override ?? budget ?? 0`.
2. `bdi_amount = net * (bdi_effective_percent / 100)`.
3. `overridden = override !== null && override !== budget`.
4. Items com `total_cost == null` contam como `net=0` (aparecem em `perItem` mas não alteram totais).
5. `bdiEffectiveAvg`: se `subtotal > 0` → `bdiAmount / subtotal * 100`, senão `0`.

- [ ] **Step 3: Testes vitest (8 casos)**

```ts
describe('computeBudgetTotals', () => {
  it('sem BDI global nem override → total = subtotal', () => {})
  it('só BDI global → aplica flat em todos', () => {})
  it('override em 1 item não muda os outros', () => {})
  it('override igual ao global → overridden = false', () => {})
  it('item com total_cost null → net=0, não polui total', () => {})
  it('bdiEffectiveAvg é média ponderada, não aritmética', () => {})
  it('lista vazia → totais zerados, perItem = []', () => {})
  it('BDI global null → trata como 0', () => {})
})
```

- [ ] **Step 4:** commit `feat(fase2d): pure fn computeBudgetTotals + testes`

---

## Task 2: RPCs de persistência

**Files:**
- Create: `supabase/migrations/013_budget_bdi_rpcs.sql`

Razão: escrita direta via PostgREST em `budgets.bdi_percentage` funciona mas não deixa trilha. Usar RPCs com `SECURITY INVOKER` e registrar validação unifica o padrão com `validate_budget_item`.

- [ ] **Step 1: `update_budget_bdi(p_budget_id uuid, p_bdi numeric, p_user_id uuid)`**
  - Valida `p_bdi` em [0, 100]
  - Valida que budget está em `IN_REVIEW` (não muda budget já validado)
  - `UPDATE budgets SET bdi_percentage = p_bdi, updated_at = now() WHERE id = p_budget_id`
  - `INSERT INTO validations (budget_id, validated_by, status, item_type, comment, changes)` com `item_type = 'BUDGET_BDI'`, `changes = jsonb_build_object('bdi_percentage', p_bdi)`.

- [ ] **Step 2: `update_budget_item_bdi_override(p_item_id uuid, p_override numeric, p_user_id uuid)`**
  - `p_override` pode ser `NULL` (limpa override).
  - Valida faixa.
  - Valida budget pai em `IN_REVIEW`.
  - `UPDATE budget_items SET bdi_override_percent = p_override WHERE id = p_item_id`.
  - Trilha em `validations` com `item_type = 'BUDGET_ITEM_BDI_OVERRIDE'`, `item_name = budget_items.description`.

- [ ] **Step 3: Grants**
  - `GRANT EXECUTE ON FUNCTION ... TO authenticated` em ambas.

- [ ] **Step 4:** rodar `scripts/apply-migration.ts 013` e conferir no banco; commit `feat(fase2d): RPCs update_budget_bdi + update_budget_item_bdi_override`

---

## Task 3: Componente `BdiEditor`

**Files:**
- Create: `src/components/BdiEditor.tsx`

- [ ] **Step 1: Props**
```ts
interface Props {
  budgetId: string
  bdiPercent: number | null
  totals: BudgetTotals // derivado via computeBudgetTotals
  canEdit: boolean     // budget.status === 'IN_REVIEW'
  onSaved: () => void | Promise<void>
}
```

- [ ] **Step 2: Render**
```
┌─ BDI ────────────────────────────────────────┐
│ BDI do budget: [ 24 ]% [Salvar]              │
│                                              │
│ Subtotal (direto):  R$ 100.000,00            │
│ BDI (efetivo avg):  24,3% · R$ 24.280,00     │
│ Total:              R$ 124.280,00            │
│                                              │
│ (3 itens com override)                       │
└──────────────────────────────────────────────┘
```

- Input `number` controlado (min 0, max 100, step 0.5). Botão `Salvar` chama `supabase.rpc('update_budget_bdi', …)`; desabilitado enquanto salva.
- "itens com override" linka para filtro (setinha que rola a tabela e filtra por `overridden`).

- [ ] **Step 3:** commit `feat(fase2d): componente BdiEditor`

---

## Task 4: Override por linha no `AdminBudgetReview`

**Files:**
- Modify: `src/views/admin/AdminBudgetReview.tsx`

- [ ] **Step 1: Carregar `bdi_override_percent` no query de items**

O `select('*')` já traz, mas o tipo local `BudgetItem` precisa do campo:
```ts
interface BudgetItem {
  …
  bdi_override_percent: number | null
}
```

- [ ] **Step 2: `useMemo` dos totals**
```ts
const totals = useMemo(
  () => computeBudgetTotals(items, budget.bdi_percentage),
  [items, budget.bdi_percentage]
)
const bdiByItemId = useMemo(
  () => new Map(totals.perItem.map(p => [p.id, p])),
  [totals]
)
```

- [ ] **Step 3: Renderizar `<BdiEditor>`**
- Posicionar entre o `<BudgetCurvaABC>` e a tabela. Passar `totals` e `budget.bdi_percentage`.

- [ ] **Step 4: Nova coluna "BDI" na tabela**
- Header: `<th>BDI</th>` depois de "Total".
- Célula: input inline quando `editing === it.id`, senão texto `{bdi%}` (itálico se usa default, bold se override).
- Botão na coluna Ações: `⚙` que abre edit de BDI sem editar qty/unit_cost.
- `onEditBdi(itemId, newOverride | null)` → `supabase.rpc('update_budget_item_bdi_override', ...)` → `load()`.

- [ ] **Step 5: Mostrar gross na linha**
- "Total" atual exibe o **net**. Adicionar linha pequena embaixo `bruto: R$ X (BDI +Y%)` quando há override, em cinza. Evita confundir quem olha só a coluna.

- [ ] **Step 6: Validação manual**
- Editar BDI global de 0 → 24 → total sobe 24%.
- Aplicar override 30 em 1 item → total subtotal inalterado, BDI efetivo avg sobe levemente.
- Limpar override → volta ao global.
- Conferir trilha em `validations` tem linhas `BUDGET_BDI` e `BUDGET_ITEM_BDI_OVERRIDE`.

- [ ] **Step 7:** commit `feat(fase2d): edição de BDI global + override por item no review`

---

## Task 5: BDI em cascata no PDF

**Files:**
- Modify: `src/lib/pdf/BudgetPDF.tsx`

- [ ] **Step 1: Props**

Adicionar `bdi_override_percent: number | null` ao tipo de `items`.

- [ ] **Step 2: Substituir cálculo flat por `computeBudgetTotals`**

Remover:
```ts
const bdiAmount = subtotal * (bdi / 100)
```

E passar a usar o retorno de `computeBudgetTotals(items, budget.bdi_percentage)`.

- [ ] **Step 3: Coluna BDI na tabela do PDF**
- Reduzir `colDesc` para `30%`, `colTotal` para `12%`, nova `colBdi` `8%` (`%` do item).
- Mostrar `{bdi_effective}%` com `*` se for override.

- [ ] **Step 4: Totalizadores**
- Trocar "BDI (X%)" por "BDI (efetivo médio X,X%)".
- Se houver algum override, adicionar nota fine print abaixo: "* BDI diferenciado por item — ver coluna BDI".

- [ ] **Step 5: Teste visual**
- `GET /api/budgets/<id>/pdf` com budget que tenha 2 overrides.
- Conferir coluna BDI, `*` nos itens overriding, e nota.

- [ ] **Step 6:** commit `feat(fase2d): BDI em cascata por item no PDF`

---

## Task 6: Smoke test log + PR

**Files:**
- Create: `docs/plans/fase2d-teste-bdi.md`

- [ ] **Step 1:** Log com screenshots (review + PDF) e tabela "cenário → total esperado vs visto".
- [ ] **Step 2:** commit `docs(fase2d): log do smoke test BDI`
- [ ] **Step 3: PR** `feat: Fase 2D — BDI calculator + overrides por item` contra `main`.

---

## Critérios de pronto

- [ ] `computeBudgetTotals` com 8 testes verdes
- [ ] RPCs `update_budget_bdi` e `update_budget_item_bdi_override` criadas com trilha em `validations`
- [ ] AdminBudgetReview tem editor de BDI global + coluna de override por item, com preview antes/depois
- [ ] PDF mostra coluna BDI por item e totalizador com "efetivo médio"
- [ ] Trilha de validações registra `BUDGET_BDI` e `BUDGET_ITEM_BDI_OVERRIDE`
- [ ] Smoke test log commitado
- [ ] PR aberto contra `main`

---

## Decisões explícitas / riscos

- **BDI aplicado em render, não persistido**: `budget_items.total_cost` continua sendo o custo direto (pre-BDI). O total com BDI vive em `budgets.total_cost` se quisermos denormalizar depois. MVP: calcular no UI + PDF; sem trigger de recalc. Evita bugs de cache de valores.
- **Sem breakdown Lucro/Impostos/Risco**: o mockup do spec mostra componentes mas eles são advisory para o engenheiro — não precisam persistir. Se vier demanda do pilot, adicionar numa fase futura como `budgets.bdi_breakdown_jsonb`.
- **`IN_REVIEW` como guarda**: RPCs só aceitam mudança em budget in-review. Budget `VALIDATED` fica imutável — alteração de BDI depois exige nova versão (fora de escopo, fica em aditivos — Fase 3).
- **Faixa 0..100%**: `bdi_override_percent` já tem CHECK no schema. RPC valida novamente pra dar erro claro.
- **Override que iguala global**: `overridden = false` nesse caso — evita poluir a linha "N itens com override" quando alguém digita manualmente o mesmo número.

## Fora de escopo (próximos sub-planos)

- Memorial descritivo → 2E
- AI sugerindo composição SINAPI → 2F
- E2E completo → 2F
- Aditivos / versionamento de budget → Fase 3

---

## Estimativa

2 dias. Task 2 (RPCs) + Task 4 (UI integration) são os pontos mais longos (~4h cada). Task 5 (PDF) cai por volta de 3h porque mexe em layout de colunas. Task 1 e Task 3 são curtas (~2h cada).
