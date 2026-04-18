# Supabase Migrations — Quantify

Migrations do banco de dados Postgres no Supabase (projeto `rrfmfybklhlaoaxmhdyr`).

## Status das migrations

| Arquivo | Criada | Aplicada no banco | Descrição |
|---|---|---|---|
| `001_init.sql` | 2026-04-12 | ✅ histórica (provavelmente) | Schema rico: 15 tabelas + 13 enums + RLS + triggers + seeds demo |
| `002_storage.sql` | 2026-04-12 | ✅ histórica (provavelmente) | Bucket `project-documents` (50MB, PDF/DWG/IFC/etc) |
| `003_partner_portal.sql` | 2026-04-12 | ✅ histórica (provavelmente) | Adiciona `access_token` em `partners` |
| `004_api_keys.sql` | 2026-04-12 | ✅ histórica (provavelmente) | Tabela `api_keys` |
| `005_service_orders.sql` | 2026-04-12 | ✅ histórica (provavelmente) | Modelo pay-per-service |

## ⚠️ Importante: estado do banco é incerto

Estas migrations vieram do projeto `pro-orca/` (arquivado). O banco **pode** ter:
1. Todas essas migrations aplicadas (se foram rodadas no Supabase Dashboard)
2. Além disso, tabelas do código atual do Quantify que NÃO estão neste histórico:
   - `services`
   - `service_pricing`
   - `service_requests`
   - `request_stages`

## Antes de adicionar novas migrations

1. Dump do schema atual:
   ```bash
   # Via Supabase CLI (exige login)
   supabase db dump --schema public > supabase/current-schema.sql
   ```
2. Comparar com o esperado após 001-005
3. Adicionar somente o delta como `006_*.sql`, `007_*.sql`, etc

## Convenções

- Nomear `NNN_descricao_curta.sql` (3 dígitos, snake_case)
- Sempre `IF NOT EXISTS` para tabelas e colunas (idempotente)
- RLS habilitado em toda tabela de dados de tenant
- Policies referenciam `get_user_company_id()` (definida em 001)

## Próxima migration (prevista)

`006_integration_shim.sql` — reconciliação entre `service_requests` (código atual) e `projects` + `budgets` (schema rico). Ver `docs/specs/2026-04-18-fase1-fundacao-design.md`.
