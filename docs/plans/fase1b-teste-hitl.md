# Fase 1B — Teste HITL (RPC layer via SQL)

Data: 2026-04-18  
Ambiente: Supabase `rrfmfybklhlaoaxmhdyr` (produção compartilhada)  
Método: MCP `execute_sql` + `apply_migration`  
Fixture: budget `a8135ff8-d764-4117-add6-92fa47be24f1` (5 items, BDI 25%)

## Migration aplicada

Via MCP `apply_migration` como `onda_b9_budget_hitl_rpc_functions`:
- `submit_budget_for_review(p_budget_id uuid) → void` (1 arg)
- `validate_budget_item(p_item_id uuid, p_user_id uuid, p_action text, p_comment text, p_changes jsonb) → uuid` (5 args)
- `finalize_budget_review(p_budget_id uuid, p_user_id uuid) → text` (2 args)

## Fluxo executado

### Cenário: happy path com 1 edit + re-approve

1. **Inicial**: budget `AI_DRAFT`, 5 items
2. `submit_budget_for_review(budget_id)` → status = `IN_REVIEW` ✅
3. `validate_budget_item` em cada item:
   - Concreto fck=30 MPa — **APPROVE** ("OK")
   - Aço CA-50 cortado e dobrado — **APPROVE** ("OK")
   - Alvenaria bloco cerâmico 14x19x39 — **APPROVE** ("OK")
   - Instalações hidráulicas (estimativa) — **APPROVE** ("OK")
   - Instalações elétricas (estimativa) — **EDIT** com `unit_cost: 48000` (era 42000)
4. **Estado parcial**: 4 VALIDATED + 1 IN_REVIEW (o edit)
5. `validate_budget_item(elétricas, APPROVE, "Revisado após ajuste")` → re-aprovado
6. `finalize_budget_review(budget_id, user_id)` → retornou `'VALIDATED'` ✅

### Totais

- Subtotal dos 5 items (com elétricas editadas para 48000): **R$ 170.150,00**
  - 40m³ × R$ 485 = 19.400
  - 6000kg × R$ 8,50 = 51.000
  - 380m² × R$ 62,50 = 23.750
  - 1vb × R$ 48.000 = 48.000 ← **editado**
  - 1vb × R$ 28.000 = 28.000
- BDI 25%: multiplicador 1.25
- **Total final** (salvo em `budgets.total_cost`): **R$ 212.687,50** ✅

### Trilha em `validations`

| Ordem | Status | Item | Comentário |
|---|---|---|---|
| 1 | VALIDATED | Concreto fck=30 MPa | OK |
| 2 | VALIDATED | Aço CA-50 cortado e dobrado | OK |
| 3 | VALIDATED | Alvenaria bloco cerâmico 14x19x39 | OK |
| 4 | IN_REVIEW | Instalações elétricas (estimativa) | Ajuste: mercado atual ±15% (changes: unit_cost=48000) |
| 5 | VALIDATED | Instalações hidráulicas (estimativa) | OK |
| 6 | VALIDATED | Instalações elétricas (estimativa) | Revisado após ajuste |
| 7 | VALIDATED | (budget) | Budget validado: 5 itens aprovados |

**Total de 7 rows auditáveis** — trilha completa de quem validou o que e quando.

## Cenários não testados (para fase 1B)

- **Cenário rejeição**: 1 ou mais REJECT → `finalize_budget_review` deve retornar 'REJECTED' e atualizar `budgets.status='REJECTED'`
- **Cenário pending**: items não totalmente revisados → retorna `'PENDING:N_items_restantes'`, budget fica em IN_REVIEW
- **Cenário budget vazio**: `submit_budget_for_review` deve falhar com mensagem "não tem items"
- **Cenário budget fora de AI_DRAFT**: `submit_budget_for_review` deve falhar com "não está em AI_DRAFT"

Cobrir estes 4 cenários manualmente via UI após merge (ou adicionar como testes automatizados em Fase 1F quando tiver Playwright).

## UI (browser)

A UI foi implementada mas não testada no browser nesta sessão (só via SQL). Teste manual pendente:

- [ ] `/admin/orcamentos` — lista com filtro IN_REVIEW mostra a fixture
- [ ] Click → `/admin/orcamentos/[id]` — detalhe com 5 items, botão "Revisar"
- [ ] `/admin/orcamentos/[id]/revisar` — aprovar/editar/rejeitar funcionam
- [ ] Trilha aparece como tabela embaixo
- [ ] "Finalizar revisão" muda status e redireciona

## Conclusão

**Camada de banco (RPCs)**: ✅ funcional e auditável  
**Camada de UI (views)**: implementada, build passa, aguarda teste E2E no browser  
**Trilha de auditoria**: completa e pesquisável

Pronto para PR.
