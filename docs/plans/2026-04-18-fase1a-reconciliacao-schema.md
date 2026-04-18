# Fase 1A — Reconciliação de Schema + Trigger service_request → project

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** reconciliar o schema atual do Supabase com as migrations históricas, adicionar a migração de integração que cria automaticamente `project` + `budget` quando uma `service_request` é aceita.

**Architecture:** migrations SQL aplicadas via Supabase Dashboard SQL Editor. Gatilho Postgres (`AFTER UPDATE` trigger) cria registros em tabelas filhas. TypeScript types regenerados via Supabase CLI. Nenhuma mudança de UI exceto um pequeno ajuste no Kanban para exibir `project_id` após aceitar.

**Tech Stack:** PostgreSQL 15 (Supabase), Supabase CLI 2.72.7, TypeScript, Next.js 15, `@supabase/supabase-js` 2.103.

**Spec de origem:** [`docs/specs/2026-04-18-fase1-fundacao-design.md`](../specs/2026-04-18-fase1-fundacao-design.md) §4.1 e §4.2

---

## Pré-requisitos

- Supabase CLI instalado (confirmado: v2.72.7)
- Acesso ao projeto Supabase `rrfmfybklhlaoaxmhdyr` (dashboard e DB password)
- `.env.local` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (confirmado)
- Git branch limpa (`main` atualizada)

## Convenções

- Branches de feature: `feature/fase1a-<nome-curto>`
- Commits seguem padrão existente: `feat(scope): descrição`, `fix(scope):`, `chore:`
- Nenhum `git push --force` ou alteração em `main` sem PR
- Migrations aplicadas em **staging do Supabase** primeiro (criar branch Supabase se disponível) ou testadas via `CREATE … IF NOT EXISTS` para segurança

---

## Task 1: Login no Supabase CLI e link com projeto

**Files:** nenhuma alteração em código — setup local apenas.

- [ ] **Step 1: Login no Supabase CLI**

```bash
cd "/Users/friends/Desktop/Pro-orça/quantify-engenharia"
supabase login
```

Abre browser para autenticar. Necessário para dump do schema.

- [ ] **Step 2: Linkar o projeto**

```bash
supabase link --project-ref rrfmfybklhlaoaxmhdyr
```

Vai pedir a DB password. Se não souber, pegar em https://supabase.com/dashboard/project/rrfmfybklhlaoaxmhdyr/settings/database

- [ ] **Step 3: Verificar conexão**

```bash
supabase projects list
```

Expected: lista projetos, linha de `rrfmfybklhlaoaxmhdyr` marcada como `●` (linked).

- [ ] **Step 4: Commit** (apenas config local, não há arquivos para commitar)

Pular — `supabase/config.toml` é gerado mas fica gitignored se não precisar versionar.

---

## Task 2: Dump do schema atual

**Files:**
- Create: `supabase/current-schema.sql` (temp, commitado para referência histórica)

- [ ] **Step 1: Dump do schema público**

```bash
cd "/Users/friends/Desktop/Pro-orça/quantify-engenharia"
supabase db dump --schema public > supabase/current-schema.sql
```

Expected: arquivo criado com todas as tabelas, índices, policies atuais.

- [ ] **Step 2: Confirmar conteúdo**

```bash
grep -E "^CREATE TABLE|^CREATE POLICY|^CREATE TYPE" supabase/current-schema.sql | wc -l
head -50 supabase/current-schema.sql
```

Expected: mais de zero CREATE TABLE. Anotar quais tabelas existem de fato.

- [ ] **Step 3: Commit**

```bash
git checkout -b feature/fase1a-schema-reconciliation
git add supabase/current-schema.sql
git commit -m "chore(db): snapshot do schema atual do Supabase em 2026-04-18"
```

---

## Task 3: Comparar atual vs esperado e gerar diff

**Files:**
- Create: `supabase/migrations/006_reconciliation.sql`

- [ ] **Step 1: Listar tabelas no current-schema.sql**

```bash
grep "^CREATE TABLE" supabase/current-schema.sql | sed -E 's/CREATE TABLE (IF NOT EXISTS )?"?public"?\.?"?([a-z_]+)".*/\2/' | sort > /tmp/current-tables.txt
cat /tmp/current-tables.txt
```

