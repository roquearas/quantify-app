@AGENTS.md

# Quantify — Plataforma de Projetos e Orçamentos para Construção Civil

Plataforma B2B brasileira. IA assistida, validação humana obrigatória (engenheiro assina a entrega).

## Stack
- Next.js 15 (App Router, Turbopack) + React 19
- TypeScript strict
- Supabase (PostgreSQL + Auth + Storage) — cliente `@supabase/supabase-js` direto (sem ORM)
- Deploy alvo: Vercel

## Arquitetura
- **Multi-tenant** por `company_id` com Row Level Security no Postgres (ver `supabase/migrations/001_init.sql`)
- **Auth** via Supabase Auth; tabela `users` vincula `auth_id` ao `company_id` e `role`
- **Route groups**: `src/app/(auth)`, `src/app/(dashboard)` (cliente), `src/app/(admin)` (staff)
- **Roles**: `ADMIN | MANAGER | ENGINEER | ESTIMATOR | VIEWER | CLIENT`
  - Staff = `ADMIN | MANAGER | ENGINEER | ESTIMATOR`
  - Cliente = `CLIENT`
- **Views** em `src/views/{admin,auth,client,public}/` — páginas do App Router ficam finas, fazem `import` das views
- **Componentes de layout** em `src/components/{AdminLayout,ClientLayout,RouteGuards}.tsx`

## Fluxo Human-in-the-Loop (HITL)
Toda entrega de IA passa por 4 estados:
```
AI_DRAFT → IN_REVIEW → VALIDATED → (SENT)
                    ↘ REJECTED (volta pra IA refazer)
```
- Confiança por item: `HIGH | MEDIUM | LOW` (🟢 🟡 🔴)
- Trilha em `validations` com: quem validou, CREA/CAU, comentário, hash do doc
- Engenheiro assina a entrega — IA nunca é responsável técnica

## Modelo de cobrança
**Pay-per-service** (cobrança por serviço entregue, NÃO SaaS, NÃO créditos).
- `service_orders`: REQUESTED → QUOTED → APPROVED → PAID → IN_PROGRESS → DELIVERED → COMPLETED
- Pagamento: Mercado Pago (one-time) — Stripe planejado como alternativa
- Pilot atual: empresa da Isabela, billing dormente

## Schema do banco
15+ tabelas em `supabase/migrations/`. Resumo:
- **Tenant**: `companies`, `users`, `partners`
- **Trabalho**: `projects`, `documents`, `disciplines`
- **Orçamento**: `budgets`, `budget_items`, `compositions`, `composition_inputs`
- **Cotação**: `quotations`, `quotation_items`, `quotes`, `quote_line_items`
- **HITL**: `validations`
- **Comercial**: `services`, `service_pricing`, `service_requests`, `request_stages`, `service_orders`
- **Admin**: `api_keys`

Referência completa em `docs/reference/schema.prisma` (schema em sintaxe Prisma, usado como documentação do modelo; **não usamos Prisma em runtime**).

## Padrões de código
- Rotas em português: `/projetos`, `/orcamentos`, `/cotacoes`, `/validacoes`, `/parceiros`, `/solicitar`
- Moeda: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` (ver `src/lib/pricingEngine.ts:55`)
- `snake_case` em colunas Postgres, `camelCase` em tipos TypeScript
- Client components marcados com `'use client'` no topo
- Sem Prisma — queries via `supabase.from('tabela').select(...)` + tipos gerados via `supabase gen types typescript`

## Marca
- Navy: `#0B1D3A` (fundo escuro, sidebar)
- Teal: `#16A085` (ações primárias)
- Orange: `#E67E22` (alertas, destaques)

## Comandos
```bash
npm run dev     # Next dev com Turbopack
npm run build   # Build de produção
npm run lint    # Lint
npm start       # Servidor de produção
```

## Referências
- `docs/reference/blueprint-v2.md` — visão completa do produto (7 cenários orçamento + 7 disciplinas projeto + áreas adjacentes)
- `docs/reference/godmode-orcamento.md` — guia detalhado de orçamento de obras
- `docs/setup-guide.md` — setup Supabase (URLs, auth, storage)
- `docs/specs/` — specs de design por fase

## Segurança conhecida (tech debt)
- `src/lib/supabase.ts:4` tem anon key hardcoded como fallback. Anon keys são públicas por design (RLS protege), mas idealmente remover o fallback e exigir env var.
