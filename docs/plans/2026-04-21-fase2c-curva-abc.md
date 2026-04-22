# Fase 2C — Curva ABC (UI + PDF)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o revisor tem uma visão imediata de "onde está o dinheiro" do orçamento. Vê a distribuição em classes **A (até 50% do total)**, **B (50%→80%)**, **C (80%→100%)**, pode filtrar a tabela de itens por classe, e a mesma visualização aparece no PDF gerado.

**Architecture:**
- Pure lib `src/lib/budget/curvaAbc.ts` — função `classifyCurvaAbc(items)`. Zero deps, 100% testável.
- Componente visual `src/components/BudgetCurvaABC.tsx` — consome o resultado da pure fn, renderiza as 3 barras e o controle de filtro.
- Integração em `src/views/admin/AdminBudgetReview.tsx` — novo `useMemo` da classificação e state de filtro; aplica antes do `items.map()` que monta a tabela.
- Integração em `src/lib/pdf/BudgetPDF.tsx` — nova `<View>` reusando a mesma pure fn; visualização compacta (sem botões), após o bloco de totalizadores.

**Tech Stack:** Next.js 15 + React 19 + `@react-pdf/renderer` (já em uso). Vitest para a pure fn. Sem novos pacotes.

**Spec de origem:** [`docs/specs/2026-04-18-fase2-engine-orcamento-design.md`](../specs/2026-04-18-fase2-engine-orcamento-design.md) §4.4 e §4.7 (parcial — só a parte da curva ABC; memorial descritivo fica com 2E).

---

## Pré-requisitos

