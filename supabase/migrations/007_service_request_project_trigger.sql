-- =====================================================
-- QUANTIFY — Migration 007: trigger service_request → project + budget
-- Data: 2026-04-18
-- =====================================================
-- Ao aceitar uma service_request (stage='ACCEPTED'), cria automaticamente:
--   - um projects row (tipo inferido do slug do service)
--   - um budgets row version=1 (tipo ANALYTICAL por default)
--   - vincula ambos via service_requests.project_id e service_requests.budget_id
--
-- As colunas project_id e budget_id já existem em service_requests.
-- =====================================================

-- Helper: mapear slug do service para project_type
CREATE OR REPLACE FUNCTION map_service_slug_to_project_type(svc_slug TEXT)
RETURNS project_type AS $$
BEGIN
  RETURN CASE
    WHEN svc_slug ILIKE '%residencial-multi%' OR svc_slug ILIKE '%edificio%' THEN 'RESIDENTIAL_MULTI'::project_type
    WHEN svc_slug ILIKE '%residencial%' OR svc_slug ILIKE '%casa%' THEN 'RESIDENTIAL'::project_type
    WHEN svc_slug ILIKE '%comercial%' OR svc_slug ILIKE '%loja%' OR svc_slug ILIKE '%escritorio%' THEN 'COMMERCIAL'::project_type
    WHEN svc_slug ILIKE '%hospital%' OR svc_slug ILIKE '%clinica%' THEN 'HOSPITAL'::project_type
    WHEN svc_slug ILIKE '%industrial%' OR svc_slug ILIKE '%galpao%' THEN 'INDUSTRIAL'::project_type
    WHEN svc_slug ILIKE '%educacional%' OR svc_slug ILIKE '%escola%' THEN 'EDUCATIONAL'::project_type
    WHEN svc_slug ILIKE '%infra%' OR svc_slug ILIKE '%rodov%' OR svc_slug ILIKE '%ponte%' THEN 'INFRASTRUCTURE'::project_type
    WHEN svc_slug ILIKE '%reforma%' OR svc_slug ILIKE '%retrofit%' THEN 'RENOVATION'::project_type
    ELSE 'OTHER'::project_type
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper: mapear slug do service para budget_type
CREATE OR REPLACE FUNCTION map_service_slug_to_budget_type(svc_slug TEXT)
RETURNS budget_type AS $$
BEGIN
  RETURN CASE
    WHEN svc_slug ILIKE '%parametrico%' OR svc_slug ILIKE '%anteprojeto%' OR svc_slug ILIKE '%estimativa%' THEN 'PARAMETRIC'::budget_type
    WHEN svc_slug ILIKE '%aditivo%' OR svc_slug ILIKE '%replanilhamento%' THEN 'ADDITIVE'::budget_type
    WHEN svc_slug ILIKE '%hh%' OR svc_slug ILIKE '%hora-homem%' THEN 'HYBRID'::budget_type
    ELSE 'ANALYTICAL'::budget_type
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger function: cria project + budget ao aceitar
CREATE OR REPLACE FUNCTION create_project_on_accept()
RETURNS TRIGGER AS $$
DECLARE
  new_project_id UUID;
  new_budget_id UUID;
  svc_slug TEXT;
  svc_name TEXT;
  mapped_project_type project_type;
  mapped_budget_type budget_type;
  client_display_name TEXT;
BEGIN
  IF NEW.stage = 'ACCEPTED'
     AND (OLD.stage IS NULL OR OLD.stage <> 'ACCEPTED')
     AND NEW.project_id IS NULL THEN

    SELECT slug, name INTO svc_slug, svc_name FROM services WHERE id = NEW.service_id;
    mapped_project_type := map_service_slug_to_project_type(COALESCE(svc_slug, ''));
    mapped_budget_type := map_service_slug_to_budget_type(COALESCE(svc_slug, ''));

    SELECT name INTO client_display_name FROM companies WHERE id = NEW.company_id;

    INSERT INTO projects (
      name, type, status, company_id, client_name,
      description, city, state, total_area
    )
    VALUES (
      NEW.title,
      mapped_project_type,
      'STUDY'::project_status,
      NEW.company_id,
      COALESCE(client_display_name, 'Cliente'),
      NEW.description,
      NEW.city,
      NEW.state,
      NEW.total_area
    )
    RETURNING id INTO new_project_id;

    INSERT INTO budgets (
      name, version, type, status, price_base, project_id
    )
    VALUES (
      NEW.title || ' — Orçamento v1',
      1,
      mapped_budget_type,
      'AI_DRAFT'::validation_status,
      'SINAPI'::price_base,
      new_project_id
    )
    RETURNING id INTO new_budget_id;

    UPDATE service_requests
    SET project_id = new_project_id,
        budget_id = new_budget_id
    WHERE id = NEW.id;

    RAISE NOTICE 'Trigger create_project_on_accept: criados project=% budget=% para service_request=%',
      new_project_id, new_budget_id, NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_create_project_on_accept ON service_requests;

CREATE TRIGGER trg_create_project_on_accept
AFTER UPDATE OF stage ON service_requests
FOR EACH ROW
WHEN (NEW.stage = 'ACCEPTED')
EXECUTE FUNCTION create_project_on_accept();

-- Verificação
SELECT
  (SELECT COUNT(*) FROM information_schema.triggers
   WHERE trigger_schema='public' AND trigger_name='trg_create_project_on_accept') AS trigger_count,
  (SELECT COUNT(*) FROM pg_proc p
   JOIN pg_namespace n ON p.pronamespace = n.oid
   WHERE n.nspname='public' AND p.proname IN (
     'create_project_on_accept',
     'map_service_slug_to_project_type',
     'map_service_slug_to_budget_type'
   )) AS functions_count;
