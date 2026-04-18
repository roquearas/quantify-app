# Fase 1A — Teste do trigger `trg_create_project_on_accept`

Data: 2026-04-18  
Ambiente: Supabase `rrfmfybklhlaoaxmhdyr` (produção compartilhada)  
Método: SQL via MCP `execute_sql` (dados de teste criados e removidos)

## Migration aplicada

Via MCP `apply_migration`, registrada como `onda_b8_service_request_to_project_trigger` no histórico do Supabase.

Resultado da verificação:

| trigger_count | functions_count |
|---|---|
| 1 | 3 |

(1 trigger + 3 funções: `create_project_on_accept`, `map_service_slug_to_project_type`, `map_service_slug_to_budget_type`)

## Cenário 1 — Criação automática de project + budget ao aceitar

**Setup**: `INSERT INTO service_requests` com:
- code: `TEST-TRIGGER-20260418210808`
- stage: `RECEIVED`
- service slug: `levantamento` (não casa com nenhum regex do mapper → fallback)
- company: demo
- requester: engenheiro demo

**Ação**: `UPDATE service_requests SET stage = 'ACCEPTED'`

**Resultado observado**:

| Campo | Valor | Esperado | OK? |
|---|---|---|---|
| `service_requests.stage` | ACCEPTED | ACCEPTED | ✅ |
| `service_requests.project_id` | cd85b28e-... (novo UUID) | preenchido | ✅ |
| `service_requests.budget_id` | 26b477e3-... (novo UUID) | preenchido | ✅ |
| `projects.name` | "TEST trigger Fase 1A" | título da request | ✅ |
| `projects.type` | OTHER | OTHER (fallback do mapper) | ✅ |
| `projects.status` | STUDY | STUDY | ✅ |
| `budgets.name` | "TEST trigger Fase 1A — Orçamento v1" | título + sufixo | ✅ |
| `budgets.type` | ANALYTICAL | ANALYTICAL (default) | ✅ |
| `budgets.status` | AI_DRAFT | AI_DRAFT | ✅ |
| `budgets.version` | 1 | 1 | ✅ |

## Cenário 2 — Idempotência

**Ação**:
1. `UPDATE stage = 'UNDER_REVIEW'`
2. `UPDATE stage = 'ACCEPTED'` (2ª vez)

**Resultado esperado**: NÃO criar novo project ou budget.

**Resultado observado**:

| Métrica | Valor | Esperado | OK? |
|---|---|---|---|
| Projects com nome "TEST trigger Fase 1A" | 1 | 1 | ✅ |
| Budgets vinculados | 1 | 1 | ✅ |

A condição `WHEN (NEW.stage = 'ACCEPTED')` + `AND NEW.project_id IS NULL` no corpo garantem execução única.

## Limpeza

`DELETE FROM budgets / projects / service_requests` dos IDs de teste.  
Verificação: 0 remanescentes de cada.

## Conclusão

Trigger `trg_create_project_on_accept` funciona corretamente para o happy path e é idempotente. Pronto para uso em produção.

## Pendente

- [ ] Teste E2E via UI (AdminKanban avançando até ACCEPTED) — cobrir após Fase 1A mergear
- [ ] Cenário de erro (falha na inserção de project — e.g., company_id inválido) — trigger usa `RETURN NEW` sem captura, erro propaga. Comportamento aceitável.
- [ ] Monitoramento em produção: `agent_logs` ou similar para rastrear disparos do trigger
