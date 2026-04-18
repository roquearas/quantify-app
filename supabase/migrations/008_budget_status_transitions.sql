-- =====================================================
-- QUANTIFY — Migration 008: HITL workflow RPC functions
-- Data: 2026-04-18
-- =====================================================
-- Adiciona 3 funções RPC para o fluxo de validação humana de budgets:
--   - submit_budget_for_review: AI_DRAFT → IN_REVIEW
--   - validate_budget_item: aprovar/editar/rejeitar um item (cria row em validations)
--   - finalize_budget_review: transita budget → VALIDATED ou REJECTED baseado nas validações dos items
-- =====================================================

-- Submete um budget para revisão (requer que tenha items)
CREATE OR REPLACE FUNCTION submit_budget_for_review(p_budget_id UUID)
RETURNS void AS $$
DECLARE
  item_count INT;
BEGIN
  SELECT COUNT(*) INTO item_count FROM budget_items WHERE budget_id = p_budget_id;
  IF item_count = 0 THEN
    RAISE EXCEPTION 'Budget % não tem items — não pode ir para revisão', p_budget_id;
  END IF;
  UPDATE budgets
  SET status = 'IN_REVIEW'::validation_status, updated_at = now()
  WHERE id = p_budget_id AND status = 'AI_DRAFT'::validation_status;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Budget % não está em AI_DRAFT (status atual não permite transição)', p_budget_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Registra uma validação de item: APPROVE, REJECT ou EDIT (com mudanças aplicadas)
CREATE OR REPLACE FUNCTION validate_budget_item(
  p_item_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_comment TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL
) RETURNS UUID AS $$
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
    RAISE EXCEPTION 'Budget item % não encontrado', p_item_id;
  END IF;

  v_status := CASE p_action
    WHEN 'APPROVE' THEN 'VALIDATED'::validation_status
    WHEN 'REJECT'  THEN 'REJECTED'::validation_status
    WHEN 'EDIT'    THEN 'IN_REVIEW'::validation_status
    ELSE NULL
  END;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Ação inválida: % (esperado APPROVE, REJECT ou EDIT)', p_action;
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

  -- Aplicar mudanças se EDIT
  IF p_action = 'EDIT' AND p_changes IS NOT NULL THEN
    v_new_qty := COALESCE((p_changes->>'quantity')::numeric, (SELECT quantity FROM budget_items WHERE id = p_item_id));
    v_new_unit := COALESCE((p_changes->>'unit_cost')::numeric, (SELECT unit_cost FROM budget_items WHERE id = p_item_id));
    UPDATE budget_items SET
      description = COALESCE((p_changes->>'description'), description),
      quantity = v_new_qty,
      unit_cost = v_new_unit,
      total_cost = COALESCE((p_changes->>'total_cost')::numeric, v_new_qty * v_new_unit),
      updated_at = now()
    WHERE id = p_item_id;
  END IF;

  RETURN v_validation_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Finaliza a revisão: se todos items VALIDATED → budget VALIDATED; se algum REJECTED → budget REJECTED
CREATE OR REPLACE FUNCTION finalize_budget_review(p_budget_id UUID, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  total_items INT;
  approved_items INT;
  rejected_items INT;
  v_subtotal NUMERIC;
  v_bdi NUMERIC;
  v_total NUMERIC;
BEGIN
  SELECT COUNT(*) INTO total_items FROM budget_items WHERE budget_id = p_budget_id;

  -- Último status por item_name (descrição)
  WITH latest AS (
    SELECT DISTINCT ON (v.item_name) v.item_name, v.status
    FROM validations v
    WHERE v.budget_id = p_budget_id AND v.item_type = 'BUDGET_ITEM'
    ORDER BY v.item_name, v.created_at DESC
  )
  SELECT
    COUNT(*) FILTER (WHERE status = 'VALIDATED'),
    COUNT(*) FILTER (WHERE status = 'REJECTED')
  INTO approved_items, rejected_items
  FROM latest;

  IF rejected_items > 0 THEN
    UPDATE budgets SET status = 'REJECTED'::validation_status, updated_at = now() WHERE id = p_budget_id;
    INSERT INTO validations (status, comment, validated_by, budget_id, item_type)
    VALUES ('REJECTED'::validation_status, 'Budget rejeitado: ' || rejected_items || ' item(ns) com problema', p_user_id, p_budget_id, 'BUDGET');
    RETURN 'REJECTED';
  ELSIF approved_items >= total_items THEN
    SELECT COALESCE(SUM(total_cost), 0) INTO v_subtotal FROM budget_items WHERE budget_id = p_budget_id;
    SELECT bdi_percentage INTO v_bdi FROM budgets WHERE id = p_budget_id;
    v_total := v_subtotal * (1 + COALESCE(v_bdi, 0) / 100);
    UPDATE budgets SET
      status = 'VALIDATED'::validation_status,
      total_cost = v_total,
      updated_at = now()
    WHERE id = p_budget_id;
    INSERT INTO validations (status, comment, validated_by, budget_id, item_type)
    VALUES ('VALIDATED'::validation_status, 'Budget validado: ' || total_items || ' itens aprovados; total=' || v_total, p_user_id, p_budget_id, 'BUDGET');
    RETURN 'VALIDATED';
  ELSE
    RETURN 'PENDING:' || (total_items - approved_items) || '_items_restantes';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
