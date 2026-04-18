# Fase 1 — Fundação Sólida (baseline comercializável)

- **Data**: 2026-04-18
- **Status**: Draft, aguardando aprovação
- **Objetivo macro**: o fluxo atual (cliente → proposta → pagamento) passa a entregar um **orçamento real** (PDF analítico assinado por engenheiro) com **trilha de validação humana** completa. É o que torna o produto **vendável pra um cliente pagante**, sem depender de agentes de IA ainda.

---

## 1. Por que esta fase primeiro

O código atual entrega uma "proposta + pagamento", mas não entrega o produto final. Um cliente que paga R$ 5.000 por um orçamento precisa receber:
- Um PDF com planilha analítica por serviço (descrição, unidade, quantidade, custo unitário, total)
- BDI aplicado e memorial descritivo
- Assinatura do engenheiro responsável (CREA)
- Trilha de auditoria (quem validou, quando, o que mudou do draft)

Sem isso, não é um produto — é uma promessa. Esta fase fecha o ciclo.

Também consolida a fundação técnica (schema rico, multi-tenant RLS, storage, HITL) que todas as fases seguintes precisam.

---

## 2. Contexto atual (baseline, 2026-04-18)

### 2.1 O que funciona
- Signup/login cliente (cria `company` + `user` role=CLIENT)
- Landing com catálogo de serviços + pricing dinâmico
- Wizard de solicitação com estimativa ao vivo (porte/urgência/tipologia)
- Upload de pranchas no wizard (hoje vai pra `request_attachments` ou similar)
- Admin: kanban por estágio (RECEIVED → QUOTING → COMPOSING → UNDER_REVIEW → VALIDATED → SENT → ACCEPTED)
- Admin: propostas e cobranças
- Checkout Mercado Pago (one-time)

### 2.2 O que está quebrado ou incompleto
- **Entregável**: não existe geração de PDF do orçamento. Admin manda "proposta" (texto + preço) mas o cliente nunca recebe o orçamento em si
- **Validação humana**: UI `AdminValidacoes.tsx` existe (84 linhas), mas não está ligada a um fluxo real de review item-por-item
- **Dashboards**: `AdminDashboard.tsx` e `ClientDashboard.tsx` têm dados mockados em partes
- **Trilha de auditoria**: tabela `validations` do schema histórico não é usada pelo código atual
- **Organização por projeto**: `service_request` não vira `project` — tudo vive solto em `service_requests` / `service_orders`

### 2.3 Estado do banco (incerto, precisa descoberta)
Migrations históricas (em `supabase/migrations/001-005`) podem ter sido aplicadas. Código atual usa tabelas (`services`, `service_pricing`, `service_requests`, `request_stages`) que **não estão nessas migrations**.

**Primeira tarefa da Fase 1**: dump do schema atual e reconciliação.

---

## 3. Decisões de arquitetura

### 3.1 Unificar em torno de `project` + `budget`
Todo trabalho (orçamento, projeto, laudo) vive dentro de um `project`. Quando uma `service_request` é aceita, o sistema cria automaticamente:
- 1 `project` (com dados vindos da solicitação)
- 1 `budget` version=1 (tipo PARAMETRIC pra orçamentos, sem itens ainda)
- 1 `service_order` (já existe hoje, vira filho do project)

**Por quê**: permite que Fases 2-4 (engine orçamento, agentes IA, projetos multi-disciplina) construam em cima do mesmo modelo sem reescrever.

### 3.2 Não descartar o catálogo comercial
Tabelas `services`, `service_pricing`, `service_requests`, `request_stages` continuam — elas representam **o que a Quantify vende**, não o **trabalho em si**. São o "menu" do site.

### 3.3 supabase-js direto, sem ORM
Mantemos o padrão atual. Tipos gerados via `supabase gen types typescript > src/lib/database.types.ts`. Queries continuam inline.

**Por quê não Prisma**: adiciona complexidade (geração, barrel exports, adapter PG), dificulta Server Actions e não traz ganho proporcional para o tamanho do time.

### 3.4 RLS é obrigatório, não opcional
Toda tabela com dado de tenant tem RLS ativo com policy baseada em `get_user_company_id()`. Roles aplicam filtros adicionais em camada de aplicação quando necessário.

### 3.5 Assinatura digital = hash + metadata (não ICP-Brasil ainda)
Nesta fase, "assinatura" do engenheiro é:
- Hash SHA-256 do PDF gerado
- Registro em `validations` com user_id, CREA/CAU, timestamp, IP
- Carimbo visual no rodapé do PDF ("Validado por [Nome], CREA-XX nº XXXX — SHA256: ...")

