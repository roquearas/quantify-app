-- 013_bdi_breakdown.sql
-- Fase 2D: persistir composição do BDI (lucro + impostos + despesas indiretas + risco)
-- Fórmula TCU simplificada (Acórdão 2622/2013):
--   BDI = [(1 + desp_ind + risco) * (1 + lucro)] / (1 - impostos) - 1
-- (todos em decimal; UI trabalha em % e converte)
--
-- Schema pré-existente (OK):
--   budgets.bdi_percentage numeric       -- BDI efetivo aplicado (manual ou derivado)
--   budget_items.bdi_override_percent    -- override por item
--
-- Novo campo:
--   budgets.bdi_breakdown jsonb          -- {lucro, impostos, despesas_indiretas, risco}
--                                         NULL = modo manual (usa bdi_percentage direto)

ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS bdi_breakdown jsonb;

COMMENT ON COLUMN budgets.bdi_breakdown IS
  'Composição do BDI em JSON: {lucro, impostos, despesas_indiretas, risco} — cada campo em %. NULL = modo manual (usa bdi_percentage como valor direto). Fórmula TCU 2622/2013 simplificada.';

-- Validação leve: se presente, tem que ser objeto
ALTER TABLE budgets
  ADD CONSTRAINT budgets_bdi_breakdown_is_object
  CHECK (bdi_breakdown IS NULL OR jsonb_typeof(bdi_breakdown) = 'object');
