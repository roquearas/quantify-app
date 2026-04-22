# Fase 2F — AI fuzzy-match SINAPI + E2E completo + docs finais

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** fechar a **Fase 2** com 3 entregas interligadas — (1) engenheiro revisor vê **sugestões SINAPI automáticas** para cada item ainda não linkado, com badge + aceitar/ignorar; (2) Playwright roda **4 cenários E2E novos** cobrindo SINAPI, Curva ABC, BDI e memorial de ponta a ponta; (3) **docs finais** (`sinapi-import-guide.md`, seção de engine no README, spec Fase 1 atualizada). Após 2F, todos os critérios de "Fase 2 concluída" (spec §7) estão verdes.

**Architecture:**
- **Fuzzy-match não introduz schema novo**. Reusa `search_sinapi` (migration 011, Fase 2B) e `link_budget_item_sinapi`. O único add é uma RPC de batch `suggest_sinapi_for_budget(p_budget_id, p_min_similarity)` read-only que percorre items sem link, roda busca com `item.description` e devolve o melhor match com similaridade. Sem persistência — UI guarda em state e só persiste via aceitação (que já chama `link_budget_item_sinapi`).
- **UI**: botão "Sugerir SINAPI" no cabeçalho do `AdminBudgetReview`. Roda a RPC, preenche estado `suggestions: Map<itemId, Suggestion>`, e cada linha sem link-atual ganha badge `✨ SINAPI sugerido #X (92%)`. Duas ações por sugestão: **aceitar** (reusa `onLinkSinapi`) e **ignorar** (some da UI; não persiste).
- **Parâmetros de projeto**: a RPC precisa saber estado/mês/desonerado pra filtrar. MVP: pegar do próprio `sinapi_import_log` mais recente para o estado do projeto (fallback: SP + mês atual + desonerado=true). Configurar por projeto fica fora de escopo — `project.state` + "último mês importado" é suficiente pro pilot da Isabela.
- **E2E**: Playwright já configurado (smoke de Fase 1F). Adicionar 4 specs novos, `authenticated fixture` pra login rápido, e opcionalmente seed helpers em `tests/e2e/helpers/`.
- **Docs**: 3 arquivos — guia de import, seção README, atualização da spec Fase 1 marcando itens como ✅.

**Tech Stack:** Next.js 15 + React 19 + Supabase client + Playwright 1.59. Sem novos pacotes npm.

**Spec de origem:** [`docs/specs/2026-04-18-fase2-engine-orcamento-design.md`](../specs/2026-04-18-fase2-engine-orcamento-design.md) §4.8 + §4.9 + §4.10 + §7.

---

## Pré-requisitos

- Fase 2A/2B/2C/2D/2E mergeadas ✅
- SINAPI importado pra pelo menos um `(estado, mes_referencia, desonerado)` (pilot: SP + mês recente + desonerado=true)
- Budget de teste em `IN_REVIEW` com ≥10 items sem SINAPI link (pra exercitar o batch)

## Convenções

- Branch: `feature/fase2f-ai-match-e2e-docs`
- Worktree: `.worktrees/fase2f-ai-match-e2e-docs/`
- Commits: `feat(fase2f): …` / `test(fase2f): …` / `docs(fase2f): …`
- Sem novos pacotes npm

---

## Task 1: RPC `suggest_sinapi_for_budget`

**Files:**
- Create: `supabase/migrations/016_suggest_sinapi_for_budget.sql`

Razão: o `search_sinapi` existente é single-query. Rodar N queries do client pra N items é chatto (N round-trips + lógica de "pegar só o melhor" no JS). Melhor 1 RPC que faz o loop server-side e devolve `(item_id, sinapi_type, sinapi_id, codigo, descricao, preco_unitario, similarity)`.

- [ ] **Step 1: Assinatura**

```sql
CREATE OR REPLACE FUNCTION suggest_sinapi_for_budget(
  p_budget_id uuid,
  p_min_similarity real DEFAULT 0.35,
  p_estado text DEFAULT NULL,
  p_mes_referencia date DEFAULT NULL,
  p_desonerado boolean DEFAULT true
) RETURNS TABLE (
  item_id uuid,
  item_description text,
  sinapi_type text,
  sinapi_id uuid,
  sinapi_codigo text,
  sinapi_descricao text,
  sinapi_unidade text,
  sinapi_preco_unitario numeric,
  similarity real
)
LANGUAGE plpgsql SECURITY INVOKER STABLE
AS $$
DECLARE
  v_estado text;
  v_mes date;
BEGIN
  -- Resolver defaults: se não veio param, usa dados do projeto + último import
  -- (ver Step 2 para lógica completa)
  ...
END;
$$;
```