ICP-Brasil / Vidaas fica pra Fase 5 (obras públicas exigem).

---

## 4. Escopo detalhado

### 4.1 Descoberta do schema atual (pré-requisito)
- **Ação**: rodar `supabase db dump --schema public > supabase/current-schema.sql` e comparar com `001-005`
- **Saída**: `supabase/migrations/006_reconciliation.sql` que aplica somente o delta necessário (se qualquer tabela estiver faltando)
- **Critério de aceite**: `SELECT table_name FROM information_schema.tables WHERE table_schema='public'` retorna todas as tabelas esperadas

### 4.2 Integração `service_request` ⇄ `project` + `budget`
- **Migration** `007_service_request_to_project.sql`:
  - Adicionar coluna `project_id UUID REFERENCES projects(id)` em `service_requests`
  - Trigger ou Supabase Edge Function que, ao `UPDATE stage='ACCEPTED'`, cria automaticamente `project` + `budget` + `service_order` e vincula via `project_id`
- **UI**: quando admin move card no Kanban de `UNDER_REVIEW` → `VALIDATED`, sistema garante que existe `project` associado
- **Critério de aceite**: toda `service_request` em estágio ≥ `VALIDATED` tem `project_id` preenchido e `budget` com mesmo `project_id`

### 4.3 Fluxo HITL completo
**Estados do `budget`**:
```
AI_DRAFT → IN_REVIEW → VALIDATED → (SENT ao cliente)
                    ↘ REJECTED (volta para AI_DRAFT)
```
- **View** `AdminValidacoes.tsx` (expandir existente): lista budgets em `IN_REVIEW`, item-por-item com confiança 🟢🟡🔴
- Ações por item: aprovar, editar, rejeitar — cada ação cria `validation` row
- Ao aprovar todos os itens: `UPDATE budget SET status='VALIDATED'`
- Ao rejeitar: marca `status='REJECTED'`, volta pra review com comentário
- **Trilha**: toda ação popula `validations` (user, timestamp, comment, confidence, reason)
- **Critério de aceite**: consigo rastrear quem aprovou cada item de um budget específico e ver o diff entre AI_DRAFT e VALIDATED

### 4.4 Gerador de PDF do orçamento
- **Lib**: `@react-pdf/renderer` (SSR-friendly, TypeScript nativo)
- **Template** `src/lib/pdf/BudgetPDF.tsx`:
  - Cabeçalho: logo Quantify + dados da empresa cliente
  - Identificação: projeto, tipo, área, local, cliente
  - Planilha analítica: tabela `budget_items` com código, descrição, unid, qtd, custo unit, total
  - Totalizadores: custo direto, BDI %, valor final
  - Curva ABC (top 20 itens que respondem por 80% do custo) — opcional nesta fase
  - Memorial descritivo simplificado
  - Rodapé: validação (nome, CREA, data, hash SHA-256 do PDF)
- **Endpoint** `POST /api/budgets/[id]/pdf` gera e retorna stream
- **Storage**: PDF gerado é salvo em `project-documents/budgets/{budget_id}.pdf` para re-download
- **Critério de aceite**: click em "Baixar PDF" da proposta validada retorna PDF com todos os campos e hash no rodapé

### 4.5 Organização de documentos por project
- **Migration**: garantir `documents` table tem `project_id` NOT NULL
- **Upload**: wizard do cliente continua aceitando pranchas, mas salva em `project-documents/{project_id}/` (após criação do project via 4.2)
- **UI**: aba "Documentos" no detalhe do project (admin e cliente)
- **Tipos**: FLOOR_PLAN, MEMORIAL, SPREADSHEET, BIM_MODEL, TECHNICAL, OTHER (já no enum)
- **Critério de aceite**: cliente faz upload → aparece na UI do admin vinculado ao project correto

### 4.6 Dashboards com dados reais
- **AdminDashboard**: KPIs agregados via queries:
  - Requests por stage (count + prazo médio)
  - Budgets pendentes de validação
  - Receita do mês (service_orders com paid_at no mês)
  - Top 5 companies por volume
- **ClientDashboard**: meus requests, meus budgets validados, próximos pagamentos
- **Critério de aceite**: sem `Math.random()` ou valores hardcoded nos dashboards

