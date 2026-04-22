-- 012_curva_abc_view.sql
-- Fase 2C: View v_budget_items_curva_abc — classificação ABC por budget
--
-- Convenção clássica (Pareto):
-- - A: itens cujo acumulado vai até 80% do custo total (os "críticos poucos")
-- - B: 80%–95% (intermediários)
-- - C: 95%–100% (cauda longa)
--
-- A view é ranqueada por total_cost DESC dentro de cada budget e expõe
-- rank_position, item_percent (% do total), cumulative_percent, classe_abc.
-- RLS é herdado de budget_items (mesmo access do PostgREST normal).
--
-- Notas:
-- - Itens sem total_cost (NULL) são tratados como 0 (não contribuem).
-- - Se budget_total = 0 (orçamento vazio ou zerado), percentuais = NULL
--   e classe_abc = NULL (sem classificação possível).
-- - rank_position é 1-based.

CREATE OR REPLACE VIEW v_budget_items_curva_abc AS
WITH ranked AS (
  SELECT
    bi.id,
    bi.budget_id,
    bi.code,
    bi.description,
    bi.unit,
    bi.quantity,
    bi.unit_cost,
    bi.total_cost,
    bi.category,
    bi.confidence,
    bi.origem,
    bi.sinapi_codigo,
    bi.sinapi_mes_referencia,
    COALESCE(bi.total_cost, 0) AS effective_total,
    SUM(COALESCE(bi.total_cost, 0)) OVER (PARTITION BY bi.budget_id) AS budget_total,
    ROW_NUMBER() OVER (
      PARTITION BY bi.budget_id
      ORDER BY COALESCE(bi.total_cost, 0) DESC, bi.description ASC
    ) AS rank_position
  FROM budget_items bi
),
cumulative AS (
  SELECT
    r.*,
    SUM(r.effective_total) OVER (
      PARTITION BY r.budget_id
      ORDER BY r.rank_position
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS cumulative_cost
  FROM ranked r
)
SELECT
  c.id,
  c.budget_id,
  c.code,
  c.description,
  c.unit,
  c.quantity,
  c.unit_cost,
  c.total_cost,
  c.category,
  c.confidence,
  c.origem,
  c.sinapi_codigo,
  c.sinapi_mes_referencia,
  c.rank_position,
  c.budget_total,
  c.cumulative_cost,
  CASE
    WHEN c.budget_total > 0
      THEN ROUND((c.effective_total / c.budget_total * 100)::numeric, 2)
    ELSE NULL
  END AS item_percent,
  CASE
    WHEN c.budget_total > 0
      THEN ROUND((c.cumulative_cost / c.budget_total * 100)::numeric, 2)
    ELSE NULL
  END AS cumulative_percent,
  CASE
    WHEN c.budget_total IS NULL OR c.budget_total = 0 THEN NULL
    WHEN c.cumulative_cost / c.budget_total <= 0.80 THEN 'A'
    WHEN c.cumulative_cost / c.budget_total <= 0.95 THEN 'B'
    ELSE 'C'
  END AS classe_abc
FROM cumulative c;

COMMENT ON VIEW v_budget_items_curva_abc IS
  'Classificação ABC (Pareto 80/15/5) por budget. Ranqueada por total_cost DESC.';

-- Permissões: RLS da view segue as underlying tables (budget_items).
-- authenticated é suficiente pra SELECT; tenant isolation é feito em budget_items.
GRANT SELECT ON v_budget_items_curva_abc TO authenticated;
