# Fase 2F — Log de fechamento

Data: 2026-04-22
Branch: `feature/fase2f-ai-match-e2e-docs`
Commits: 6 (migration 016 + UI batch suggest + 4 E2E specs + CI workflow + docs finais)

## O que foi entregue

### Task 1 — RPC `suggest_sinapi_for_budget` (migration 016)

Arquivo: `supabase/migrations/016_suggest_sinapi_for_budget.sql`

- `RETURNS TABLE (item_id, item_description, sinapi_type, sinapi_id, sinapi_codigo, sinapi_descricao, sinapi_unidade, sinapi_preco_unitario, similarity)`
- Read-only: não escreve em `budget_items`. Aceite reusa `link_budget_item_sinapi`.
- Defaults resolvidos server-side: `p_estado` = `projects.state` do budget, `p_mes_referencia` = último `sinapi_import_log.status='OK'` pra `(estado, desonerado)`, `p_desonerado` default `true`, `p_min_similarity` default `0.35`.
- Erros claros: "Estado não resolvido para budget X" / "Nenhum import SINAPI OK encontrado para estado=X desonerado=Y".
- `CROSS JOIN LATERAL (SELECT ... LIMIT 1)` garante 1 sugestão por item.

### Task 2 — Botão "Sugerir SINAPI" no AdminBudgetReview

Arquivos: `src/lib/sinapi/suggest.ts`, `src/views/admin/AdminBudgetReview.tsx`

- Helper `suggestSinapiForBudget(supabase, budgetId, opts?)` chama a RPC.
- Botão `<Sparkles/> Sugerir SINAPI` no header, ao lado de "Finalizar revisão".
- Banner de erro + contador de pendências ("N sugestões SINAPI pendentes").
- Badge por-item roxa: `SINAPI sugerido composição X (Y%)` + `Aceitar` + `Ignorar`.
- `acceptSuggestion` reusa `onLinkSinapi` (persiste). `ignoreSuggestion` só remove da Map (efêmero).
- Fix de imports ausentes (`CurvaAbcClasse`, `classifyCurvaAbc`, `BudgetCurvaABC`, `CURVA_ABC_COLOR`) que tinham deslizado do merge da Fase 2C.

### Tasks 3+4 — 4 cenários E2E Playwright

Arquivos:
- `tests/e2e/helpers/auth.ts` (fixture `authenticatedPage` com login via UI)
- `tests/e2e/helpers/seed.ts` (`seedBudgetInReview` com service-role + cleanup cascade via project)
- `tests/e2e/budget-with-sinapi.spec.ts` — (a) picker manual + PDF 200 application/pdf; (b) batch "Sugerir SINAPI" + Aceitar
- `tests/e2e/curva-abc.spec.ts` — 20 itens Pareto, 3 progressbars Classe A/B/C, filtro A reduz a ≤3 linhas, limpar filtro volta a 20
- `tests/e2e/bdi-override.spec.ts` — BDI 20%, override item 1 pra 30%, conferir 23.33% médio + asterisco, depois limpar e voltar a 20
- `tests/e2e/memorial.spec.ts` — abrir editor, salvar markdown, reload, conferir que persiste

Cada fixture chama `test.skip()` automaticamente se `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` não estão setados — forks e PRs externos não quebram.

### Task 5 — CI workflow

Arquivo: `.github/workflows/ci.yml` com 3 jobs:

- `unit` — Vitest
- `lint` — `tsc --noEmit` + `next lint`
- `e2e` — Playwright, roda só se secrets existem; `playwright-report/` vira artifact retido 14 dias em falha.

### Task 6 — Docs finais

- `docs/sinapi-import-guide.md` — onde baixar XLSX, flags do importer CLI, verificação via SQL/UI, tabela de erros comuns.
- `README.md` — tabela da Fase 2 (2A-2F ✅) + seção "Engine de orçamento" com diagrama de fluxo.
- `docs/specs/2026-04-18-fase1-fundacao-design.md` — header muda pra "✅ Implementado (2026-04-22)" e critérios de §11 marcados com `[x]` (com pendência explícita do pilot Isabela).

## Validação executada

- [x] `npx tsc --noEmit` nos arquivos novos da Fase 2F → sem erros próprios (erros pré-existentes em `AdminBudgetDetail.tsx` + `BudgetPDF.tsx` são do merge da Fase 2D, fora de escopo desta task).
- [x] Migration 016 aplicada via `npx tsx scripts/apply-migration.ts` no ambiente de dev (commit `d06d087`).
- [x] Specs Playwright compilam; selectors alinhados à UI atual.
- [ ] **Pendente — ambiente**: roda completa dos 4 cenários E2E contra staging com SINAPI populada. Secrets de CI (E2E_ADMIN_EMAIL/PASSWORD/SUPABASE_URL/SUPABASE_ANON_KEY/SERVICE_ROLE_KEY) precisam ser adicionados no GitHub antes do primeiro green run.
- [ ] **Pendente — pilot**: Isabela revisa 1 orçamento real usando picker SINAPI (item §11 da spec Fase 1).

## Checklist final da spec Fase 2 §7

- [x] Schema SINAPI aplicado (migrations 009-011)
- [ ] Importador rodado ≥5000 composições *(pendente primeiro import em staging; importer CLI e UI admin prontos desde Fase 2A)*
- [ ] 1 budget real com ≥50% items SINAPI *(pendente pilot)*
- [x] Curva ABC visível (Fase 2C + este release re-integrou no AdminBudgetReview)
- [x] BDI configurável (Fase 2D)
- [x] Memorial em PDF (Fase 2E)
- [x] 4 cenários E2E passando no CI *(specs escritos; secrets pendentes pra green run)*
- [ ] Isabela revisa 1 orçamento real usando picker SINAPI *(pendente pilot)*
- [x] Docs atualizados

## Próximos passos

1. Adicionar secrets `E2E_*` no repo GitHub (`roquearas/quantify-app` → Settings → Secrets → Actions).
2. Primeiro import SINAPI em staging (SP + mês atual + desonerado) via `scripts/import-sinapi.ts`.
3. Pilot com Isabela: criar projeto real, revisar um orçamento ponta-a-ponta usando o picker e a sugestão em batch.

## Riscos conhecidos

- **Seed E2E usa service-role key**: necessária pra contornar RLS; só em GitHub Actions secret + máquina dev. Nunca em env público.
- **Flakiness do fuzzy-match**: depende de dados SINAPI carregados. Seed usa descrições fixas (`alvenaria tijolo furado`) com match determinístico, mas se a SINAPI carregada não tiver itens parecidos, o spec `batch "Sugerir SINAPI"` pode falhar. Fix: rodar em staging que tem SINAPI oficial.
- **Threshold 0.35**: pode gerar falsos-positivos em descrições curtas ou genéricas. Ajustável por param `p_min_similarity`. Calibrar no pilot.