### 4.7 Testes E2E do fluxo crítico
- **Stack**: Playwright (já padrão Next.js)
- **Cenário 1**: cliente solicita orçamento → admin aceita → cria project/budget → admin adiciona itens → valida → gera PDF → cliente paga
- **Cenário 2**: cliente rejeita proposta, volta pra refazer
- **Cenário 3**: tentativa de acesso cross-tenant (company B tenta ler project da company A) — deve falhar por RLS
- **Critério de aceite**: 3 cenários passam em CI

### 4.8 Catálogo mínimo de serviços comercializáveis
Para fechar a fase, **3 tipos de serviço** devem estar prontos ponta-a-ponta:
1. `ORCAMENTO_OBRA` (residencial/comercial pequeno-médio)
2. `ORCAMENTO_ELETRICA`
3. `LAUDO_TECNICO` (avaliação simples)

Cada um com:
- Template de PDF específico
- Checklist de entrega (o que precisa estar no docs antes de validar)
- Preço base em `service_pricing` com multiplicadores ajustados por Isabela

---

## 5. Modelo de dados — deltas

### 5.1 Migrations a criar (pós-reconciliação)

`007_service_request_to_project.sql`
```sql
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_service_requests_project ON service_requests(project_id);

-- Trigger: ao aceitar, cria project + budget
CREATE OR REPLACE FUNCTION create_project_on_accept() RETURNS TRIGGER AS $$
DECLARE
  new_project_id UUID;
BEGIN
  IF NEW.stage = 'ACCEPTED' AND OLD.stage != 'ACCEPTED' AND NEW.project_id IS NULL THEN
    INSERT INTO projects (name, type, status, company_id, client_name)
    VALUES (NEW.title, 'OTHER'::project_type, 'STUDY', NEW.company_id, NEW.client_name)
    RETURNING id INTO new_project_id;

    INSERT INTO budgets (name, type, status, project_id)
    VALUES (NEW.title || ' - Orçamento v1', 'PARAMETRIC'::budget_type, 'AI_DRAFT', new_project_id);

    UPDATE service_requests SET project_id = new_project_id WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_project_on_accept
AFTER UPDATE ON service_requests
FOR EACH ROW EXECUTE FUNCTION create_project_on_accept();
```

`008_pdf_storage.sql`
```sql
-- Bucket já existe (project-documents), apenas garantir RLS por company
CREATE POLICY budget_pdf_access ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'project-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE company_id = get_user_company_id()
  )
);
```

### 5.2 Tipos TypeScript
Rodar após cada migration:
```bash
npx supabase gen types typescript --project-id rrfmfybklhlaoaxmhdyr > src/lib/database.types.ts
```

---

## 6. Componentes (UI)

### 6.1 Novos
- `src/lib/pdf/BudgetPDF.tsx` — template react-pdf
- `src/lib/pdf/templates/` — um arquivo por tipo de serviço (obra, elétrica, laudo)
- `src/app/api/budgets/[id]/pdf/route.ts` — endpoint gerador
- `src/app/api/budgets/[id]/validate/route.ts` — endpoint de validação (cria `validation` row)
- `src/views/admin/AdminBudgetReview.tsx` — UI item-por-item de review

### 6.2 Modificados
- `src/views/admin/AdminValidacoes.tsx` — ligar ao fluxo real (hoje é placeholder)
- `src/views/admin/AdminDashboard.tsx` — queries reais
- `src/views/client/ClientDashboard.tsx` — queries reais
- `src/views/admin/AdminKanban.tsx` — ao avançar pra ACCEPTED, garantir project_id
- `src/views/client/PropostaDetalhe.tsx` — botão "Baixar PDF" quando `budget.status='VALIDATED'`

---

## 7. Fluxo principal (sequence diagram textual)

```
CLIENTE                           SISTEMA                           ADMIN/ENG
───────                           ───────                           ─────────
Abre wizard /solicitar
Seleciona serviço + dados
Upload de plantas      ─────▶    service_request(RECEIVED)
                                 + request_attachments (temp)
                                                                   Vê no Kanban
                                                                   Avança pra QUOTING
                                                                   Avança pra COMPOSING
                                                                   (engenheiro monta items)
                                                                   Avança pra UNDER_REVIEW
                                                                   (2º engenheiro valida)
                                 budget status: AI_DRAFT → IN_REVIEW
                                 validations inseridas por item
                                 budget status: VALIDATED
                                                                   Avança pra SENT
                                 trigger: cria project + budget
                                 PDF gerado + armazenado
                                 service_order(QUOTED) + preço
Vê proposta            ◀─────    Notification: "Sua proposta está pronta"
Baixa PDF de preview   ◀─────    PDF com watermark "PREVIEW"
Clica "Aceitar e Pagar"
Redireciona MP         ─────▶    service_order(APPROVED)
                                 Mercado Pago checkout
                                 Webhook paid ─▶ service_order(PAID)
                                 PDF final (sem watermark) disponível
Baixa PDF final        ◀─────    PDF assinado (hash + CREA)
                                 service_order(DELIVERED)
```