- [ ] **Step 2: Resolução de defaults**
  - Se `p_estado IS NULL`: buscar `projects.state` do budget pai. Se projeto não tem estado, erro claro `RAISE EXCEPTION 'Estado não resolvido para budget %'`.
  - Se `p_mes_referencia IS NULL`: `SELECT max(mes_referencia) FROM sinapi_import_log WHERE status = 'SUCCESS' AND estado = v_estado`. Se null, erro `'Nenhum import SINAPI para estado %'`.
  - `p_desonerado` default `true` (pilot SP).

- [ ] **Step 3: Loop + melhor match**

Pra cada item do budget **sem SINAPI já linkado** (`origem NOT IN ('SINAPI_INSUMO', 'SINAPI_COMPOSICAO')`), chamar `search_sinapi(item.description, v_estado, v_mes, v_desonerado, 'both', 1)` e:
- Se retornou ≥1 linha E `similarity >= p_min_similarity`: incluir na saída.
- Senão: pula.

```sql
RETURN QUERY
SELECT
  bi.id,
  bi.description,
  s.tipo,
  s.id,
  s.codigo,
  s.descricao,
  s.unidade,
  s.preco_unitario,
  s.similarity
FROM budget_items bi
CROSS JOIN LATERAL (
  SELECT *
  FROM search_sinapi(bi.description, v_estado, v_mes, v_desonerado, 'both', 1)
  LIMIT 1
) s
WHERE bi.budget_id = p_budget_id
  AND bi.origem NOT IN ('SINAPI_INSUMO'::budget_item_origem, 'SINAPI_COMPOSICAO'::budget_item_origem)
  AND s.similarity >= p_min_similarity
ORDER BY s.similarity DESC;
```

- [ ] **Step 4: Grants + comment**
  - `GRANT EXECUTE ON FUNCTION public.suggest_sinapi_for_budget TO authenticated`
  - COMMENT ON FUNCTION explicando defaults + que é read-only.

- [ ] **Step 5:** rodar `npx tsx scripts/apply-migration.ts 016`, testar com `SELECT * FROM suggest_sinapi_for_budget('<uuid-budget-teste>')`. Conferir saída tem 1 linha por item, ordenada por similarity DESC.

- [ ] **Step 6:** commit `feat(fase2f): RPC suggest_sinapi_for_budget (batch fuzzy-match)`

---

## Task 2: Integração no `AdminBudgetReview`

**Files:**
- Modify: `src/views/admin/AdminBudgetReview.tsx`
- Modify: `src/lib/sinapi/search.ts` (ou criar `src/lib/sinapi/suggest.ts`)

- [ ] **Step 1: Client helper**

```ts
// src/lib/sinapi/suggest.ts
export interface SinapiSuggestion {
  item_id: string
  item_description: string
  sinapi_type: 'INSUMO' | 'COMPOSICAO'
  sinapi_id: string
  sinapi_codigo: string
  sinapi_descricao: string
  sinapi_unidade: string
  sinapi_preco_unitario: number
  similarity: number
}

export async function suggestSinapiForBudget(
  supabase: SupabaseClient,
  budgetId: string,
  options?: { minSimilarity?: number; estado?: string; mesReferencia?: string; desonerado?: boolean },
): Promise<SinapiSuggestion[]>
```

- [ ] **Step 2: Estado no review**

```ts
const [suggestions, setSuggestions] = useState<Map<string, SinapiSuggestion>>(new Map())
const [suggesting, setSuggesting] = useState(false)
const [suggestionError, setSuggestionError] = useState<string | null>(null)

async function runSuggestions() {
  setSuggesting(true); setSuggestionError(null)
  try {
    const list = await suggestSinapiForBudget(supabase, id)
    setSuggestions(new Map(list.map((s) => [s.item_id, s])))
  } catch (e) {
    setSuggestionError(e instanceof Error ? e.message : String(e))
  } finally { setSuggesting(false) }
}
```

- [ ] **Step 3: Botão + badge**

