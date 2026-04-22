-- 016_sinapi_fuzzy_suggest.sql
-- Fase 2F: Fuzzy-match SINAPI via pg_trgm.
--
-- Adiciona índice trigram em sinapi_composicao.descricao + colunas
-- suggested_sinapi_codigo/score em budget_items + RPC suggest_sinapi_composicao.

-- 1) Índice trigram para acelerar similarity() em descricao.
CREATE INDEX IF NOT EXISTS sinapi_composicao_descricao_trgm_idx
  ON public.sinapi_composicao
  USING gin (descricao gin_trgm_ops);

-- 2) Colunas de sugestão em budget_items (AI → reviewer HITL).
--    - suggested_sinapi_codigo: código SINAPI sugerido
--    - suggested_sinapi_score: similaridade 0..1 do match
--    Reviewer aceita → usa link_budget_item_sinapi → limpa sugestão.
ALTER TABLE public.budget_items
  ADD COLUMN IF NOT EXISTS suggested_sinapi_codigo text,
  ADD COLUMN IF NOT EXISTS suggested_sinapi_score numeric(4, 3);

COMMENT ON COLUMN public.budget_items.suggested_sinapi_codigo IS
  'Código SINAPI sugerido por fuzzy-match (AI). Reviewer pode aceitar ou ignorar.';
COMMENT ON COLUMN public.budget_items.suggested_sinapi_score IS
  'Similaridade (0..1) do match pg_trgm. Sugerimos só quando >= 0.30 (default).';

-- 3) RPC suggest_sinapi_composicao: busca top N composições por similaridade.
--    Retorna array ordenado por score DESC. Threshold mínimo configurável.
CREATE OR REPLACE FUNCTION public.suggest_sinapi_composicao(
  p_description text,
  p_estado text DEFAULT 'SP',
  p_mes_referencia date DEFAULT NULL,
  p_desonerado boolean DEFAULT true,
  p_limit integer DEFAULT 5,
  p_threshold numeric DEFAULT 0.30
)
RETURNS TABLE (
  codigo text,
  descricao text,
  unidade text,
  preco_unitario numeric,
  estado text,
  mes_referencia date,
  desonerado boolean,
  score numeric
)
LANGUAGE sql
STABLE
AS $function$
  SELECT
    sc.codigo,
    sc.descricao,
    sc.unidade,
    sc.preco_unitario,
    sc.estado,
    sc.mes_referencia,
    sc.desonerado,
    ROUND(similarity(sc.descricao, p_description)::numeric, 3) AS score
  FROM public.sinapi_composicao sc
  WHERE sc.estado = p_estado
    AND sc.desonerado = p_desonerado
    AND (p_mes_referencia IS NULL OR sc.mes_referencia = p_mes_referencia)
    AND similarity(sc.descricao, p_description) >= p_threshold
  ORDER BY similarity(sc.descricao, p_description) DESC
  LIMIT GREATEST(p_limit, 1);
$function$;

COMMENT ON FUNCTION public.suggest_sinapi_composicao IS
  'Fase 2F: fuzzy-match SINAPI via pg_trgm. Retorna top N composições ordenadas por similaridade.';

GRANT EXECUTE ON FUNCTION public.suggest_sinapi_composicao TO authenticated;
