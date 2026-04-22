# Guia de importação SINAPI

Este guia mostra como alimentar o banco da Quantify com **insumos e composições** SINAPI da Caixa Econômica Federal, estado por estado, mês a mês.

## 1. Baixar a planilha

1. Abra o site oficial: <https://www.caixa.gov.br/poder-publico/modernizacao-gestao/sinapi/>
2. No menu lateral, clique em **Referências de preços e custos**.
3. Escolha o estado (ex.: SP) e o mês (ex.: março/2026).
4. Baixe **um** dos XLSX:
   - `SINAPI_Ref_Insumos_Composicoes_<UF>_<mês>_Desonerado.xlsx` (pilot: desonerado)
   - `SINAPI_Ref_Insumos_Composicoes_<UF>_<mês>_ComDesoneracao.xlsx`

> A Caixa publica entre o 15º e 20º dia útil do mês seguinte. A Quantify usa o mês mais recente disponível.

## 2. Rodar o importador

```bash
# Na raiz do repo, com DATABASE_URL setada:
DATABASE_URL="postgresql://..." \
npx tsx scripts/import-sinapi.ts \
  --file /caminho/para/SINAPI_SP_2026-03_Desonerado.xlsx \
  --estado SP \
  --mes 2026-03-01 \
  --desonerado
```

Flags:

| Flag | Obrigatório? | Valores |
|---|---|---|
| `--file` | sim | caminho absoluto ou relativo pro XLSX |
| `--estado` | sim | UF (SP, RJ, MG…) |
| `--mes` | sim | `AAAA-MM-01` (primeiro dia do mês) |
| `--desonerado` | opcional | flag boolean — presente ⇒ `true` |

O script:

1. Faz upsert em `sinapi_insumo` e `sinapi_composicao` com chaves `(codigo, estado, mes_referencia, desonerado)`.
2. Escreve em `sinapi_import_log` (`RUNNING` → `OK` ou `ERROR`) pra servir de auditoria.
3. Emite contagem final (`X insumos inseridos / Y atualizados / Z composições inseridas…`).

## 3. Verificação

Pelo SQL:

```sql
SELECT
  (SELECT count(*) FROM sinapi_insumo
    WHERE estado='SP' AND mes_referencia='2026-03-01' AND desonerado) AS insumos,
  (SELECT count(*) FROM sinapi_composicao
    WHERE estado='SP' AND mes_referencia='2026-03-01' AND desonerado) AS composicoes,
  (SELECT status FROM sinapi_import_log
    WHERE estado='SP' AND mes_referencia='2026-03-01' AND desonerado
    ORDER BY created_at DESC LIMIT 1) AS ultimo_status;
```

Resultado esperado (pilot SP/mar-26 desonerado): ~12.000 insumos + ~5.500 composições, status `OK`.

Pela UI: `/admin/sinapi/import` lista os últimos imports com status, timestamps e contagens. Só admins com `is_super_admin=true` acessam.

## 4. Erros comuns

| Sintoma | Causa | Correção |
|---|---|---|
| `Coluna CODIGO não encontrada` | Cabeçalho da Caixa mudou de nome | Abra o XLSX, compare com `src/lib/sinapi/parser.ts` (constantes `HEADERS_*`) e ajuste |
| `Codigo vazio em linha N` | Linha totalmente em branco no meio | Geralmente seguro ignorar; o parser pula linhas sem código |
| Preços com vírgula decimal vindo como string | Locale pt-BR do Excel | O parser já converte vírgula → ponto; se continuar falhando, abrir XLSX e reexportar em en-US |
| `sinapi_import_log` ficou `RUNNING` indefinido | Processo morreu no meio (OOM ou timeout) | Apagar a linha `RUNNING` manualmente e rodar de novo com o mesmo XLSX |
| Caracteres `ÇÍÇÓ` corrompidos | Encoding latin1 → utf-8 | XLSXs modernos são utf-8; se pegar um legado ISO-8859-1, abrir no LibreOffice e salvar como `.xlsx` |

## 5. Frequência recomendada

- **Pilot Isabela**: 1× por mês, no primeiro dia útil após a Caixa publicar (~dia 20).
- **Produção futura**: automatizar via cron no Vercel (`vercel.ts` > `crons`) que puxa o XLSX público e dispara o importer.

## 6. Como a Quantify usa

Depois que os imports estão OK, aparecem em 3 lugares:

1. **Picker manual** no review do orçamento: admin clica "Linkar SINAPI" em cada item e busca por descrição ou código (usa `pg_trgm` + `search_sinapi`).
2. **Sugestão em batch** (Fase 2F): botão "Sugerir SINAPI" roda `suggest_sinapi_for_budget` e mostra a melhor match (≥35% de similaridade) em cada linha sem link.
3. **Snapshot persistido**: quando admin aceita, `budget_items.sinapi_snapshot_jsonb` guarda preço/código/mês — o orçamento não muda se a SINAPI for atualizada depois.