Botão no header da página, ao lado de "Finalizar revisão":
```tsx
<button className="btn btn-outline" onClick={runSuggestions} disabled={suggesting || busy}>
  <Sparkles size={14} /> {suggesting ? 'Sugerindo…' : 'Sugerir SINAPI'}
</button>
```

Na célula de descrição da tabela, quando `suggestions.has(it.id) && it.origem === 'MANUAL'` (ou 'AI_DRAFT'):
```tsx
<div style={{ fontSize: 11, color: '#8E44AD', marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
  <Sparkles size={10} />
  SINAPI sugerido {suggestion.sinapi_type === 'COMPOSICAO' ? 'composição' : 'insumo'}{' '}
  {suggestion.sinapi_codigo} ({Math.round(suggestion.similarity * 100)}%)
  <button className="btn btn-xs btn-primary" onClick={() => acceptSuggestion(it.id)}>Aceitar</button>
  <button className="btn btn-xs btn-ghost" onClick={() => ignoreSuggestion(it.id)}>Ignorar</button>
</div>
```

- [ ] **Step 4: `acceptSuggestion` / `ignoreSuggestion`**
  - Accept reusa `onLinkSinapi(itemId, { id, tipo, codigo, descricao, unidade, preco_unitario }, true)`. Após sucesso, remove da Map.
  - Ignore só remove da Map (sem persistir).

- [ ] **Step 5: Validação manual**
  - Budget com 5 itens MANUAL, botão "Sugerir SINAPI" → aparecem 3 badges (só os com match ≥ 35%).
  - Aceitar 1 → vira badge "SINAPI composição #X" (a antiga, de link definitivo) + custo atualiza.
  - Ignorar outro → badge some, item continua MANUAL.

- [ ] **Step 6:** commit `feat(fase2f): sugestões SINAPI em batch no AdminBudgetReview`

---

## Task 3: E2E Playwright — cenário `budget-with-sinapi`

**Files:**
- Create: `tests/e2e/helpers/auth.ts` — fixture pra logar via `supabase.auth.signInWithPassword` e persistir cookies
- Create: `tests/e2e/helpers/seed.ts` — helpers SQL pra criar empresa/projeto/budget de teste (reusa service role em env de teste)
- Create: `tests/e2e/budget-with-sinapi.spec.ts`

Razão: este é **o teste mais importante** — prova que um budget real atravessa o fluxo completo com SINAPI.

- [ ] **Step 1: Fixture `authenticatedPage`**

```ts
// helpers/auth.ts
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login')
    await page.fill('input[type=email]', process.env.E2E_ADMIN_EMAIL!)
    await page.fill('input[type=password]', process.env.E2E_ADMIN_PASSWORD!)
    await page.click('button[type=submit]')
    await page.waitForURL(/\/admin/, { timeout: 15_000 })
    await use(page)
  },
})
```

- [ ] **Step 2: Seed + teardown**

```ts
// helpers/seed.ts
export async function seedBudgetInReview(opts: {
  name: string
  items: Array<{ description: string; quantity: number; unit_cost: number }>
}): Promise<{ budgetId: string; projectId: string; cleanup: () => Promise<void> }>
```

- [ ] **Step 3: Teste — happy path SINAPI**

```ts
test('engenheiro linka item a composição SINAPI e vê código no PDF', async ({ authenticatedPage: page }) => {
  const { budgetId, cleanup } = await seedBudgetInReview({
    name: 'E2E SINAPI',
    items: [{ description: 'alvenaria tijolo furado', quantity: 100, unit_cost: 50 }],
  })
  try {
    await page.goto(`/admin/orcamentos/${budgetId}/revisar`)
    await page.getByRole('button', { name: /Linkar SINAPI/i }).first().click()
    await page.getByPlaceholder(/buscar/i).fill('alvenaria')
    await page.getByRole('button', { name: /Linkar/i }).first().click()
    // Badge SINAPI aparece
    await expect(page.getByText(/SINAPI .* \d+/)).toBeVisible()
    // PDF endpoint responde com 200 e content-type application/pdf
    const res = await page.request.get(`/api/budgets/${budgetId}/pdf`)
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('pdf')
  } finally { await cleanup() }
})
```

- [ ] **Step 4:** commit `test(fase2f): E2E budget com SINAPI picker + PDF`

---

## Task 4: E2E Playwright — cenários ABC + BDI + memorial

**Files:**
- Create: `tests/e2e/curva-abc.spec.ts`
- Create: `tests/e2e/bdi-override.spec.ts`
- Create: `tests/e2e/memorial.spec.ts`