- [ ] **Step 2: Listar tabelas esperadas (após 001-005)**

Tabelas esperadas, lista exaustiva da §3 do spec:
```
api_keys
budget_items
budgets
companies
composition_inputs
compositions
disciplines
documents
partners
projects
quotation_items
quotations
quote_line_items
quotes
service_orders
users
validations
```

Mais as que o código atual usa (fora das migrations históricas):
```
request_stages
service_pricing
service_requests
services
```

Total esperado: 21 tabelas.

- [ ] **Step 3: Identificar faltantes**

```bash
cat > /tmp/expected-tables.txt <<'EOF'
api_keys
budget_items
budgets
companies
composition_inputs
compositions
disciplines
documents
partners
projects
quotation_items
quotations
quote_line_items
quotes
request_stages
service_orders
service_pricing
service_requests
services
users
validations
EOF
sort /tmp/expected-tables.txt -o /tmp/expected-tables.txt
comm -23 /tmp/expected-tables.txt /tmp/current-tables.txt
```

Expected: lista de tabelas faltantes. Anotar.

- [ ] **Step 4: Verificar enums faltantes**

```bash
grep "^CREATE TYPE" supabase/current-schema.sql | sed -E 's/CREATE TYPE "?public"?\.?"?([a-z_]+)".*/\1/' | sort > /tmp/current-enums.txt
cat /tmp/current-enums.txt
```

Enums esperados (§3.1):
```
user_role
project_status
project_type
budget_type
validation_status
price_base
confidence_level
item_origin
document_type
discipline_type
quotation_status
composition_input_type
construction_standard
service_type
service_status
```

Total: 15 enums.

Comparar:
```bash
cat > /tmp/expected-enums.txt <<'EOF'
user_role
project_status
project_type
budget_type
validation_status
price_base
confidence_level
item_origin
document_type
discipline_type
quotation_status
composition_input_type
construction_standard
service_type
service_status
EOF
sort /tmp/expected-enums.txt -o /tmp/expected-enums.txt
comm -23 /tmp/expected-enums.txt /tmp/current-enums.txt
```

Anotar enums faltantes.

- [ ] **Step 5: Escrever `006_reconciliation.sql`**

Este arquivo contém **apenas o delta**. Se nenhuma tabela/enum estiver faltando, o arquivo é vazio (adiciona só um comentário de "verificado, nada a reconciliar").

Template (ajustar baseado nos resultados dos passos 3 e 4):

```sql
-- =====================================================
-- QUANTIFY — Migração 006: Reconciliação de schema
-- Data: 2026-04-18
-- =====================================================
-- Objetivo: alinhar o banco Supabase com as migrations históricas 001-005
-- e o uso atual do código (services, service_pricing, service_requests, request_stages).
--
-- Este arquivo é idempotente: pode ser executado várias vezes sem erro.
-- =====================================================

-- Extensão (garantir)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS ausentes (adicionar somente os que o passo 4 do Task 3 listou)
-- Exemplo (remover o que já existir):
DO $$ BEGIN
  CREATE TYPE confidence_level AS ENUM ('HIGH', 'MEDIUM', 'LOW');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- TABELAS ausentes (adicionar somente as que o passo 3 listou)
-- Exemplo (remover o que já existir):

-- (se faltar budgets)
-- CREATE TABLE IF NOT EXISTS budgets (
--   ... copiar de 001_init.sql ...
-- );

-- RLS: habilitar em tabelas novas se criadas acima
-- Exemplo:
-- ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY budget_isolation ON budgets FOR ALL USING (
--   project_id IN (SELECT id FROM projects WHERE company_id = get_user_company_id())
-- );

-- Verificação final
SELECT
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public') AS total_tables,
  (SELECT COUNT(*) FROM pg_type WHERE typtype='e' AND typnamespace='public'::regnamespace) AS total_enums;
```

