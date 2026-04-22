# Fase 2E — Memorial Descritivo (editor + PDF)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** engenheiro revisor passa a **escrever o memorial descritivo do orçamento** (especificação técnica em markdown) dentro do fluxo HITL. O memorial vai pro PDF como seção técnica **antes da planilha analítica**, com formatação básica (headings, parágrafos, listas, negrito/itálico). Pilot-friendly: Isabela consegue colar texto do Word dela e o resultado sai limpo no PDF final.

**Architecture:**
- Schema: nova coluna `budgets.memorial_md text` via migration **015**. RPC `update_budget_memorial(p_budget_id, p_memorial, p_user_id)` com trilha em `validations` (`item_type = 'BUDGET_MEMORIAL'`) + guarda `IN_REVIEW`, espelhando o padrão de 2D.
- Pure lib `src/lib/markdown/parseMarkdown.ts` — `parseMarkdown(src) → Block[]`. Suporta heading (#, ##, ###), parágrafo, lista não-ordenada (`-`/`*`), e inline `**bold**`/`*italic*`. Sem tables/imagens/code blocks — fora de escopo.
- UI: `BudgetMemorialEditor.tsx` com textarea + preview ao vivo (split vertical). Seção colapsável no `AdminBudgetReview.tsx`, acima do `BudgetCurvaABC`.
- PDF: `src/lib/pdf/MarkdownPdfBlocks.tsx` re-renderiza `Block[]` em primitivos `@react-pdf/renderer`. Nova seção em `BudgetPDF.tsx` entre **Identificação do projeto** e **Planilha analítica**.

**Tech Stack:** Next.js 15 + React 19 + Supabase client. Vitest para pure fn. **Sem novos pacotes npm** — parser próprio (~80 linhas) evita react-markdown e mantém a mesma fonte de verdade entre UI e PDF.

**Spec de origem:** [`docs/specs/2026-04-18-fase2-engine-orcamento-design.md`](../specs/2026-04-18-fase2-engine-orcamento-design.md) §3.5 + §4.6 + §4.7.

---

## Pré-requisitos

- Fase 2A/2B/2C/2D mergeadas ✅ (convivem com o editor de memorial na mesma página)
- Budget de teste em `IN_REVIEW` (seed de 1B cobre)

## Convenções

- Branch: `feature/fase2e-memorial-descritivo`
- Worktree: `.worktrees/fase2e-memorial-descritivo/`
- Commits: `feat(fase2e): …` / `test(fase2e): …` / `docs(fase2e): …`
- Sem novos pacotes npm

---

## Task 1: Schema + RPC

**Files:**
- Create: `supabase/migrations/015_budget_memorial.sql`

Razão: o memorial é conteúdo textual longo versionado por revisão. Trilha em `validations` garante que não se perde quem escreveu/editou o quê — mesmo padrão dos outros RPCs de 2D (`update_budget_bdi`, `update_budget_item_bdi_override`).

- [ ] **Step 1: Adicionar coluna**

```sql
ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS memorial_md TEXT;

COMMENT ON COLUMN budgets.memorial_md IS
  'Memorial descritivo do orçamento em markdown. Subset suportado: headings (#/##/###), parágrafos, listas (-/*), bold (**), italic (*). Renderizado no PDF antes da planilha analítica.';
```

- [ ] **Step 2: RPC `update_budget_memorial(p_budget_id uuid, p_memorial text, p_user_id uuid)`**
  - Valida existência do budget
  - Valida `status = 'IN_REVIEW'` (consistência com 2D — budget validado é imutável; alteração exige nova versão, fora de escopo)
  - `p_memorial` pode ser `NULL` ou string (vazio limpa o campo)
  - `UPDATE budgets SET memorial_md = p_memorial, updated_at = now() WHERE id = p_budget_id`
  - `INSERT INTO validations (budget_id, validated_by, status, item_type, item_name, comment, changes)` com:
    - `item_type = 'BUDGET_MEMORIAL'`
    - `item_name = NULL` (é documento de budget, não item)
    - `status = 'IN_REVIEW'`
    - `comment = 'Memorial descritivo atualizado'`
    - `changes = jsonb_build_object('memorial_length', COALESCE(length(p_memorial), 0))` — guarda tamanho, não o texto todo, pra não inflar a trilha
  - `RETURN` o `validation_id`

- [ ] **Step 3: Grants**
  - `GRANT EXECUTE ON FUNCTION public.update_budget_memorial TO authenticated`

- [ ] **Step 4:** rodar `npx tsx scripts/apply-migration.ts 015` e conferir no banco
- [ ] **Step 5:** commit `feat(fase2e): schema memorial_md + RPC update_budget_memorial`

---

## Task 2: Pure fn `parseMarkdown`

**Files:**
- Create: `src/lib/markdown/parseMarkdown.ts`
- Create: `src/lib/markdown/parseMarkdown.test.ts`

Razão: UI e PDF precisam do **mesmo AST**. Escrever o parser 1x aqui evita divergência (e.g. lista aparecer na UI mas não no PDF). Tamanho estimado: ~80 linhas.

- [ ] **Step 1: Tipos**

```ts
// src/lib/markdown/parseMarkdown.ts
export type Inline =
  | { kind: 'text'; value: string }
  | { kind: 'bold'; value: string }
  | { kind: 'italic'; value: string }

export type Block =
  | { kind: 'heading'; level: 1 | 2 | 3; text: string }
  | { kind: 'paragraph'; inlines: Inline[] }
  | { kind: 'list'; items: Inline[][] }
  | { kind: 'empty' }

export function parseMarkdown(src: string): Block[]
export function parseInlines(line: string): Inline[]  // exportar pra testes
```

- [ ] **Step 2: Implementação**

Regras (determinísticas, linha a linha):
1. Split `src` por `\n`. Agrupa linhas consecutivas em blocos — blocos são separados por linha em branco OU mudança de tipo.
2. Linha começa com `# ` → heading nível 1. `## ` → 2. `### ` → 3. Resto do conteúdo depois do espaço é o `text` (sem inline parse — heading é texto puro, simplifica).
3. Linha começa com `- ` ou `* ` → item de lista. Consecutivas formam uma `list`. Cada item passa por `parseInlines`.
4. Outras linhas: acumula em um `paragraph`; aplica `parseInlines` no texto juntado por `\n`.
5. `parseInlines`: regex gulosa `**…**` → `bold`, `*…*` → `italic`, resto → `text`. Escape simples: `\*` vira `*` literal.
6. Linhas em branco viram bloco `empty` (ignorado no render, mas mantém contrato de posição — útil pra debug).

- [ ] **Step 3: Testes vitest (10 casos)**

```ts
describe('parseMarkdown', () => {
  it('string vazia → []', () => {})
  it('# Heading → heading nivel 1', () => {})
  it('### Sub → heading nivel 3', () => {})
  it('parágrafo simples → 1 block paragraph', () => {})
  it('duas linhas em sequência → 1 paragraph com 2 inlines de texto', () => {})
  it('linha em branco entre parágrafos → 2 blocks', () => {})
  it('- item a\\n- item b → list com 2 items', () => {})
  it('**bold** vira inline bold', () => {})
  it('*italic* vira inline italic', () => {})
  it('texto com **bold** no meio → inlines intercalados', () => {})
})
```

- [ ] **Step 4:** commit `feat(fase2e): pure fn parseMarkdown + testes`

---

## Task 3: Componente `BudgetMemorialEditor`

**Files:**
- Create: `src/components/BudgetMemorialEditor.tsx`
- Create: `src/components/BudgetMemorialPreview.tsx` (render dos `Block[]` em HTML/JSX)

Razão: separar o **render do AST** do **shell com textarea/save** permite reusar `BudgetMemorialPreview` numa futura visualização read-only (admin que só consulta, sem editar).

- [ ] **Step 1: `BudgetMemorialPreview` (puro)**

```tsx
interface PreviewProps { src: string }
// Parse src → Block[] → render em <section>:
//  heading → <h3>/<h4>/<h5>
//  paragraph → <p> com <strong>/<em> para inlines
//  list → <ul><li>
//  empty → nada
// Estado vazio: "Memorial descritivo não preenchido." em cinza.
```

- [ ] **Step 2: `BudgetMemorialEditor` (stateful)**

```tsx
interface Props {
  budgetId: string
  initial: string | null
  canEdit: boolean     // budget.status === 'IN_REVIEW'
  onSaved: () => void | Promise<void>
}
```

Layout (seção colapsável):
```
┌─ Memorial descritivo ────────────────── [▾/▸] ┐
│ ┌─ editor ──────────┐  ┌─ preview ─────────┐ │
│ │ textarea markdown │  │ <h3>/<p>/<ul>...  │ │
│ │ min-height 260px  │  │                   │ │
│ └───────────────────┘  └───────────────────┘ │
│ [Salvar memorial] [Cancelar]  (dirty indicator) │
└──────────────────────────────────────────────┘
```

- Estado local `draft` sincronizado da prop `initial` no mount e em `onSaved` externo.
- `dirty = draft !== (initial ?? '')`
- `Salvar` chama `supabase.rpc('update_budget_memorial', { p_budget_id, p_memorial, p_user_id })`, depois `onSaved()` pra recarregar o budget externo.
- `Cancelar` só habilita quando `dirty`; reseta `draft ← initial`.
- Colapsável: estado `collapsed` inicia `false` se há conteúdo, `true` se memorial é `null`/vazio (evita seção gigante vazia na primeira carga).

- [ ] **Step 3:** commit `feat(fase2e): BudgetMemorialEditor + preview`

---

## Task 4: Integração no `AdminBudgetReview`

**Files:**
- Modify: `src/views/admin/AdminBudgetReview.tsx`

- [ ] **Step 1: Carregar `memorial_md`**

Atualizar `select` do budget pra incluir o campo:
```ts
supabase.from('budgets').select('id, name, status, bdi_percentage, memorial_md, project_id, projects!inner(name)')
```

Adicionar ao tipo `Budget`:
```ts
interface Budget {
  ...
  memorial_md: string | null
}
```

- [ ] **Step 2: Renderizar `<BudgetMemorialEditor>`**
- Posicionar **acima** do `<BudgetCurvaABC>` (seção semântica "descritivo do orçamento" vem antes da análise visual).
- Passar `budgetId={budget.id}`, `initial={budget.memorial_md}`, `canEdit={budget.status === 'IN_REVIEW'}`, `onSaved={load}`.

- [ ] **Step 3: Validação manual**
- Escrever memorial com `# Título`, parágrafo com `**bold**`, lista `- a / - b`.
- Clicar Salvar → preview atualiza, trilha em `validations` ganha linha `BUDGET_MEMORIAL`.
- Refresh da página: memorial carregado de volta idêntico.
- Editar → `Cancelar` → draft volta ao último salvo.

- [ ] **Step 4:** commit `feat(fase2e): memorial descritivo no AdminBudgetReview`

---

## Task 5: Seção no PDF

**Files:**
- Create: `src/lib/pdf/MarkdownPdfBlocks.tsx`
- Modify: `src/lib/pdf/BudgetPDF.tsx`

- [ ] **Step 1: `MarkdownPdfBlocks`**

Componente React-PDF (`Document`-compatível) que recebe `{ src: string }`, chama `parseMarkdown(src)` e devolve uma `<View>` com os primitivos equivalentes:

```tsx
// Estilos (StyleSheet.create no topo)
// mdH1 / mdH2 / mdH3: Text com fontSize 11/10/9, bold, margem superior maior
// mdP: Text fontSize 9 com lineHeight 1.4
// mdListItem: View horizontal com bullet "•" + Text
// bold: <Text style={{ fontWeight: 'bold' }}>
// italic: <Text style={{ fontStyle: 'italic' }}>
```

Receita pra inlines: mapear `Inline[]` dentro de um único `<Text>` pai (react-pdf permite `<Text>` aninhado com styles diferentes).

- [ ] **Step 2: Nova seção em `BudgetPDF.tsx`**

Adicionar prop:
```ts
budget: {
  ...
  memorial_md: string | null
}
```

Renderizar entre **Identificação do projeto** e **Planilha analítica**:

```tsx
{budget.memorial_md && budget.memorial_md.trim().length > 0 && (
  <View style={styles.section} wrap>
    <Text style={styles.sectionTitle}>Memorial descritivo</Text>
    <MarkdownPdfBlocks src={budget.memorial_md} />
  </View>
)}
```

- [ ] **Step 3: Passar `memorial_md` no data loading**

Em `src/app/api/budgets/[id]/pdf/route.ts` (ou equivalente que monta os props), adicionar `memorial_md` ao `select` do budget.

- [ ] **Step 4: Validação visual**
- `GET /api/budgets/<id>/pdf` com budget que tem memorial.
- Conferir seção aparece antes da tabela, heading renderiza maior, bullets aparecem em listas, bold/italic visíveis.
- Budget sem memorial → seção não aparece (não fica título "Memorial descritivo" em branco).

- [ ] **Step 5:** commit `feat(fase2e): renderização do memorial descritivo no PDF`

---

## Task 6: Smoke test log + PR

**Files:**
- Create: `docs/plans/fase2e-teste-memorial.md`

- [ ] **Step 1:** Log com:
  - Screenshot do editor com textarea + preview lado a lado.
  - Screenshot do PDF mostrando a seção "Memorial descritivo" entre info do projeto e planilha.
  - Tabela "markdown input → render UI → render PDF" cobrindo heading, parágrafo, lista, bold, italic.
  - Linha da trilha `validations` (`BUDGET_MEMORIAL`).
- [ ] **Step 2:** commit `docs(fase2e): log do smoke test memorial descritivo`
- [ ] **Step 3: PR** `feat: Fase 2E — memorial descritivo (editor + PDF)` contra `main`.

---

## Critérios de pronto

- [ ] Migration 015 aplicada (coluna `memorial_md` + RPC `update_budget_memorial`)
- [ ] `parseMarkdown` com 10 testes verdes
- [ ] `BudgetMemorialEditor` salva/carrega memorial, preview ao vivo, trilha `BUDGET_MEMORIAL` aparece em `validations`
- [ ] PDF mostra seção "Memorial descritivo" antes da planilha analítica quando há conteúdo; ausente quando vazio
- [ ] Bold/italic/heading/lista renderizam idênticos entre UI e PDF (mesma fonte de AST)
- [ ] Smoke test log commitado com screenshots
- [ ] PR aberto contra `main`

---

## Decisões explícitas / riscos

- **Parser próprio em vez de `react-markdown`**: 2 motivos — (1) mesma fonte precisa ir pro PDF, e react-markdown não funciona com react-pdf; (2) evita 40kb+ de dependência pra um subset que cabe em 80 linhas. Contratrade: markdown "exótico" (tables, HTML inline, code blocks) não renderiza. Aceitável porque memorial técnico quase nunca precisa disso; se aparecer demanda, estender o parser é mudança local.
- **Heading sem inline**: `# *foo*` renderiza literalmente `*foo*`. Simplificação deliberada — headings técnicos raramente precisam de bold/italic e escapar `*` dentro deles complica o parser sem ganho prático.
- **Memorial não participa do hash SHA-256 do PDF**: o `contentHash` atual (`BudgetPDF` prop) é calculado a partir dos items e totais, não do layout. Como o memorial é texto informativo (não afeta preço), mantém o hash estável. Se o pilot quiser hash-inclui-tudo depois, estendemos em fase futura sem quebrar PDFs antigos.
- **Sem versionamento do memorial**: a trilha em `validations` guarda só o `length`, não o texto histórico. Se precisar "qual era o memorial há 2 versões" vira Fase 3 (quando aditivos versionarem budgets inteiros). MVP: a versão atual é a que vale.
- **`IN_REVIEW` como guarda**: idêntico a 2D. Memorial num budget `VALIDATED` fica read-only. Se o engenheiro descobrir erro no memorial pós-validação, precisa de nova versão do budget (fluxo de aditivo — fora de escopo).
- **Limite de tamanho**: `text` no Postgres é ilimitado. Não impomos CHECK, mas o `react-pdf` pode ficar lento em memoriais muito longos (>20 páginas). Se aparecer, adicionar paginação do markdown — hoje é risco teórico.

## Fora de escopo (próximos sub-planos)

- AI draft do memorial (gerar a partir dos items/projeto) → Fase 3 ou 2F tail se sobrar tempo
- AI fuzzy-match SINAPI + badge "sugerido" → 2F
- E2E completo (Playwright) + docs `sinapi-import-guide.md` + README → 2F
- Tabelas/imagens/code blocks no markdown → demanda futura
- Aditivos / versionamento de budget (inclui histórico de memorial) → Fase 3

---

## Estimativa

1-2 dias. Task 1 (schema+RPC) é 1h. Task 2 (parser+testes) ~3h — regex de inline é o único ponto traiçoeiro. Task 3 (componente) ~2h. Task 4 (integration) ~1h. Task 5 (PDF) ~3h — o trabalho está em acertar os estilos `StyleSheet` do react-pdf pra ficar tipográfico (não "Word-like feio"). Task 6 ~1h.