- [ ] **Step 1: `curva-abc.spec.ts`**
  - Seed budget com 20 items (2 custos muito altos, 8 médios, 10 baixos).
  - Abrir review, esperar `BudgetCurvaABC` renderizar.
  - Assertions: classe A ≈ 2 items, B ≈ 8, C ≈ 10 (tolerância ±1). Somas percentuais batem.
  - Clicar filtro "A" → tabela mostra só 2 linhas.

- [ ] **Step 2: `bdi-override.spec.ts`**
  - Seed budget com 3 items + BDI global 20%.
  - Abrir review, confirmar `Total com BDI` = subtotal × 1.2.
  - Editar item #1 → setar `bdi_override_percent = 30` → salvar.
  - Confirmar `bdiEffectivePercent > 20`, `Total` aumentou, asterisco aparece.
  - Limpar override (input vazio) → total volta ao BDI global.

- [ ] **Step 3: `memorial.spec.ts`** (requer Fase 2E mergeada)
  - Seed budget em review.
  - Abrir `BudgetMemorialEditor`, digitar markdown com `# Titulo`, `**bold**`, `- item`.
  - Clicar Salvar.
  - Recarregar página, conferir textarea carrega o markdown salvo.
  - `GET /api/budgets/<id>/pdf` → resposta OK.

- [ ] **Step 4:** commit `test(fase2f): E2E curva ABC + BDI override + memorial`

---

## Task 5: CI — rodar E2E no workflow do GitHub

**Files:**
- Modify: `.github/workflows/ci.yml` (ou criar se ausente)

- [ ] **Step 1: Garantir step `npx playwright install chromium` + `npm run test:e2e`**

Condição: rodar só se secrets `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`/`E2E_SUPABASE_URL`/`E2E_SERVICE_ROLE_KEY` estão setados (skip graceful caso não estejam, pra não quebrar fork PRs).

- [ ] **Step 2: Artefato**
- Upload de `playwright-report/` como artifact em falha.

- [ ] **Step 3:** commit `ci(fase2f): rodar Playwright no CI com artefato em falha`

---

## Task 6: Docs

**Files:**
- Create: `docs/sinapi-import-guide.md`
- Modify: `README.md` (adicionar seção "Engine de orçamento")
- Modify: `docs/specs/2026-04-18-fase1-fundacao-design.md` (marcar "✅ Implementado")

- [ ] **Step 1: `docs/sinapi-import-guide.md`**

Conteúdo:
- Onde baixar XLSX da Caixa (link + print do site)
- Qual tipo escolher (insumos/composições, desonerado/com desoneração, estado)
- Rodar `npx tsx scripts/import-sinapi.ts --file <path> --estado SP --mes 2026-03-01 --desonerado`
- Verificar em `/admin/sinapi/import` ou via SQL (`SELECT COUNT(*) FROM sinapi_composicao WHERE estado = 'SP' AND mes_referencia = '2026-03-01'`)
- Tabela de erros comuns (cabeçalho diferente, ÇÍÇÓ encoding, etc.) e como tratar
- Frequência recomendada: mensal, 1º dia útil após publicação da Caixa

- [ ] **Step 2: README seção "Engine de orçamento"**

Resumo de 2 parágrafos + diagrama ASCII:
```
service_request → project → budget (AI_DRAFT)
                              ↓
                     review HITL item-por-item
                              ↓
   (opcional) linkar SINAPI via picker ou sugestão automática
                              ↓
              Curva ABC + BDI (global ou por item)
                              ↓
                 memorial descritivo (markdown)
                              ↓
                 finalizar → VALIDATED
                              ↓
                       PDF assinado (SHA-256)
```

- [ ] **Step 3: Atualizar spec Fase 1**

Em `docs/specs/2026-04-18-fase1-fundacao-design.md`, marcar itens "✅ Implementado" para tudo que entrou (Fase 1A-1F).

- [ ] **Step 4:** commit `docs(fase2f): guia SINAPI + README engine + spec Fase 1 marcado ✅`

---

## Task 7: Checklist de "Fase 2 concluída" + PR

**Files:**
- Create: `docs/plans/fase2f-teste-e2e-docs.md`

