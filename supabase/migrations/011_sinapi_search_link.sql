-- 011_sinapi_search_link.sql
-- Fase 2B: RPC de busca fuzzy SINAPI + RPC de link budget_item→SINAPI (com snapshot)
--
-- Decisões:
-- - search_sinapi: union insumo+composicao, ranqueado por pg_trgm similarity.
--   Usa ILIKE para recall alto + similarity pra ranking.
-- - link_budget_item_sinapi: monta snapshot server-side (fonte única de verdade),
--   atualiza budget_items com origem/snapshot/codigo/mes_ref, opcionalmente
--   sincroniza unit + unit_cost + total_cost com os dados SINAPI.
-- - Trilha de auditoria em validations (item_type = 'BUDGET_ITEM_SINAPI_LINK').
-- - SECURITY INVOKER: respeita RLS de sinapi_* (authenticated read) e budget_items.

-- =============================================================================
-- 1. search_sinapi — busca fuzzy unificada
-- =============================================================================
CREATE OR REPLACE FUNCTION search_sinapi(
  p_query text,
  p_estado text,
  p_mes_referencia date,
  p_desonerado boolean,
  p_type text DEFAULT 'both',
  p_limit int DEFAULT 20
) RETURNS TABLE (
  tipo text,
  id uuid,
  codigo text,
  descricao text,
  unidade text,
  categoria_ou_grupo text,
  preco_unitario numeric,
  similarity real
) AS $$
DECLARE
  v_query text := COALESCE(NULLIF(trim(p_query), ''), '');
  v_type text := COALESCE(lower(p_type), 'both');
BEGIN
  IF v_type NOT IN ('insumo', 'composicao', 'both') THEN
    RAISE EXCEPTION 'p_type inválido: % (esperado insumo, composicao ou both)', p_type;
  END IF;

  RETURN QUERY
  WITH unified AS (
    SELECT
      'INSUMO'::text AS tipo,
      i.id,
      i.codigo,
      i.descricao,
      i.unidade,
      i.categoria AS categoria_ou_grupo,
      i.preco_unitario,
      GREATEST(
        similarity(i.descricao, v_query),
        similarity(i.codigo, v_query)
      )::real AS sim
    FROM sinapi_insumo i
    WHERE i.estado = p_estado
      AND i.mes_referencia = p_mes_referencia
      AND i.desonerado = p_desonerado
      AND v_type IN ('insumo', 'both')
      AND (
        v_query = ''
        OR i.descricao ILIKE '%' || v_query || '%'
        OR i.codigo ILIKE '%' || v_query || '%'
        OR similarity(i.descricao, v_query) > 0.1
      )

    UNION ALL

    SELECT
      'COMPOSICAO'::text AS tipo,
      c.id,
      c.codigo,
      c.descricao,
      c.unidade,
      c.grupo AS categoria_ou_grupo,
      c.preco_unitario,
      GREATEST(
        similarity(c.descricao, v_query),
        similarity(c.codigo, v_query)
      )::real AS sim
    FROM sinapi_composicao c
    WHERE c.estado = p_estado
      AND c.mes_referencia = p_mes_referencia
      AND c.desonerado = p_desonerado
      AND v_type IN ('composicao', 'both')
      AND (
        v_query = ''
        OR c.descricao ILIKE '%' || v_query || '%'
        OR c.codigo ILIKE '%' || v_query || '%'
        OR similarity(c.descricao, v_query) > 0.1
      )
  )
  SELECT u.tipo, u.id, u.codigo, u.descricao, u.unidade, u.categoria_ou_grupo,
         u.preco_unitario, u.sim
  FROM unified u
  ORDER BY u.sim DESC, u.descricao ASC
  LIMIT GREATEST(1, LEAST(p_limit, 100));
END;
$$ LANGUAGE plpgsql SECURITY INVOKER STABLE;

COMMENT ON FUNCTION search_sinapi IS
  'Busca fuzzy (pg_trgm) em insumos e composições SINAPI, filtrada por estado/mês/desonerado. Retorna até 100 resultados ranqueados por similaridade.';

-- =============================================================================
-- 2. link_budget_item_sinapi — liga item a SINAPI com snapshot
-- =============================================================================
CREATE OR REPLACE FUNCTION link_budget_item_sinapi(
  p_item_id uuid,
  p_user_id uuid,
  p_sinapi_type text,
  p_sinapi_id uuid,
  p_update_cost boolean DEFAULT true
) RETURNS uuid AS $$
DECLARE
  v_budget_id uuid;
  v_item_desc text;
  v_origem budget_item_origem;
  v_snapshot jsonb;
  v_codigo text;
  v_mes date;
  v_preco numeric;
  v_unidade text;
  v_validation_id uuid;
  v_sinapi_type_upper text := upper(p_sinapi_type);