Escrever o conteúdo real baseado nos resultados.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/006_reconciliation.sql
git commit -m "feat(db): migration 006 reconcilia schema atual com histórico"
```

---

## Task 4: Aplicar 006 no Supabase

**Files:** nenhuma alteração local.

**⚠️ Ação destrutiva potencial** — envolve rodar SQL em banco remoto. Ler cada comando antes de executar.

- [ ] **Step 1: Abrir Supabase SQL Editor**

URL: https://supabase.com/dashboard/project/rrfmfybklhlaoaxmhdyr/sql/new

- [ ] **Step 2: Colar conteúdo de `006_reconciliation.sql`**

Copiar:
```bash
cat supabase/migrations/006_reconciliation.sql | pbcopy
```

Colar no editor.

- [ ] **Step 3: Rodar (Cmd+Enter)**

Expected: última linha do output mostra `total_tables` ≥ 21 e `total_enums` ≥ 15.

Se algum erro: **parar**, investigar, ajustar migration, repetir Task 3 Step 5.

- [ ] **Step 4: Re-dump e confirmar**

```bash
supabase db dump --schema public > supabase/current-schema.sql
grep "^CREATE TABLE" supabase/current-schema.sql | wc -l  # >= 21
grep "^CREATE TYPE" supabase/current-schema.sql | wc -l  # >= 15
```

- [ ] **Step 5: Commit schema atualizado**

```bash
git add supabase/current-schema.sql
git commit -m "chore(db): atualizar snapshot após 006_reconciliation aplicada"
```

---

## Task 5: Regenerar tipos TypeScript

**Files:**
- Create: `src/lib/database.types.ts`

- [ ] **Step 1: Gerar tipos**

```bash
cd "/Users/friends/Desktop/Pro-orça/quantify-engenharia"
supabase gen types typescript --project-id rrfmfybklhlaoaxmhdyr > src/lib/database.types.ts
```

Expected: arquivo criado com ~500-1500 linhas de tipos TypeScript.

- [ ] **Step 2: Verificar estrutura**

```bash
head -30 src/lib/database.types.ts
grep "projects: " src/lib/database.types.ts | head -3
grep "budgets: " src/lib/database.types.ts | head -3
```

Expected: tipos para `projects`, `budgets`, `validations`, etc. presentes.

- [ ] **Step 3: Atualizar client para tipar queries**

Modificar: `src/lib/supabase.ts`

```ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rrfmfybklhlaoaxmhdyr.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyZm1meWJrbGhsYW9heG1oZHlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODM5MTMsImV4cCI6MjA4NDA1OTkxM30.G3-8iYrktvtWLqt9mZRk-lomIEVA1uu5b4l0hyXlzw8'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 4: Verificar que o build ainda passa**

```bash
npm run build
```

Expected: sucesso. Se houver erros de tipo em código existente, eles aparecem agora — anotar mas não corrigir nesta task (vão para tasks dos sub-planos B-F).

- [ ] **Step 5: Commit**

```bash
git add src/lib/database.types.ts src/lib/supabase.ts
git commit -m "feat(types): gerar tipos TypeScript do Supabase + tipar client"
```

---

## Task 6: Escrever migration 007 — coluna project_id + trigger

**Files:**
- Create: `supabase/migrations/007_service_request_to_project.sql`

- [ ] **Step 1: Escrever SQL completo**