- Fase 2A mergeada ✅ (schema SINAPI + importador — PR #9/#12)
- Fase 2B mergeada ✅ (picker SINAPI no review — PR #11)
- `budgets.status = 'IN_REVIEW'` com `budget_items` populados e `total_cost` preenchido — já atendido pela seed de `scripts/seed-hitl-fixtures.ts` da Fase 1B.

## Convenções

- Branch: `feature/fase2c-curva-abc`
- Worktree: `.worktrees/fase2c-curva-abc/`
- Commits: `feat(fase2c): …` / `test(fase2c): …` / `docs(fase2c): …`
- Sem novos pacotes npm

---

## Task 1: Pure function de classificação

**Files:**
- Create: `src/lib/budget/curvaAbc.ts`
- Create: `src/lib/budget/curvaAbc.test.ts`

Por que isolado: a mesma lógica roda na UI (React) e no PDF (`@react-pdf/renderer`). Manter 100% pura e testada evita regressão silenciosa entre os dois lados.

- [ ] **Step 1: Assinatura e tipos**

```ts
// src/lib/budget/curvaAbc.ts
export type CurvaAbcClasse = 'A' | 'B' | 'C'

export interface CurvaAbcInput {
  id: string
  total_cost: number | null
}

export interface CurvaAbcItem<T extends CurvaAbcInput = CurvaAbcInput> {
  item: T
  classe: CurvaAbcClasse
  subtotal: number
  acumulado_percent: number // 0-100
  rank: number // 1-based, por subtotal desc
}

export interface CurvaAbcResumo {
  A: { count: number; sum: number; percent: number }
  B: { count: number; sum: number; percent: number }
  C: { count: number; sum: number; percent: number }
  total: number
  ignorados: number // items com total_cost null ou <= 0
}

export interface CurvaAbcResult<T extends CurvaAbcInput = CurvaAbcInput> {
  items: CurvaAbcItem<T>[]
  resumo: CurvaAbcResumo
}

export function classifyCurvaAbc<T extends CurvaAbcInput>(items: T[]): CurvaAbcResult<T>
```

- [ ] **Step 2: Implementação**

Regras:
1. Items com `total_cost == null || <= 0` contam em `ignorados` e não entram em nenhuma classe.
2. Ordena desc por `total_cost`; em empate, mantém ordem de entrada (sort estável).
3. `total = Σ total_cost`. Se `total === 0`, retorna `items: []` e `resumo` zerado (só `ignorados` preenchido).
4. Itera acumulando `acumulado_percent = (sum_até_aqui / total) * 100`.
5. Classifica pela faixa em que o item **começa**, não em que termina (regra conservadora — item que empurra 48%→52% fica em A).
   - `acumulado_antes < 50` → A
   - `acumulado_antes < 80` → B
   - caso contrário → C
6. `rank` é 1-based por ordem desc.

- [ ] **Step 3: Testes vitest**

```ts
// src/lib/budget/curvaAbc.test.ts
import { describe, it, expect } from 'vitest'
import { classifyCurvaAbc } from './curvaAbc'

describe('classifyCurvaAbc', () => {
  it('item único fica em A com 100%', () => { /* ... */ })
  it('items iguais distribuem nas proporções corretas', () => {
    // 10 items de R$100 cada: 5 em A (50%), 3 em B (80%), 2 em C
  })
  it('items vazios retornam resumo zerado', () => { /* ... */ })
  it('total_cost null é ignorado, conta em resumo.ignorados', () => { /* ... */ })
  it('total_cost <= 0 é ignorado', () => { /* ... */ })
  it('ordena desc; empates preservam ordem de entrada', () => { /* ... */ })
  it('item na fronteira fica na classe onde começa (48→52 é A)', () => { /* ... */ })
  it('total === 0 retorna items vazio sem quebrar', () => { /* ... */ })
})
```

Rodar: `npx vitest run src/lib/budget/curvaAbc.test.ts`

- [ ] **Step 4:** commit `feat(fase2c): pure fn classifyCurvaAbc + testes (8 casos)`

---

## Task 2: Componente visual `BudgetCurvaABC`

**Files:**
- Create: `src/components/BudgetCurvaABC.tsx`

- [ ] **Step 1: Props e render**

```tsx
interface Props {
  resumo: CurvaAbcResumo
  filtro: CurvaAbcClasse | null
  onFiltroChange: (f: CurvaAbcClasse | null) => void
}
```

Layout (usa `card` / classes existentes, sem CSS novo):

```
┌─ Curva ABC ────────────────────────────────┐
│ ● A   52%   (7 itens)   ████████░░░░░░░░ │
│ ● B   28%   (12 itens)  ████░░░░░░░░░░░░ │
│ ● C   20%   (23 itens)  ███░░░░░░░░░░░░░ │
│                                            │
│ [ Filtrar A ] [ Filtrar B ] [ Filtrar C ] │
│ [ Limpar filtro ]                          │
└────────────────────────────────────────────┘
```

Cores (intencional — A=vermelho chama atenção para onde está o dinheiro):
- A → `#C0392B`
- B → `#E67E22`
- C → `#16A085`

Barras: `<div style={{ width: `${percent}%`, background: <cor>, height: 6 }} />` dentro de um track cinza claro.

Estado visual do botão ativo: borda de 2px na cor da classe; botão "Limpar" só habilitado quando algum filtro está ativo.

- [ ] **Step 2: Acessibilidade básica**
- Barras com `role="progressbar"` + `aria-valuenow`.
- Botões de filtro com `aria-pressed`.
- Nenhum ícone-only sem label.

- [ ] **Step 3:** commit `feat(fase2c): componente BudgetCurvaABC`

---

## Task 3: Integração no `AdminBudgetReview`

**Files:**
- Modify: `src/views/admin/AdminBudgetReview.tsx`

- [ ] **Step 1: Hooks novos**

```tsx
const [filtroClasse, setFiltroClasse] = useState<CurvaAbcClasse | null>(null)

const curvaAbc = useMemo(() => classifyCurvaAbc(items), [items])

const classeByItemId = useMemo(
  () => new Map(curvaAbc.items.map(ci => [ci.item.id, ci.classe])),
  [curvaAbc]
)

const itemsFiltrados = useMemo(
  () => filtroClasse ? items.filter(it => classeByItemId.get(it.id) === filtroClasse) : items,
  [items, filtroClasse, classeByItemId]
)
```

- [ ] **Step 2: Render**

Inserir entre a `<div className="page-header">` (termina ~linha 186) e a `<div className="card">` da tabela (linha 188):

```tsx
<BudgetCurvaABC
  resumo={curvaAbc.resumo}
  filtro={filtroClasse}
  onFiltroChange={setFiltroClasse}
/>
```

Trocar `items.map(...)` (linha ~202) por `itemsFiltrados.map(...)`.

Atualizar o subtítulo do header para indicar quando um filtro está ativo:
```
{budget.projects?.name} · {items.length} itens
{filtroClasse && ` · filtrando classe ${filtroClasse}`}
({approvedCount} aprovados, {rejectedCount} rejeitados, {pendingCount} pendentes)
```

- [ ] **Step 3: Badge da classe no item**

Ao lado do dot de confiança (linha ~209), adicionar badge pequeno da classe ABC:

```tsx
<span style={{ fontSize: 10, fontWeight: 700, color: classeColor[classeByItemId.get(it.id) ?? 'C'] }}>
  {classeByItemId.get(it.id) ?? '—'}
</span>
```

Não mostrar se o item está em `ignorados` (total_cost null). Reusa `classeColor` do Task 2 exportado.

- [ ] **Step 4: Validação manual**
- Abrir `/admin/orcamentos/<id>/revisar` num budget `IN_REVIEW` com ≥10 items de valores variados.
- Conferir: percentuais somam 100%, contagem de items bate com tabela.
- Clicar Filtrar A → tabela reduz; header mostra "filtrando classe A".
- Clicar Limpar → volta todos os items.
- Aprovar 1 item e reabrir → curva não muda (é sobre custo, não status).

- [ ] **Step 5:** commit `feat(fase2c): integra curva ABC + filtro no AdminBudgetReview`

---

## Task 4: Renderizar no PDF

**Files:**
- Modify: `src/lib/pdf/BudgetPDF.tsx`

- [ ] **Step 1: Styles novos**

Na `StyleSheet.create`, adicionar:

```ts
abcSection: { marginTop: 14, marginBottom: 14 },
abcRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
abcLabel: { width: 70, fontSize: 9, fontWeight: 'bold' },
abcTrack: { flex: 1, height: 6, backgroundColor: '#E2E8F0', borderRadius: 2, marginHorizontal: 6 },
abcFill: { height: 6, borderRadius: 2 },
abcMeta: { width: 110, fontSize: 8, color: '#64748B', textAlign: 'right' },
```

- [ ] **Step 2: Inserir seção**

Entre `{/* Totalizadores */}` / fechamento do `</View>` da seção "Planilha analítica" (~linha 198) e a `{/* Trilha de validações */}` (linha 200):

```tsx
{curvaAbc.resumo.total > 0 && (
  <View style={styles.abcSection} wrap={false}>
    <Text style={styles.sectionTitle}>Composição por curva ABC</Text>
    {(['A','B','C'] as const).map(classe => {
      const r = curvaAbc.resumo[classe]
      const color = classe === 'A' ? '#C0392B' : classe === 'B' ? '#E67E22' : '#16A085'
      return (
        <View key={classe} style={styles.abcRow}>
          <Text style={[styles.abcLabel, { color }]}>● {classe}</Text>
          <View style={styles.abcTrack}>
            <View style={[styles.abcFill, { width: `${r.percent}%`, backgroundColor: color }]} />
          </View>
          <Text style={styles.abcMeta}>{r.percent.toFixed(1)}% · {r.count} {r.count === 1 ? 'item' : 'itens'} · {fmt(r.sum)}</Text>
        </View>
      )
    })}
  </View>
)}
```

`curvaAbc` é calculado no início do componente: `const curvaAbc = classifyCurvaAbc(items)`.

Guard `total > 0` evita seção vazia em budget sem items valorados.

- [ ] **Step 3: Teste visual**
- `GET /api/budgets/<id>/pdf` com o mesmo budget do Task 3 Step 4.
- Conferir: números da seção ABC são idênticos aos da UI.
- Conferir: seção não quebra entre páginas (`wrap={false}`).

- [ ] **Step 4:** commit `feat(fase2c): curva ABC no PDF`

---

## Task 5: Smoke test log + PR

**Files:**
- Create: `docs/plans/fase2c-teste-curvaabc.md`

- [ ] **Step 1: Log de teste**
- Captura de tela do AdminBudgetReview com curva ABC e filtro aplicado.
- Captura da seção ABC no PDF.
- Tabela "número esperado vs visto" pra validar a lógica em dados reais.
- Padrão: seguir o formato de `fase1b-teste-hitl.md`.

- [ ] **Step 2:** commit `docs(fase2c): log do smoke test curva ABC`

- [ ] **Step 3: Abrir PR**
- Título: `feat: Fase 2C — Curva ABC (UI + PDF)`
- Base: `main`
- Body: resumo + Test plan cobrindo UI, filtro, PDF, e testes unitários.

---

## Critérios de pronto

- [ ] `classifyCurvaAbc` com 8 testes passando em `npx vitest run`
- [ ] AdminBudgetReview exibe a curva ABC acima da tabela
- [ ] Filtros A/B/C/Limpar alteram a tabela e o subtítulo do header
- [ ] Badge da classe aparece em cada linha (menos itens sem `total_cost`)
- [ ] PDF contém seção "Composição por curva ABC" com mesmos números da UI
- [ ] Nenhuma regressão em budgets sem itens valorados (seção ausente no PDF, barras zeradas na UI)
- [ ] Smoke test log commitado
- [ ] PR aberto contra `main`

---

## Decisões explícitas / riscos

- **Fronteira entre classes**: item que cruza 50% fica em A (classe onde começou a contar). Alternativa "fica onde tem maior pedaço" foi descartada — complexidade extra sem ganho real pro revisor.
- **Cores A=vermelho → C=verde**: intencional. A é onde está o risco (maior custo concentrado). Se Isabela achar contraintuitivo no pilot, trocar é trivial.
- **Items com `total_cost = null`**: ignorados na curva (reportados em `resumo.ignorados`). Continuam visíveis na tabela, sem badge de classe.
- **Performance**: budgets reais têm ~20–80 items. `O(n log n)` da ordenação é irrelevante. `useMemo` já cobre re-renders.
- **Persistência do filtro**: estado efêmero na UI. Não vai pra URL nem localStorage — reviewers não reportaram demanda.

## Fora de escopo (fica em outra fase)

- BDI calculator e overrides por item → 2D
- Memorial descritivo (editor + PDF) → 2E
- Filtros combinados (classe + confiança) → YAGNI
- Comparativo ABC entre budgets (BI) → Fase 3+
- Export da curva como CSV/Excel → YAGNI

---

## Estimativa

2 dias de trabalho concentrado. Se a seed atual tiver menos de 10 items, acrescentar 2h para regerar fixture. Se a seção no PDF quebrar o paginamento (improvável com `wrap={false}`), +2h para ajustar.
