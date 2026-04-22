# Guia de Import SINAPI (Quantify Engine de Orçamento)

Este guia cobre o fluxo operacional de importar tabelas SINAPI oficiais (Caixa)
e usá-las no engine de orçamento (busca, link HITL e fuzzy-match IA).

---

## 1. Visão geral

O engine de orçamento da Quantify depende de **composições** e **insumos** SINAPI
para:

- Calcular custos unitários auditáveis (valor padrão federal)
- Lincar itens do orçamento a referências rastreáveis
- Sugerir matches automáticos via fuzzy-match (Fase 2F)

SINAPI é publicado mensalmente pela Caixa em planilhas XLSX. Cada combinação de
**estado × mês × regime (desonerado/com encargos)** é um dataset separado.

---

## 2. Obter o XLSX oficial

1. Acesse o portal SINAPI da Caixa: <https://www.caixa.gov.br/sinapi>
2. Baixe o arquivo do mês de interesse:
   - Composições analíticas ("Referência de Composições Analíticas")
   - Insumos ("Referência de Insumos")
3. Escolha o regime: **desonerado** (mais comum em obra pública) ou
   **com encargos** (obra privada com carteira).

---

## 3. Importar no admin

Somente usuários **super-admin** podem importar. O fluxo:

1. Vá em `/admin/sinapi/import`
2. Selecione o estado (ex.: `SP`), o mês (ex.: `2025-03`) e o regime
3. Arraste o XLSX ou selecione via file-picker
4. Clique em **Importar**
5. Acompanhe o progresso: o parser valida cabeçalhos, extrai linhas e persiste
   em `sinapi_composicao` / `sinapi_insumo`
6. Ao fim, o log fica em `sinapi_import_log` com status `OK` ou `ERROR`

Se algo falhar (cabeçalho fora do padrão, planilha corrompida), o status fica
`ERROR` e uma mensagem aparece na UI. Reimportar é idempotente — registros com
mesmo `(codigo, estado, mes_referencia, desonerado)` são sobrescritos.

---

## 4. Usar SINAPI nos orçamentos

### 4.1. Buscar manualmente (`/admin/orcamentos/:id/revisar`)

Ao revisar um orçamento, clique no botão **"Linkar SINAPI"** num item.
O `SinapiPicker` abre e você pode:

1. Filtrar por estado/mês/regime
2. Digitar descrição ou código
3. Escolher entre insumos, composições, ou ambos
4. Clicar em **Selecionar** — o item do orçamento recebe:
   - `sinapi_codigo`
   - `sinapi_mes_referencia`
   - `origem` = `SINAPI_COMPOSICAO` ou `SINAPI_INSUMO`
   - `sinapi_snapshot_jsonb` (snapshot do preço na data do link)
   - (opcional) `unit_cost` e `unit` atualizados

### 4.2. Sugestões IA (Fase 2F — fuzzy-match)

Quando o picker abre com uma descrição (p.ex. o reviewer está em cima de um
item), a Quantify chama a RPC `suggest_sinapi_composicao` que usa **pg_trgm**
(`similarity()`) para retornar top-5 composições com score ≥ 0.30.

- **Score ≥ 60%** → verde ("alta confiança")
- **Score 40-60%** → laranja ("média")
- **Score < 40%** → cinza ("baixa")

Clicar em **Aceitar** numa sugestão executa o mesmo fluxo de `linkBudgetItemSinapi`
— **nada é alterado automaticamente sem ação humana** (HITL).

### 4.3. Pré-preenchimento pelo agente AI

Ao gerar um orçamento em draft (`AI_DRAFT`), o agente pode popular
`suggested_sinapi_codigo` + `suggested_sinapi_score` em cada item para que o
reviewer veja a sugestão já na lista de revisão (badge "IA sugere: SINAPI XXXXX").
O reviewer mantém controle total: aceita, escolhe outra, ou ignora.

---

## 5. Schema relevante

### Tabelas

- `sinapi_composicao` — composições analíticas (código + descrição + unidade
  + preço + estado + mês + desonerado + insumos_jsonb)
- `sinapi_insumo` — insumos com preço unitário
- `sinapi_import_log` — histórico de imports por admin

### Colunas em `budget_items`

| Coluna                     | Tipo    | Propósito                                                             |
| -------------------------- | ------- | --------------------------------------------------------------------- |
| `sinapi_codigo`            | text    | Código SINAPI **confirmado** (depois do link)                         |
| `sinapi_mes_referencia`    | date    | Mês de referência do preço linkado                                    |
| `sinapi_snapshot_jsonb`    | jsonb   | Snapshot imutável do preço/unidade no momento do link                 |
| `suggested_sinapi_codigo`  | text    | Sugestão de fuzzy-match (AI) — **não-confirmada**                     |
| `suggested_sinapi_score`   | numeric | Score de similaridade pg_trgm (0..1)                                  |
| `origem`                   | enum    | `MANUAL` / `SINAPI_INSUMO` / `SINAPI_COMPOSICAO` / `AI_DRAFT`         |

### RPCs

- `search_sinapi(p_query, p_estado, p_mes_referencia, p_desonerado, p_type, p_limit)`
  — busca textual clássica (ILIKE + similarity), retorna insumos + composições
- `suggest_sinapi_composicao(p_description, p_estado, p_mes_referencia, p_desonerado, p_limit, p_threshold)`
  — **Fase 2F**: top-N por similaridade pg_trgm, só composições
- `link_budget_item_sinapi(p_item_id, p_user_id, p_sinapi_type, p_sinapi_id, p_update_cost)`
  — link HITL com trilha em `validations`

---

## 6. Otimizações de performance

### Índice trigram (aplicado na Fase 2F)

```sql
CREATE INDEX sinapi_composicao_descricao_trgm_idx
  ON public.sinapi_composicao
  USING gin (descricao gin_trgm_ops);
```

Isso acelera `similarity(descricao, 'texto')` de O(n) para O(log n) no dataset
típico de ~40k composições por mês.

### Filtro por estado/mês antes de similarity

As RPCs sempre filtram `WHERE estado = p_estado AND mes_referencia = ... AND desonerado = ...`
**antes** de calcular similarity, reduzindo drasticamente o conjunto.

---

## 7. Troubleshooting

**"Nenhum import SINAPI concluído ainda"** no picker
→ Nenhum registro em `sinapi_import_log` com `status = 'OK'`. Faça o primeiro
import em `/admin/sinapi/import`.

**Sugestão IA não aparece**
→ Possíveis causas:
  - `sinapi_composicao` está vazio (importe primeiro)
  - Nenhum match acima do threshold de 0.30 (descrição muito ambígua)
  - Filtro atual (estado/mês) não tem dados

**"Composição XXXXX não encontrada no filtro atual"** ao aceitar sugestão
→ A sugestão vem com o filtro atual do picker, mas se o filtro mudou, a busca
pode não achar. Reabra o picker com o filtro correto.

---

## 8. Referências

- TCU Acórdão 2622/2013 — padrão SINAPI para obras públicas federais
- Lei 14.133/2021 (Nova Lei de Licitações) — Art. 23 §1º: obrigatoriedade SINAPI
- Documentação pg_trgm: <https://www.postgresql.org/docs/current/pgtrgm.html>
