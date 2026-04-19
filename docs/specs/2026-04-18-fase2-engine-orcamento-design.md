# Fase 2 — Engine de Orçamento (SINAPI + composições + curva ABC)

- **Data**: 2026-04-18
- **Status**: Draft, aguardando aprovação
- **Precedência**: Depende de Fase 1 mergeada (PRs #1-#6) — ou ao menos de fase1f como base
- **Objetivo macro**: os orçamentos gerados deixam de ser "estimativas soltas" e passam a ser **ancorados em referência oficial (SINAPI)**, com **composições reutilizáveis**, **curva ABC** visível ao engenheiro revisor e **BDI configurável por projeto**. É o salto de "MVP de fluxo" pra "engine que um engenheiro civil aceita assinar".

---

## 1. Por que esta fase agora

Fase 1 fechou o ciclo (solicita → valida → PDF → paga → baixa). Mas o conteúdo do orçamento ainda é fraco:

- **Preços sem lastro**: a IA gera números soltos — sem referência SINAPI, engenheiro não assina
- **Sem composições**: cada item é digitado do zero — tempo de review muito alto (~20 min/orçamento)
- **Sem curva ABC**: engenheiro não sabe onde tá o dinheiro, não foca a revisão onde importa
- **BDI invisível**: tabela tem o campo, mas UI não calcula nem mostra

Sem isso, o pilot na empresa da Isabela escala mal — cada orçamento é trabalho manual pesado. Com isso, 80% do orçamento sai "de composição" e o engenheiro só ajusta o delta.

---

## 2. Contexto atual (baseline pós-Fase 1)

### 2.1 O que funciona (entregue pela Fase 1)
- Fluxo `service_request → project → budget → budget_item` completo
- HITL item-por-item (`validations` table populada)
- PDF analítico assinado com hash SHA-256 canônico
- Trilha de auditoria (`request_stages`, `validations`)
- 3 tipos de serviço (obra, elétrica, laudo) com templates AI básicos
- Dashboards com números reais (budgets VALIDATED, receita, pagamentos pendentes)
- Documentos organizados por project

### 2.2 O que está faltando
- **Referência de preço**: `budget_item.unit_cost` é número livre, sem origem rastreável
- **Composições**: não existe tabela de "receitas" — item = texto + número
- **Curva ABC**: não há agregação por percentual do total
- **BDI**: `budgets.bdi_percent` existe mas não é aplicado em UI de review
- **Memorial descritivo**: PDF não tem seção de especificação técnica
- **Aditivos**: budget é imutável pós-VALIDATED — não dá pra revisar contrato

### 2.3 O que **não** entra nesta fase (YAGNI)
- SICRO (rodovia/infra) — nicho diferente, adiar
- TCPO/Pini (referências pagas) — licença cara, só se cliente pedir
- Composições customizadas pela empresa — v3
- Aditivos e versionamento de budget — Fase 3
- IA pra sugerir composição a partir de texto livre — já faz draft, melhorias ficam pra Fase 3

---

## 3. Decisões de arquitetura

### 3.1 SINAPI como fonte de verdade de preços

- Tabela `sinapi_insumo` (insumos brutos: cimento, areia, h-hora de pedreiro)
- Tabela `sinapi_composicao` (receitas: "m² de alvenaria 1 vez tijolo furado" = X insumos + mão de obra)
- Importação mensal a partir de planilha oficial (Caixa publica todo mês, CSV/XLSX)
- **Estado + mês** como chave (SP-2026-03 ≠ RJ-2026-03)
- **Desoneração** como flag (com/sem desoneração)

**Pra pilot da Isabela (SP), importar SP-desonerado-mês-vigente é suficiente.** Multi-estado e histórico vem sob demanda.

### 3.2 Composição como 1ª classe

```
budget_item (existe hoje, estende)
  ├─ composicao_id (nova FK opcional)
  ├─ composicao_snapshot_jsonb (novo — captura versão usada no momento)
  └─ origem: 'MANUAL' | 'SINAPI_INSUMO' | 'SINAPI_COMPOSICAO' | 'AI_DRAFT'
```

**Snapshot**: quando admin escolhe composição SINAPI SP-2026-03 #87471, gravamos o JSON completo naquele momento. Se Caixa republicar SINAPI SP-2026-04 com preço diferente, orçamentos antigos não mudam retroativamente. Isso é requisito legal de engenharia (orçamento precisa ser reproduzível).

### 3.3 Curva ABC como view computada

Não é tabela nova. É uma query agrupando `budget_item` por `subtotal desc`, calculando percentual acumulado:
- **A** = primeiros itens até 50% do total
- **B** = 50%→80%
- **C** = 80%→100%

Exibida como componente no AdminBudgetReview (Fase 1B) como ajuda visual ao revisor: "foca em revisar os 7 itens da curva A que são 52% do custo".

### 3.4 BDI aplicado em cascata

- `budgets.bdi_percent` (existe) — aplicado em todos os itens
- `budget_item.bdi_override_percent` (novo, opcional) — override por item (ex: fundação 22%, acabamento 28%)
- `total_cost` = Σ (subtotal_item × (1 + bdi_efetivo))
- UI mostra linha "BDI aplicado: X%" e total antes/depois

### 3.5 Memorial descritivo

Novo campo `budgets.memorial_md` (text/markdown). Admin preenche (ou AI preenche draft) descrevendo materiais, técnicas, normas. Renderizado no PDF como seção após tabela de itens.

Pilot-friendly: Isabela pode copiar de um memorial padrão que já usa em Word.

---

## 4. Escopo (seções implementáveis)

### 4.1 Schema: tabelas SINAPI + extensão budget_item

**Migrations novas**:
- `009_sinapi_schema.sql` — `sinapi_insumo`, `sinapi_composicao`, `sinapi_import_log`
- `010_budget_item_composicao.sql` — adiciona FK + snapshot + origem em `budget_item`

**Campos críticos de `sinapi_composicao`**:
- `codigo` (text, ex: "87471")
- `descricao` (text)
- `unidade` (text, ex: "m²")
- `preco_unitario` (numeric)
- `estado` (text, ex: "SP")
- `mes_referencia` (date, ex: 2026-03-01)
- `desonerado` (boolean)
- `insumos_jsonb` (array de {codigo, quantidade, preco_unit})

RLS: leitura pública (todas empresas podem consultar SINAPI). Escrita apenas via admin Quantify (não é tenant-scoped).

### 4.2 Importador SINAPI (admin-only script/UI)

Script node em `scripts/import-sinapi.ts`:
- Input: caminho pra XLSX oficial Caixa
- Output: popula `sinapi_composicao` + `sinapi_insumo` + log em `sinapi_import_log`
- Idempotente: se mesmo {codigo, estado, mes_referencia, desonerado} já existe, UPSERT
- Rodar 1x por mês, manualmente

Tela `/admin/sinapi/import` (super-admin only): upload XLSX, executa script, mostra log.

### 4.3 UI: picker de composição no review

Em `AdminBudgetReview.tsx` (Fase 1B), ao editar/adicionar item, novo botão:

```
[ + Adicionar item ]  [ 📚 Buscar SINAPI ]
```

Modal com busca por `codigo` ou `descricao`, filtrada por estado+mês do projeto. Ao selecionar composição, cria `budget_item` com `composicao_snapshot_jsonb` preenchido. Preço inicial = SINAPI, editável.

### 4.4 UI: curva ABC no review

Componente `BudgetCurvaABC.tsx` no topo do AdminBudgetReview:

```
┌─ Curva ABC ─────────────────────┐
│ A (52% | 7 itens)  ████████░░░ │
│ B (28% | 12 itens) ████░░░░░░░ │
│ C (20% | 23 itens) ███░░░░░░░░ │
└─────────────────────────────────┘
[Filtrar por A] [Filtrar por B] [Filtrar por C]
```

Filtro reordena/filtra a tabela de items. Ajuda revisor a focar.

### 4.5 UI: BDI calculator

Em `/admin/projetos/:id/budget/:budgetId`, seção "BDI":

```
BDI do projeto: [24]%
├─ Lucro: 8%
├─ Impostos: 10.65% (ISS+PIS+COFINS SP)
├─ Despesas indiretas: 5%
└─ Risco: 0.35%

Override por item: [tabela com input por linha]

Total sem BDI:    R$ 100.000,00
Total com BDI:    R$ 124.000,00 (+R$ 24.000)
```

Edição do BDI global e overrides por item. Recalcula total_cost ao salvar.

### 4.6 Memorial descritivo

Novo tab "Memorial" no `AdminBudgetReview.tsx`. Editor markdown simples (textarea + preview). Salva em `budgets.memorial_md`. Renderizado no PDF (Fase 1C) como nova seção.

### 4.7 PDF: seções novas

Atualizar `BudgetPDF.tsx`:
- Antes da tabela de itens: **Memorial descritivo** (markdown renderizado)
- Após tabela: **Curva ABC** (mesma visualização da UI, resumida)
- Rodapé: adicionar "Referência SINAPI: SP-2026-03 desonerado" se houver composições usadas

### 4.8 Integração AI: sugerir composição

Em `src/lib/ai/draftBudget.ts` (se existe) ou novo:
- Após AI gerar item texto livre, fazer fuzzy-match contra `sinapi_composicao.descricao` (tabela em memória no backend)
- Se match > 0.75 similaridade, anexar `suggested_composicao_id`
- UI mostra badge "SINAPI sugerido #87471" que admin pode aceitar/ignorar

MVP: usar `pg_trgm` extension no Postgres, query simples. Sem embeddings/pgvector ainda.

### 4.9 Testes E2E

Novos cenários em `tests/e2e/`:
- `sinapi-import.spec.ts`: admin importa XLSX teste (10 itens fixture), confere que aparece em search
- `budget-with-sinapi.spec.ts`: criar budget, adicionar item via SINAPI picker, validar, gerar PDF, confirmar SINAPI ref no rodapé
- `curva-abc.spec.ts`: budget com 20 itens, curva ABC agrupa corretamente
- `bdi-override.spec.ts`: overrides por item refletem no total

### 4.10 Docs

- `docs/sinapi-import-guide.md` — como baixar XLSX da Caixa e importar mensalmente
- README section "Como funciona o engine de orçamento"
- Atualizar spec Fase 1 para "✅ Implementado" onde couber

---

## 5. Decomposição em sub-planos

| # | Sub-plano | Cobre | Estimativa |
|---|---|---|---|
| **2A** | Schema SINAPI + importador CLI + 1 fixture XLSX | §4.1, §4.2 | 3-4 dias |
| **2B** | Picker SINAPI no review + snapshot em budget_item | §4.3 | 2-3 dias |
| **2C** | Curva ABC (UI + PDF) | §4.4, §4.7 parcial | 2 dias |
| **2D** | BDI calculator + overrides | §4.5 | 2 dias |
| **2E** | Memorial descritivo (editor + PDF) | §4.6, §4.7 resto | 1-2 dias |
| **2F** | AI fuzzy-match SINAPI + E2E completo + docs | §4.8, §4.9, §4.10 | 3-4 dias |

**Ordem**: 2A destrava tudo. 2B/2C/2D/2E são paralelizáveis após 2A. 2F fecha.

**Total**: 2-3 semanas.

---

## 6. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Planilha SINAPI muda formato Caixa | Parser tolerante, validar esquema, fallback manual |
| Licença SINAPI (é dado público mas tem T&C) | Não redistribuir, importar por cliente (cada empresa baixa) |
| Performance: `sinapi_composicao` vai ter ~50k linhas | Index em `(estado, mes_referencia, codigo)`, `pg_trgm` em descricao |
| Snapshot infla JSONB | Snapshot só do que é usado — composição + seus insumos, não tabela inteira |
| Isabela quer usar composição própria (fora SINAPI) | `budget_item.origem = 'MANUAL'` sempre funciona. Composições custom ficam Fase 3 |

---

## 7. Critérios de "Fase 2 concluída"

- [ ] Schema SINAPI aplicado (migrations 009/010) em staging + prod
- [ ] Importador rodado com SINAPI SP-mês-vigente (≥5000 composições)
- [ ] 1 budget real criado do zero com ≥50% dos itens vindo de SINAPI
- [ ] Curva ABC visível no review + PDF
- [ ] BDI configurável e refletindo no total
- [ ] Memorial descritivo em ≥1 PDF de teste
- [ ] E2E passando no CI (4 cenários novos)
- [ ] Isabela revisa 1 orçamento real usando picker SINAPI e aprova (HITL completo)
- [ ] Docs atualizados

---

## 8. Interfaces externas

Nenhuma integração externa nova. SINAPI é arquivo local (baixado do site da Caixa manualmente). AI matching usa Postgres puro (`pg_trgm`).

---

## 9. Feature flags

- `FEATURE_SINAPI_IMPORT` — gate no menu admin (default off até 2A completo)
- `FEATURE_BDI_OVERRIDE` — permite override por item (default on pós-2D)

Sem flag pra Curva ABC e Memorial — são aditivos, não trocam comportamento existente.

---

## 10. Aberturas / Não decidido

- **Qual XLSX SINAPI usar como fixture**: preciso de 1 real pra parser não ser fantasia. Sugestão: pegar SP-2026-03-desonerado da Caixa, commitar sample de 50 linhas em `tests/fixtures/sinapi-sp-sample.xlsx`.
- **Super-admin role**: hoje só há `ADMIN` tenant-scoped. Pra rodar importer SINAPI globalmente, criar `SUPER_ADMIN` ou deixar qualquer ADMIN rodar? Sugestão: criar flag `users.is_super_admin boolean` no user do dono do Quantify.
- **Histórico SINAPI**: guardar todos os meses ou só o atual? Sugestão: guardar todos, espaço barato, auditoria exige. Query sempre usa mês ativo do projeto.
