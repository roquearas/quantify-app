-- 010_budget_item_composicao.sql
-- Fase 2A: budget_item ganha link opcional pra composição SINAPI + snapshot + origem
--
-- Decisões:
-- - origem: MANUAL (padrão), SINAPI_INSUMO, SINAPI_COMPOSICAO, AI_DRAFT
-- - snapshot: JSONB congelado no momento em que item foi criado
--             (composição completa + insumos detalhados)
--             garante reprodutibilidade legal do orçamento
-- - FK soft (ON DELETE SET NULL) — SINAPI pode ser re-importado,
--   o snapshot é a fonte de verdade, não a FK

-- =============================================================================
-- 1. Enum para origem do item
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budget_item_origem') THEN
    CREATE TYPE budget_item_origem AS ENUM (
      'MANUAL',
      'SINAPI_INSUMO',
      'SINAPI_COMPOSICAO',
      'AI_DRAFT'
    );
  END IF;
END $$;

-- =============================================================================
-- 2. Colunas novas em budget_items
-- =============================================================================
ALTER TABLE budget_items
  ADD COLUMN IF NOT EXISTS origem budget_item_origem NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN IF NOT EXISTS sinapi_insumo_id uuid REFERENCES sinapi_insumo(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sinapi_composicao_id uuid REFERENCES sinapi_composicao(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sinapi_snapshot_jsonb jsonb,
  ADD COLUMN IF NOT EXISTS sinapi_codigo text,
  ADD COLUMN IF NOT EXISTS sinapi_mes_referencia date,
  ADD COLUMN IF NOT EXISTS bdi_override_percent numeric(5,2) CHECK (bdi_override_percent IS NULL OR (bdi_override_percent >= 0 AND bdi_override_percent <= 100));

-- Consistência: se origem é SINAPI_*, precisa ter snapshot
ALTER TABLE budget_items
  DROP CONSTRAINT IF EXISTS budget_items_sinapi_snapshot_check;
ALTER TABLE budget_items
  ADD CONSTRAINT budget_items_sinapi_snapshot_check
  CHECK (
    (origem IN ('SINAPI_INSUMO', 'SINAPI_COMPOSICAO') AND sinapi_snapshot_jsonb IS NOT NULL)
    OR origem NOT IN ('SINAPI_INSUMO', 'SINAPI_COMPOSICAO')
  );

-- Index pra filtros e auditoria
CREATE INDEX IF NOT EXISTS idx_budget_items_origem ON budget_items (origem);
CREATE INDEX IF NOT EXISTS idx_budget_items_sinapi_codigo ON budget_items (sinapi_codigo)
  WHERE sinapi_codigo IS NOT NULL;

COMMENT ON COLUMN budget_items.origem IS
  'Origem do item: MANUAL (digitado), SINAPI_INSUMO/COMPOSICAO (da base SINAPI), AI_DRAFT (IA gerou).';
COMMENT ON COLUMN budget_items.sinapi_snapshot_jsonb IS
  'Snapshot congelado da composição SINAPI no momento em que item foi criado. Fonte de verdade para reprodutibilidade legal.';
COMMENT ON COLUMN budget_items.bdi_override_percent IS
  'Override do BDI do budget pra este item específico (ex: fundação 22% vs resto 28%). NULL = usa bdi_percent do budget.';