BEGIN
  SELECT bi.budget_id, bi.description
    INTO v_budget_id, v_item_desc
  FROM budget_items bi
  WHERE bi.id = p_item_id;

  IF v_budget_id IS NULL THEN
    RAISE EXCEPTION 'Budget item % não encontrado', p_item_id;
  END IF;

  IF v_sinapi_type_upper = 'INSUMO' THEN
    v_origem := 'SINAPI_INSUMO'::budget_item_origem;
    SELECT
      jsonb_build_object(
        'tipo', 'INSUMO',
        'codigo', i.codigo,
        'descricao', i.descricao,
        'unidade', i.unidade,
        'categoria', i.categoria,
        'preco_unitario', i.preco_unitario,
        'estado', i.estado,
        'mes_referencia', i.mes_referencia,
        'desonerado', i.desonerado,
        'snapshot_at', now()
      ),
      i.codigo, i.mes_referencia, i.preco_unitario, i.unidade
      INTO v_snapshot, v_codigo, v_mes, v_preco, v_unidade
    FROM sinapi_insumo i
    WHERE i.id = p_sinapi_id;

  ELSIF v_sinapi_type_upper = 'COMPOSICAO' THEN
    v_origem := 'SINAPI_COMPOSICAO'::budget_item_origem;
    SELECT
      jsonb_build_object(
        'tipo', 'COMPOSICAO',
        'codigo', c.codigo,
        'descricao', c.descricao,
        'unidade', c.unidade,
        'grupo', c.grupo,
        'preco_unitario', c.preco_unitario,
        'estado', c.estado,
        'mes_referencia', c.mes_referencia,
        'desonerado', c.desonerado,
        'insumos', c.insumos_jsonb,
        'snapshot_at', now()
      ),
      c.codigo, c.mes_referencia, c.preco_unitario, c.unidade
      INTO v_snapshot, v_codigo, v_mes, v_preco, v_unidade
    FROM sinapi_composicao c
    WHERE c.id = p_sinapi_id;

  ELSE
    RAISE EXCEPTION 'p_sinapi_type inválido: % (esperado INSUMO ou COMPOSICAO)', p_sinapi_type;
  END IF;

  IF v_snapshot IS NULL THEN
    RAISE EXCEPTION 'SINAPI % com id % não encontrado', v_sinapi_type_upper, p_sinapi_id;
  END IF;

  UPDATE budget_items SET
    origem = v_origem,
    sinapi_insumo_id     = CASE WHEN v_sinapi_type_upper = 'INSUMO'     THEN p_sinapi_id ELSE NULL END,
    sinapi_composicao_id = CASE WHEN v_sinapi_type_upper = 'COMPOSICAO' THEN p_sinapi_id ELSE NULL END,
    sinapi_snapshot_jsonb = v_snapshot,
    sinapi_codigo         = v_codigo,
    sinapi_mes_referencia = v_mes,
    unit       = CASE WHEN p_update_cost THEN v_unidade ELSE unit END,
    unit_cost  = CASE WHEN p_update_cost THEN v_preco   ELSE unit_cost END,
    total_cost = CASE WHEN p_update_cost THEN quantity * v_preco ELSE total_cost END,
    updated_at = now()
  WHERE id = p_item_id;

  INSERT INTO validations (
    status, comment, changes, validated_by, budget_id,
    item_type, item_name
  ) VALUES (
    'IN_REVIEW'::validation_status,
    'SINAPI linked: ' || v_sinapi_type_upper || ' ' || v_codigo,
    jsonb_build_object(
      'sinapi_type', v_sinapi_type_upper,
      'sinapi_codigo', v_codigo,
      'sinapi_id', p_sinapi_id,
      'mes_referencia', v_mes,
      'update_cost', p_update_cost,
      'preco_unitario', v_preco
    ),
    p_user_id, v_budget_id,
    'BUDGET_ITEM_SINAPI_LINK', v_item_desc
  ) RETURNING id INTO v_validation_id;

  RETURN v_validation_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

COMMENT ON FUNCTION link_budget_item_sinapi IS
  'Liga budget_item a insumo/composição SINAPI congelando snapshot. Atualiza unit/unit_cost/total_cost se p_update_cost=true. Registra em validations.';
