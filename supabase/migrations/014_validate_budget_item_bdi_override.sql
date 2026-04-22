-- 014_validate_budget_item_bdi_override.sql
-- Fase 2D: extende validate_budget_item para aceitar bdi_override_percent
-- em p_changes (permite edição do override via mesmo fluxo de revisão HITL).
--
-- Se a chave 'bdi_override_percent' existe em p_changes:
--   - valor numérico → seta override
--   - valor NULL ou string vazia → limpa override (item volta a usar BDI global)
-- Se a chave NÃO existe → bdi_override_percent permanece inalterado.

CREATE OR REPLACE FUNCTION public.validate_budget_item(
  p_item_id uuid,
  p_user_id uuid,
  p_action text,
  p_comment text DEFAULT NULL::text,
  p_changes jsonb DEFAULT NULL::jsonb
)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_budget_id UUID;
  v_item_name TEXT;
  v_status validation_status;
  v_validation_id UUID;
  v_new_qty NUMERIC;
  v_new_unit NUMERIC;
BEGIN
  SELECT bi.budget_id, bi.description INTO v_budget_id, v_item_name
  FROM budget_items bi WHERE bi.id = p_item_id;

  IF v_budget_id IS NULL THEN
    RAISE EXCEPTION 'Budget item % nao encontrado', p_item_id;
  END IF;

  v_status := CASE p_action
    WHEN 'APPROVE' THEN 'VALIDATED'::validation_status
    WHEN 'REJECT'  THEN 'REJECTED'::validation_status
    WHEN 'EDIT'    THEN 'IN_REVIEW'::validation_status
    ELSE NULL
  END;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Acao invalida: %', p_action;
  END IF;

  INSERT INTO validations (
    status, comment, changes, validated_by, budget_id,
    item_type, item_name
  )
  VALUES (
    v_status, p_comment, p_changes, p_user_id, v_budget_id,
    'BUDGET_ITEM', v_item_name
  )
  RETURNING id INTO v_validation_id;

  IF p_action = 'EDIT' AND p_changes IS NOT NULL THEN
    v_new_qty := COALESCE((p_changes->>'quantity')::numeric, (SELECT quantity FROM budget_items WHERE id = p_item_id));
    v_new_unit := COALESCE((p_changes->>'unit_cost')::numeric, (SELECT unit_cost FROM budget_items WHERE id = p_item_id));
    UPDATE budget_items SET
      description = COALESCE((p_changes->>'description'), description),
      quantity = v_new_qty,
      unit_cost = v_new_unit,
      total_cost = COALESCE((p_changes->>'total_cost')::numeric, v_new_qty * v_new_unit),
      -- Fase 2D: aceitar bdi_override_percent. Presente com valor NULL (ou vazio) → limpa override.
      bdi_override_percent = CASE
        WHEN p_changes ? 'bdi_override_percent' THEN
          NULLIF(p_changes->>'bdi_override_percent', '')::numeric
        ELSE bdi_override_percent
      END,
      updated_at = now()
    WHERE id = p_item_id;
  END IF;

  RETURN v_validation_id;
END;
$function$;

COMMENT ON FUNCTION public.validate_budget_item IS
  'HITL: aprovar/rejeitar/editar item de orçamento. Aceita em p_changes: description, quantity, unit_cost, total_cost, bdi_override_percent (presente+null = limpa override).';