---

## 8. Testes

### 8.1 Unit
- `pricingEngine.ts` — já tem, garantir 100% de cobertura
- Gerador PDF — snapshot tests do output HTML antes do render

### 8.2 Integration
- Trigger `create_project_on_accept` — testar com fixtures de DB
- Endpoint `/api/budgets/[id]/pdf` — mockar supabase, verificar stream PDF

### 8.3 E2E (Playwright)
- Fluxo feliz ponta-a-ponta (cenário 1 da §4.7)
- Rejeição e refazer (cenário 2)
- RLS cross-tenant (cenário 3)

### 8.4 Manual
- Isabela ou engenheiro convidado valida um orçamento real de ponta a ponta

---

## 9. Fora de escopo (reservado pras Fases 2-5)

Não entra nesta fase:
- Import SINAPI/SICRO (Fase 2)
- `compositions` populadas com bases públicas (Fase 2)
- Curva ABC no PDF além dos top 20 (Fase 2)
- Qualquer agente de IA (Fase 3)
- Leitor de plantas, estimador paramétrico, compositor (Fase 3)
- Módulo de disciplinas de projeto (Fase 4)
- Portal de cotação com fornecedores (Fase 4)
- ICP-Brasil / assinatura certificada (Fase 5)
- Áreas adjacentes: planejamento, medição, PCMAT (Fase 5)

---

## 10. Riscos e mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Schema atual divergir das migrations históricas e gerar conflito | Alto | Descoberta primeiro (§4.1), só então criar delta |
| Geração de PDF em produção ficar lenta (render grande) | Médio | Rodar em Edge Function; cachear em storage |
| RLS configurada errada e vazar dados entre tenants | Crítico | Testes E2E cenário 3 + revisão manual das policies |
| Trigger de criar project falhar silenciosamente | Médio | Log + fallback: endpoint manual para reprocessar |
| MCP/trigger do Supabase não rodar em prod | Médio | Alternativa: criar project via API route, não trigger |
| Engenheiro validador não entender a UI | Alto (UX) | Sessão com Isabela antes de lançar; refinar |

---

## 11. Critérios de aceite da Fase 1

Fase 1 está **pronta** quando:

- [ ] Schema do banco está reconciliado (migrations 001-008 aplicadas, tudo alinhado)
- [ ] Fluxo completo roda em staging: cliente solicita → admin valida → PDF gerado → cliente paga → PDF final disponível
- [ ] 3 tipos de serviço (orçamento obra, elétrica, laudo) têm templates PDF próprios
- [ ] Trilha de validação aparece em `validations` para todo budget VALIDATED
- [ ] Dashboards (admin + cliente) mostram dados reais
- [ ] 3 cenários E2E em Playwright passando no CI
- [ ] RLS verificada (teste cross-tenant falha como esperado)
- [ ] Isabela ou outro engenheiro validou 1 orçamento real ponta-a-ponta
- [ ] Documentação atualizada: README, setup-guide, este spec com "Status: Implementado"

---

## 12. Estimativa de esforço

Ordem sugerida de entrega (cada bloco = 1 PR ou pequeno grupo de PRs):

1. **Reconciliação schema** (1-2 dias) — §4.1
2. **Trigger service_request → project** (1-2 dias) — §4.2
3. **HITL completo + UI review** (3-4 dias) — §4.3
4. **Gerador PDF v1 (1 template)** (3-4 dias) — §4.4
5. **Organização documents por project** (1-2 dias) — §4.5
6. **Dashboards reais** (2 dias) — §4.6
7. **3 templates PDF + checklists** (3 dias) — §4.8
8. **Testes E2E** (2-3 dias) — §4.7
9. **Validação com Isabela** (1-2 dias) — §11
10. **Polimento + deploy prod** (1-2 dias)

**Total**: ~3-4 semanas de trabalho focado.

---

## 13. Próxima fase

**Fase 2 — Engine de orçamento** começa quando Fase 1 tem os 3 tipos de serviço rodando e pelo menos 1 orçamento real foi entregue. Fase 2 tem seu próprio spec a ser escrito (`docs/specs/2026-XX-XX-fase2-engine-orcamento-design.md`).

---

*Última edição: 2026-04-18 — aguardando aprovação do usuário*
