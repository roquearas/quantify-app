-- 016_suggest_sinapi_for_budget.sql
-- Fase 2F: RPC de sugestão em batch.
--
-- Objetivo: pra cada item do budget SEM SINAPI linkado, retornar o melhor match
-- encontrado via search_sinapi (pg_trgm) filtrado pelo estado do projeto +
-- último mês importado com sucesso.
--
-- Read-only: não escreve em budget_items. O aceite reusa link_budget_item_sinapi.
--
-- Defaults:
--   p_min_similarity = 0.35  (calibração pg_trgm em PT-BR construtivo)
--   p_estado         = projects.state do budget
--   p_mes_referencia = max(mes_referencia) de sinapi_import_log status='OK' pro estado
--   p_desonerado     = true  (pilot SP)

CREATE OR REPLACE FUNCTION public.suggest_sinapi_for_budget(
  p_budget_id uuid,
  p_min_similarity real DEFAULT 0.35,
  p_estado text DEFAULT NULL,
  p_mes_referencia date DEFAULT NULL,
  p_desonerado boolean DEFAULT true
) RETURNS TABLE (
  item_id uuid,
  item_description text,
  sinapi_type text,
  sinapi_id uuid,
  sinapi_codigo text,
  sinapi_descricao text,
  sinapi_unidade text,
  sinapi_preco_unitario numeric,
  similarity real
)
LANGUAGE plpgsql SECURITY INVOKER STABLE
AS $$
DECLARE
  v_estado text;
  v_mes date;
  v_desonerado boolean := COALESCE(p_desonerado, true);
BEGIN
  -- 1. Resolver estado (param > projects.state)
  IF p_estado IS NOT NULL AND length(trim(p_estado)) > 0 THEN
    v_estado := upper(trim(p_estado));
  ELSE
    SELECT upper(p.state) INTO v_estado
    FROM budgets b
    JOIN projects p ON p.id = b.project_id
    WHERE b.id = p_budget_id;
  END IF;

  IF v_estado IS NULL OR length(v_estado) = 0 THEN
    RAISE EXCEPTION 'Estado não resolvido para budget % (passe p_estado ou preencha projects.state)', p_budget_id;
  END IF;

  -- 2. Resolver mês (param > último import SUCCESS)
  IF p_mes_referencia IS NOT NULL THEN
    v_mes := p_mes_referencia;
  ELSE
    SELECT max(mes_referencia) INTO v_mes
    FROM sinapi_import_log
    WHERE status = 'OK'
      AND upper(estado) = v_estado
      AND desonerado = v_desonerado;
  END IF;

  IF v_mes IS NULL THEN
    RAISE EXCEPTION 'Nenhum import SINAPI OK encontrado para estado=% desonerado=% (passe p_mes_referencia)', v_estado, v_desonerado;
  END IF;

  -- 3. Pra cada item sem SINAPI linkado, pegar o melhor match
  RETURN QUERY
  SELECT
    bi.id AS item_id,
    bi.description AS item_description,
    s.tipo AS sinapi_type,
    s.id AS sinapi_id,
    s.codigo AS sinapi_codigo,
    s.descricao AS sinapi_descricao,
    s.unidade AS sinapi_unidade,
    s.preco_unitario AS sinapi_preco_unitario,
    s.similarity
  FROM budget_items bi
  CROSS JOIN LATERAL (
    SELECT *
    FROM public.search_sinapi(bi.description, v_estado, v_mes, v_desonerado, 'both', 1)
    LIMIT 1
  ) s
  WHERE bi.budget_id = p_budget_id
    AND bi.origem NOT IN ('SINAPI_INSUMO'::budget_item_origem, 'SINAPI_COMPOSICAO'::budget_item_origem)
    AND s.similarity >= p_min_similarity
  ORDER BY s.similarity DESC;
END;
$$;

COMMENT ON FUNCTION public.suggest_sinapi_for_budget IS
  'Fase 2F: sugere SINAPI em batch para items MANUAL/AI_DRAFT do budget. Read-only. Defaults: estado = projects.state, mes = último sinapi_import_log status=OK, desonerado = true, min_similarity = 0.35.';

GRANT EXECUTE ON FUNCTION public.suggest_sinapi_for_budget(uuid, real, text, date, boolean) TO authenticated;
