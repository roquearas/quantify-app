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
| 2A — Tabela SINAPI + import XLSX | ✅ |
| 2B — Picker + link HITL | ✅ |
| 2C — Curva ABC visual | ✅ |
| 2D — Calculadora BDI (TCU 2622/2013) | ✅ |
| 2E — Memorial descritivo no PDF | ✅ |
| 2F — Fuzzy-match AI + E2E + docs | ✅ |

Ver [docs/plans/](docs/plans/) e [docs/specs/](docs/specs/) para detalhes.

## Como funciona o engine de orçamento

O fluxo end-to-end de um orçamento na Quantify:

1. **Input** — cliente descreve a obra (tipo, área, localização, nível de acabamento)
2. **AI draft** — agente gera `budget_items` em `AI_DRAFT`, populando quando possível:
   - `suggested_sinapi_codigo` + `suggested_sinapi_score` via fuzzy-match pg_trgm
   - `confidence` (HIGH/MEDIUM/LOW) por item
3. **HITL review** (`/admin/orcamentos/:id/revisar`):
   - **Curva ABC** (Pareto 80/15/5) destaca itens de maior impacto
   - Reviewer vê **sugestões IA** ao abrir o `SinapiPicker`
   - Pode aceitar, escolher outra composição, editar quantidade/custo, aprovar/rejeitar
   - BDI override por item (TCU 2622/2013: `[(1+DI+R)(1+L)]/(1-I) - 1`)
4. **Memorial descritivo** em markdown — materiais, técnicas, normas
5. **Finalização** → status `VALIDATED` com trilha completa em `validations`
6. **PDF assinado** via `/api/budgets/:id/pdf` — com hash SHA-256 do conteúdo

**Integridade**: cada PDF inclui `X-Budget-Hash` no header + anexa o memorial,
a curva ABC, o BDI detalhado (se TCU) e a trilha de aprovações. O hash permite
ao cliente validar que o documento não foi adulterado.

**AI + auditabilidade**: a IA nunca decide sozinha. Toda vinculação SINAPI,
todo override de BDI e toda mudança de quantidade passa pela validação do
engenheiro responsável (CREA registrado no PDF).

Mais detalhes em [docs/sinapi-import-guide.md](docs/sinapi-import-guide.md).

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

- [Spec Fase 1](docs/specs/2026-04-18-fase1-fundacao-design.md) — design Fase 1
- [Spec Fase 2](docs/specs/2026-04-18-fase2-engine-orcamento-design.md) — design Fase 2 (engine de orçamento)
- [Guia SINAPI](docs/sinapi-import-guide.md) — import + fuzzy-match + picker HITL
- [Planos](docs/plans/) — decomposição em sub-planos executáveis
- [Blueprints](docs/reference/) — visão de produto v1/v2
- [Setup guide](docs/setup-guide.md) — Supabase + Vercel
- [Schema atual](supabase/current-schema-inspection.md) — snapshot do banco