```sql
-- =====================================================
-- QUANTIFY — Migração 007: service_request → project + budget
-- Data: 2026-04-18
-- =====================================================
-- Adiciona vínculo entre service_requests (catálogo comercial) e
-- projects + budgets (modelo rico). Ao aceitar uma solicitação,
-- cria automaticamente o projeto e orçamento vazio correspondentes.
-- =====================================================

-- Coluna de vínculo
ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_service_requests_project
  ON service_requests(project_id);

-- Função: mapear service_type → project_type
CREATE OR REPLACE FUNCTION map_service_to_project_type(svc_slug TEXT)
RETURNS project_type AS $$
BEGIN
  RETURN CASE
    WHEN svc_slug ILIKE '%residencial%' THEN 'RESIDENTIAL'::project_type
    WHEN svc_slug ILIKE '%comercial%' THEN 'COMMERCIAL'::project_type
    WHEN svc_slug ILIKE '%industrial%' THEN 'INDUSTRIAL'::project_type
    WHEN svc_slug ILIKE '%infra%' OR svc_slug ILIKE '%rodov%' THEN 'INFRASTRUCTURE'::project_type
    WHEN svc_slug ILIKE '%hospital%' THEN 'HOSPITAL'::project_type
    WHEN svc_slug ILIKE '%reforma%' THEN 'RENOVATION'::project_type
    ELSE 'OTHER'::project_type
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função: mapear service_type → budget_type
CREATE OR REPLACE FUNCTION map_service_to_budget_type(svc_slug TEXT)
RETURNS budget_type AS $$
BEGIN
  RETURN CASE
    WHEN svc_slug ILIKE '%parametrico%' OR svc_slug ILIKE '%anteprojeto%' THEN 'PARAMETRIC'::budget_type
    WHEN svc_slug ILIKE '%aditivo%' THEN 'ADDITIVE'::budget_type
    ELSE 'ANALYTICAL'::budget_type
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger: ao mover service_request para ACCEPTED, criar project + budget
CREATE OR REPLACE FUNCTION create_project_on_accept()
RETURNS TRIGGER AS $$
DECLARE
  new_project_id UUID;
  svc_slug TEXT;
  mapped_project_type project_type;
  mapped_budget_type budget_type;
BEGIN
  -- Só age quando passa a ACCEPTED pela primeira vez
  IF NEW.stage = 'ACCEPTED' AND (OLD.stage IS NULL OR OLD.stage != 'ACCEPTED') AND NEW.project_id IS NULL THEN

    -- Buscar slug do serviço para inferir tipos
    SELECT slug INTO svc_slug FROM services WHERE id = NEW.service_id;
    mapped_project_type := map_service_to_project_type(COALESCE(svc_slug, ''));
    mapped_budget_type := map_service_to_budget_type(COALESCE(svc_slug, ''));

    -- Criar projeto
    INSERT INTO projects (name, type, status, company_id, client_name)
    VALUES (
      NEW.title,
      mapped_project_type,
      'STUDY'::project_status,
      NEW.company_id,
      COALESCE((SELECT name FROM companies WHERE id = NEW.company_id), 'Cliente')
    )
    RETURNING id INTO new_project_id;

    -- Criar budget v1 vazio
    INSERT INTO budgets (name, version, type, status, price_base, project_id)
    VALUES (
      NEW.title || ' — Orçamento v1',
      1,
      mapped_budget_type,
      'AI_DRAFT'::validation_status,
      'SINAPI'::price_base,
      new_project_id
    );

    -- Atualizar service_request com o project_id
    UPDATE service_requests SET project_id = new_project_id WHERE id = NEW.id;

    -- Log opcional
    RAISE NOTICE 'Criado project % e budget v1 a partir de service_request %', new_project_id, NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger anterior se existir (idempotência)
DROP TRIGGER IF EXISTS trg_create_project_on_accept ON service_requests;

CREATE TRIGGER trg_create_project_on_accept
AFTER UPDATE ON service_requests
FOR EACH ROW EXECUTE FUNCTION create_project_on_accept();

-- Verificação
SELECT
  (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name='trg_create_project_on_accept') AS trigger_criado,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name='service_requests' AND column_name='project_id') AS coluna_criada;
```

- [ ] **Step 2: Commit antes de aplicar**

```bash
git add supabase/migrations/007_service_request_to_project.sql
git commit -m "feat(db): migration 007 vincula service_request → project + trigger automático"
```

---

## Task 7: Aplicar 007 no Supabase e testar manualmente

**⚠️ Escrita no banco remoto** — ler cada passo.

- [ ] **Step 1: Abrir SQL Editor no Dashboard**

https://supabase.com/dashboard/project/rrfmfybklhlaoaxmhdyr/sql/new

- [ ] **Step 2: Colar e rodar 007**

```bash
cat supabase/migrations/007_service_request_to_project.sql | pbcopy
```

Colar no editor. Cmd+Enter.

Expected na tabela de resultado:
- `trigger_criado = 1`
- `coluna_criada = 1`

- [ ] **Step 3: Teste manual do trigger via SQL Editor**

Rodar **em um novo query tab**:

```sql
-- 1. Pegar um service_request existente (ou criar um de teste)
SELECT id, stage, title, service_id, company_id, project_id
FROM service_requests
ORDER BY created_at DESC
LIMIT 5;
```

Escolher um ID que NÃO esteja em `ACCEPTED` ainda e que `project_id IS NULL`.

Se não houver, criar um de teste:

```sql
-- Criar request de teste (use um service_id e company_id existentes)
INSERT INTO service_requests (title, service_id, company_id, stage, typology, area_m2)
SELECT 'TEST fase1a trigger',
       (SELECT id FROM services LIMIT 1),
       (SELECT id FROM companies LIMIT 1),
       'RECEIVED'::request_stage,  -- ajustar se o enum for outro
       'residencial',
       500
RETURNING id;
```