- [ ] **Step 1:** Log com:
  - Screenshot do batch de sugestões funcionando (5 items → 3 badges)
  - Print do Playwright report (todos 4 cenários verdes)
  - Link pro `sinapi-import-guide.md` renderizado
  - Checklist final da spec §7:
    - [ ] Schema SINAPI aplicado
    - [ ] Importador rodado ≥5000 composições
    - [ ] 1 budget real com ≥50% items SINAPI
    - [ ] Curva ABC visível
    - [ ] BDI configurável
    - [ ] Memorial em ≥1 PDF
    - [ ] 4 cenários E2E passando no CI
    - [ ] Isabela revisa 1 orçamento real usando picker SINAPI
    - [ ] Docs atualizados
- [ ] **Step 2:** commit `docs(fase2f): log de fechamento da Fase 2`
- [ ] **Step 3: PR** `feat: Fase 2F — AI fuzzy-match + E2E + docs finais` contra `main`.

---

## Critérios de pronto

- [ ] RPC `suggest_sinapi_for_budget` criada e testada
- [ ] Botão "Sugerir SINAPI" + badges funcionando no `AdminBudgetReview`
- [ ] 4 cenários Playwright (`budget-with-sinapi`, `curva-abc`, `bdi-override`, `memorial`) verdes localmente
- [ ] CI workflow atualizado pra rodar Playwright com artefato em falha
- [ ] `docs/sinapi-import-guide.md` publicado
- [ ] README ganhou seção "Engine de orçamento"
- [ ] Spec Fase 1 marcada ✅ nos itens implementados
- [ ] Log de fechamento da Fase 2 commitado
- [ ] PR aberto contra `main`

---

## Decisões explícitas / riscos

- **Sugestões são efêmeras (vivem só em state React)**: não persistimos "sugestão ignorada" — se o admin rodar de novo aparece de novo. Aceitável pro MVP; se virar ruído no pilot, adicionar `budget_item.sinapi_suggestion_ignored_at timestamptz` em fase futura.
- **Threshold 0.35**: valor escolhido por calibração empírica do `pg_trgm` em português construtivo ("alvenaria 1 vez tijolo" vs "alvenaria em tijolo furado" ~0.42). Deve cobrir 60-80% dos items com item_description razoavelmente específico. Ajustável por param da RPC se o pilot mostrar muitos falsos-positivos/negativos.
- **Defaults estado/mês**: a RPC resolve a partir de `projects.state` + último `sinapi_import_log` bem-sucedido. Se o projeto tem estado, funciona silenciosamente. Se não (projetos antigos de seed), a RPC erra com mensagem clara — admin edita o projeto.
- **Seed E2E usa service-role key**: os helpers `seedBudgetInReview` precisam de privilégio pra inserir direto na tabela (contornando RLS). Key só existe no CI secret e na máquina dev do engenheiro — nunca em env público. Se vazar em log, rotacionar.
- **Flakiness do Playwright**: fuzzy-match envolve Postgres full text — similaridade pode variar com dados. Seed controlado evita ruído: usamos descrições fixas no fixture (`'alvenaria tijolo furado'`) que têm match determinístico contra a SINAPI importada.
- **Cenário ausente — SINAPI import E2E**: a spec §4.9 menciona `sinapi-import.spec.ts`. Decisão: adiar. Importar XLSX em CI exige upload de fixture (~500KB) + parser estável. Ganho baixo (é fluxo admin raro). Se for requisito do pilot, adicionar depois.

## Fora de escopo (próximas fases)

- Super-admin role global pra importer (spec §10 abre essa discussão) → Fase 3
- Multi-estado simultâneo por projeto → Fase 3
- Aditivos + versionamento de budget → Fase 3
- Embeddings/pgvector substituindo `pg_trgm` → quando volume justificar
- AI gerando memorial a partir do plano (integração OpenAI/Claude) → Fase 3

---

## Estimativa

3-4 dias. Distribuição:
- Task 1 (RPC): ~3h — `CROSS JOIN LATERAL` + resolução de defaults é o trabalho real.
- Task 2 (UI): ~4h — estado + botão + badge + reuso do accept.
- Tasks 3+4 (E2E, 4 specs): ~1.5 dia — maior parte é `helpers/seed.ts` + `helpers/auth.ts`. Cada spec depois cai em ~45min.
- Task 5 (CI): ~2h — workflow YAML + secrets.
- Task 6 (docs): ~4h — escrever claro vale o tempo; atualizar spec antigo é rápido.
- Task 7 (PR): ~1h.
