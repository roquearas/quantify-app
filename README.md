# Quantify — Engenharia Inteligente

Plataforma B2B brasileira para orçamentos e projetos de engenharia. IA assistida por engenheiro humano: nenhuma entrega sai sem validação técnica.

## Stack

- **Framework**: Next.js 15 (App Router, Turbopack) + React 19
- **Linguagem**: TypeScript (strict)
- **Banco**: PostgreSQL via Supabase (tipos gerados + RLS)
- **Auth**: Supabase Auth (SSR)
- **Storage**: Supabase Storage (bucket `project-documents`)
- **PDF**: `@react-pdf/renderer`
- **Pagamento**: Mercado Pago (one-time, pay-per-service)
- **Deploy**: Vercel

## Arquitetura

- **Multi-tenant** por `company_id` com RLS no Postgres
- **Roles**: `ADMIN | MANAGER | ENGINEER | ESTIMATOR | VIEWER | CLIENT`
- **Fluxo HITL**: `AI_DRAFT → IN_REVIEW → VALIDATED / REJECTED`
- **Cobrança**: pay-per-service (não SaaS), one-time payment via Mercado Pago

## Scripts

```bash
npm run dev           # Dev com Turbopack
npm run build         # Build de produção
npm run start         # Servidor de produção
npm run lint          # Lint
npm run test:e2e      # Smoke tests Playwright
npm run test:e2e:ui   # Playwright UI mode
```

## Estado da Fase 1 (fundação)

| Sub-plano | Status |
|---|---|
| 1A — Reconciliação de schema + trigger | ✅ |
| 1B — HITL workflow + review UI | ✅ |
| 1C — Gerador de PDF | ✅ |
| 1D — Documentos por projeto | ✅ |
| 1E — Dashboards reais | ✅ |
| 1F — Smoke tests + polimento | ✅ |

## Estado da Fase 2 (engine de orçamento)

| Sub-plano | Status |
|---|---|
| 2A — Schema SINAPI + origem no item | ✅ |
| 2B — Picker SINAPI + search fuzzy | ✅ |
| 2C — Curva ABC visível no review | ✅ |
| 2D — BDI configurável (global + por item) | ✅ |
| 2E — Memorial descritivo (markdown) | ✅ |
| 2F — AI fuzzy-match em batch + E2E + docs | ✅ |

Ver [docs/plans/](docs/plans/) e [docs/specs/](docs/specs/) para detalhes.

## Engine de orçamento

A Quantify transforma uma solicitação de serviço num PDF assinado em 6 passos:

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

Detalhes:

- **SINAPI**: ~12.000 insumos + ~5.500 composições por UF/mês, buscáveis por `pg_trgm` no picker. Aceite grava snapshot em `budget_items.sinapi_snapshot_jsonb`. Ver [sinapi-import-guide.md](docs/sinapi-import-guide.md).
- **Curva ABC**: classificação Pareto (A = 80% / B = 15% / C = 5%) renderizada em bar chart no review e no PDF. Filtrável por classe.
- **BDI**: percentual global no orçamento + override opcional por item (`bdi_override_percent`). Total do budget mostra BDI médio ponderado + asterisco quando há overrides.
- **Memorial descritivo**: markdown livre (`budgets.memorial_md`) renderizado antes da tabela de itens no PDF final.
- **Engineer-first**: nada sai sem `VALIDATED`, toda mudança vira linha em `validations`.

## Serviços ofertados (catálogo)

7 serviços de engenharia prontos pra comercialização:
1. Levantamento Quantitativo (por m²)
2. Orçamento Paramétrico (por projeto)
3. Composição de CPU (por CPU)
4. Cotação Eletrônica (por lote)
5. Análise de BDI (por orçamento)
6. Assessoria em Licitações (por edital)
7. Elaboração de Propostas (por proposta)

Cada serviço tem multiplicadores configuráveis (porte, urgência, tipologia) para estimativa ao vivo.

## Setup local

1. Clone o repo + `npm install`
2. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `npm run dev` → http://localhost:3000
4. `npm run test:e2e:install` pra instalar browser do Playwright (primeira vez)
5. `npm run test:e2e` para rodar smoke tests

## Documentação

- [Spec Fase 1](docs/specs/2026-04-18-fase1-fundacao-design.md) — design completo
- [Planos](docs/plans/) — decomposição em sub-planos executáveis
- [Blueprints](docs/reference/) — visão de produto v1/v2
- [Setup guide](docs/setup-guide.md) — Supabase + Vercel
- [Schema atual](supabase/current-schema-inspection.md) — snapshot do banco
