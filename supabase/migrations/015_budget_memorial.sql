-- 015_budget_memorial.sql
-- Fase 2E: Memorial descritivo do orçamento.
-- Texto livre (markdown) que descreve materiais, técnicas, normas.
-- Renderizado no PDF como seção antes da tabela de itens.

ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS memorial_md text;

COMMENT ON COLUMN public.budgets.memorial_md IS
  'Memorial descritivo em markdown (materiais, técnicas, normas). Renderizado no PDF.';