Anotar o `id` retornado.

- [ ] **Step 4: Forçar transição para ACCEPTED**

```sql
UPDATE service_requests
SET stage = 'ACCEPTED'
WHERE id = '<UUID_DO_PASSO_3>';

-- Confirmar
SELECT sr.id AS request_id,
       sr.stage,
       sr.project_id,
       p.id AS project_direto,
       p.name AS project_name,
       p.type AS project_type,
       b.id AS budget_id,
       b.status AS budget_status
FROM service_requests sr
LEFT JOIN projects p ON p.id = sr.project_id
LEFT JOIN budgets b ON b.project_id = p.id
WHERE sr.id = '<UUID_DO_PASSO_3>';
```

Expected:
- `project_id` preenchido (não-nulo)
- `project_name` = "TEST fase1a trigger"
- `budget_id` preenchido
- `budget_status` = 'AI_DRAFT'

- [ ] **Step 5: Testar idempotência**

```sql
-- Mover de volta pra outro stage e voltar pra ACCEPTED — NÃO deve criar novo project
UPDATE service_requests SET stage = 'UNDER_REVIEW' WHERE id = '<UUID>';
UPDATE service_requests SET stage = 'ACCEPTED' WHERE id = '<UUID>';

-- Confirmar: ainda 1 project, 1 budget
SELECT COUNT(*) FROM projects WHERE id IN (SELECT project_id FROM service_requests WHERE id = '<UUID>');
-- Expected: 1
```

- [ ] **Step 6: Limpar teste**

```sql
-- Pegar ids criados
WITH test_req AS (
  SELECT id, project_id FROM service_requests WHERE id = '<UUID>'
)
DELETE FROM budgets WHERE project_id IN (SELECT project_id FROM test_req);
DELETE FROM projects WHERE id IN (SELECT project_id FROM test_req);
DELETE FROM service_requests WHERE id = '<UUID>';
```

- [ ] **Step 7: Re-dump e commit**

```bash
supabase db dump --schema public > supabase/current-schema.sql
git add supabase/current-schema.sql
git commit -m "chore(db): atualizar snapshot após 007 aplicada e testada"
```

---

## Task 8: Regenerar tipos após 007

**Files:**
- Modify: `src/lib/database.types.ts`

- [ ] **Step 1: Regenerar tipos**

```bash
supabase gen types typescript --project-id rrfmfybklhlaoaxmhdyr > src/lib/database.types.ts
```

- [ ] **Step 2: Confirmar coluna project_id em service_requests**

```bash
grep -A 40 "service_requests:" src/lib/database.types.ts | grep "project_id" | head -3
```

Expected: linha com `project_id: string | null` (ou similar).

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: sucesso.

- [ ] **Step 4: Commit**

```bash
git add src/lib/database.types.ts
git commit -m "chore(types): regenerar tipos após migration 007"
```

---

## Task 9: Atualizar AdminKanban para refletir project_id

**Files:**
- Modify: `src/views/admin/AdminKanban.tsx`

Contexto atual do arquivo: `AdminKanban.tsx` avança o stage via `UPDATE`. Queremos que, após avançar para `ACCEPTED`, a UI confirme que o `project_id` foi preenchido pelo trigger.

- [ ] **Step 1: Modificar a função `advance` para re-ler o registro**

Alterar em `src/views/admin/AdminKanban.tsx` a função `advance` (atualmente linhas ~45-51):

Buscar (código atual):

```tsx
  async function advance(id: string, current: string) {
    const nxt = stageNext[current]
    if (!nxt) return
    await supabase.from('service_requests').update({ stage: nxt }).eq('id', id)
    await supabase.from('request_stages').insert({ request_id: id, stage: nxt, note: 'Avançado via Kanban' })
    load()
  }
```

Substituir por:

```tsx
  async function advance(id: string, current: string) {
    const nxt = stageNext[current]
    if (!nxt) return
    const { error: updErr } = await supabase.from('service_requests').update({ stage: nxt }).eq('id', id)
    if (updErr) {
      console.error('Erro ao avançar estágio:', updErr)
      alert('Erro ao avançar: ' + updErr.message)
      return
    }
    await supabase.from('request_stages').insert({ request_id: id, stage: nxt, note: 'Avançado via Kanban' })

    // Se entrou em ACCEPTED, verificar que o trigger criou o project
    if (nxt === 'ACCEPTED') {
      const { data: updated } = await supabase
        .from('service_requests')
        .select('project_id')
        .eq('id', id)
        .single()
      if (!updated?.project_id) {
        console.warn(`service_request ${id} aceita mas sem project_id — trigger pode ter falhado`)
        alert('Atenção: projeto não foi criado automaticamente. Verifique os logs.')
      }
    }
    load()
  }
```

- [ ] **Step 2: Adicionar indicador visual de project vinculado nos cards**

Modificar a interface `RequestRow` no topo do arquivo:

Buscar:
```tsx
interface RequestRow {
  id: string
  title: string
  stage: string
  created_at: string
  services: { name: string } | null
  companies: { name: string } | null
}
```

Substituir por:
```tsx
interface RequestRow {
  id: string
  title: string
  stage: string
  created_at: string
  project_id: string | null
  services: { name: string } | null
  companies: { name: string } | null
}
```

E atualizar a query `load()` (buscar a string `'id, title, stage, created_at, services(name), companies(name)'`):

Substituir por:
```tsx
      .select('id, title, stage, created_at, project_id, services(name), companies(name)')
```

- [ ] **Step 3: Renderizar badge no card quando tem project_id**

Localizar o JSX do card (atualmente em linhas ~74-85):

```tsx
                  <div className="kanban-card" key={r.id}>
                    <div className="kanban-card-title">{r.title}</div>
                    <div className="kanban-card-meta">{r.companies?.name || '—'}</div>
                    <div className="kanban-card-meta">{r.services?.name || '—'}</div>
                    <div className="kanban-card-actions">
                      <Link href={`/admin/solicitacoes/${r.id}`} className="btn btn-outline btn-xs">Abrir</Link>
                      {stageNext[c.stage] && (
                        <button onClick={() => advance(r.id, c.stage)} className="btn btn-primary btn-xs">Avançar →</button>
                      )}
                    </div>
                  </div>
```

Substituir por:
```tsx
                  <div className="kanban-card" key={r.id}>
                    <div className="kanban-card-title">
                      {r.title}
                      {r.project_id && <span title="Projeto vinculado" style={{ marginLeft: 6, color: '#16A085' }}>●</span>}
                    </div>
                    <div className="kanban-card-meta">{r.companies?.name || '—'}</div>
                    <div className="kanban-card-meta">{r.services?.name || '—'}</div>
                    <div className="kanban-card-actions">
                      <Link href={`/admin/solicitacoes/${r.id}`} className="btn btn-outline btn-xs">Abrir</Link>
                      {stageNext[c.stage] && (
                        <button onClick={() => advance(r.id, c.stage)} className="btn btn-primary btn-xs">Avançar →</button>
                      )}
                    </div>
                  </div>
```

- [ ] **Step 4: Verificar build + lint**

```bash
npm run build
npm run lint
```

Expected: sucesso em ambos.

- [ ] **Step 5: Commit**

```bash
git add src/views/admin/AdminKanban.tsx
git commit -m "feat(admin): kanban confirma criação de project ao aceitar solicitação"
```

---

## Task 10: Teste manual end-to-end no browser

**Files:** nenhuma alteração.

- [ ] **Step 1: Rodar localmente**

```bash
npm run dev
```

Abrir http://localhost:3000

- [ ] **Step 2: Criar solicitação de teste como cliente**

1. Logar como cliente de teste (ou criar conta)
2. Ir em `/solicitar`
3. Preencher uma solicitação qualquer
4. Submeter

- [ ] **Step 3: Entrar como admin**

1. Logar como usuário staff (ADMIN/ENGINEER)
2. Ir em `/admin/kanban` (ou rota equivalente)
3. Ver a solicitação em "Recebido"

- [ ] **Step 4: Avançar até ACCEPTED**

Clicar "Avançar →" sucessivamente: RECEIVED → QUOTING → COMPOSING → UNDER_REVIEW → VALIDATED → SENT → ACCEPTED

Ao chegar em ACCEPTED:

Expected:
- Alert de "trigger falhou" NÃO aparece
- Ponto verde (●) aparece ao lado do título
- No console do browser: sem erros
- No Supabase: `SELECT project_id FROM service_requests WHERE id='<id>'` retorna UUID

- [ ] **Step 5: Validar no banco**

No SQL Editor:

```sql
SELECT sr.title, sr.stage, p.name AS project, b.status AS budget_status
FROM service_requests sr
LEFT JOIN projects p ON p.id = sr.project_id
LEFT JOIN budgets b ON b.project_id = p.id
WHERE sr.stage = 'ACCEPTED'
ORDER BY sr.updated_at DESC
LIMIT 5;
```

Expected: últimas solicitações aceitas têm `project` e `budget_status='AI_DRAFT'`.

- [ ] **Step 6: Limpar (opcional)**

Se o teste for descartável, deletar as linhas de teste.

- [ ] **Step 7: Commit dos resultados do teste**

Criar arquivo de registro:

```bash
cat > docs/plans/fase1a-teste-manual.md <<'EOF'
# Fase 1A — Resultado do teste manual E2E

Data: 2026-04-18
Testador: <nome>

## Cenários executados

- [x] Cliente cria solicitação
- [x] Admin avança até ACCEPTED
- [x] Alert de erro não aparece
- [x] Badge verde aparece no card
- [x] project_id preenchido no banco
- [x] budget criado com status AI_DRAFT

## Observações

<qualquer coisa relevante que tenha acontecido>
EOF

git add docs/plans/fase1a-teste-manual.md
git commit -m "docs(test): registrar teste manual E2E da fase 1A"
```

---

## Task 11: Abrir PR e merge para main

- [ ] **Step 1: Push da branch**

```bash
git push -u origin feature/fase1a-schema-reconciliation
```

- [ ] **Step 2: Abrir PR**

```bash
gh pr create --title "feat(db): Fase 1A — reconciliação de schema + trigger service_request → project" --body "$(cat <<'EOF'
## Summary
- Migration 006 reconcilia schema atual com histórico (idempotente)
- Migration 007 adiciona trigger que cria `project` + `budget` ao aceitar `service_request`
- Tipos TypeScript regenerados
- Admin Kanban confirma criação do project após accept

## Spec
Implementa [§4.1 e §4.2 da Fase 1](docs/specs/2026-04-18-fase1-fundacao-design.md).

## Test plan
- [x] SQL de 006 rodado em SQL Editor, sem erros
- [x] SQL de 007 rodado em SQL Editor, trigger criado e coluna project_id adicionada
- [x] Teste manual: service_request → ACCEPTED cria project + budget automaticamente
- [x] Teste de idempotência: trigger não duplica project se já existe
- [x] Build Next.js passa com tipos regenerados
- [x] Kanban mostra badge verde em cards com project vinculado

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Revisar PR no GitHub**

Abrir URL retornada, confirmar diff.

- [ ] **Step 4: Merge após aprovação**

Merge quando aprovado. Deletar branch remota.

---

## Definition of Done (Fase 1A)

Todos estes verdadeiros:

- [ ] `supabase/migrations/006_reconciliation.sql` aplicada e verificada
- [ ] `supabase/migrations/007_service_request_to_project.sql` aplicada e verificada
- [ ] Trigger `trg_create_project_on_accept` existe e funciona
- [ ] Coluna `service_requests.project_id` existe e preenche automaticamente
- [ ] `src/lib/database.types.ts` gerado e importado no `supabase.ts`
- [ ] `AdminKanban.tsx` atualizado e mostra badge de project vinculado
- [ ] Teste manual E2E passou (arquivo `fase1a-teste-manual.md` commitado)
- [ ] PR mergeada em `main`
- [ ] `docs/plans/2026-04-18-fase1-index.md` atualizado com status `✅ Completo` para 1A

---

## Próximos passos

Ao completar 1A, escrever o sub-plano **1B (HITL workflow + UI de review)** em `docs/plans/2026-04-18-fase1b-hitl-workflow.md`.

Dependências de 1B em 1A:
- Tabela `validations` disponível ✅ (vem de 001)
- `budget.status` workflow AI_DRAFT → IN_REVIEW → VALIDATED ✅
- Ao menos 1 `budget` exemplo no banco (criado pelo trigger de 1A)
