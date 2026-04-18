-- =====================================================
-- QUANTIFY — Migração Inicial PostgreSQL/Supabase
-- Versão: 001
-- Data: 2026-04-12
-- =====================================================
-- Execute este script no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/rrfmfybklhlaoaxmhdyr/sql/new
-- =====================================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'ENGINEER', 'ESTIMATOR', 'VIEWER');
CREATE TYPE project_status AS ENUM ('STUDY', 'PRELIMINARY', 'EXECUTIVE', 'BIDDING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');
CREATE TYPE project_type AS ENUM ('RESIDENTIAL', 'RESIDENTIAL_MULTI', 'COMMERCIAL', 'HOSPITAL', 'INDUSTRIAL', 'EDUCATIONAL', 'INFRASTRUCTURE', 'RENOVATION', 'OTHER');
CREATE TYPE budget_type AS ENUM ('PARAMETRIC', 'ANALYTICAL', 'HYBRID', 'ADDITIVE');
CREATE TYPE validation_status AS ENUM ('AI_DRAFT', 'IN_REVIEW', 'VALIDATED', 'REJECTED');
CREATE TYPE price_base AS ENUM ('SINAPI', 'SICRO', 'TCPO', 'OWN', 'MIXED');
CREATE TYPE confidence_level AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE item_origin AS ENUM ('AI_GENERATED', 'MANUAL', 'IMPORTED', 'COMPOSITION');
CREATE TYPE document_type AS ENUM ('FLOOR_PLAN', 'MEMORIAL', 'SPREADSHEET', 'BIM_MODEL', 'TECHNICAL', 'OTHER');
CREATE TYPE discipline_type AS ENUM ('ARCHITECTURAL', 'STRUCTURAL', 'ELECTRICAL', 'HYDRAULIC', 'HVAC', 'FIRE_PROTECTION', 'TELECOM');
CREATE TYPE quotation_status AS ENUM ('OPEN', 'CLOSED', 'AWARDED', 'CANCELLED');
CREATE TYPE composition_input_type AS ENUM ('LABOR', 'MATERIAL', 'EQUIPMENT', 'TRANSPORT', 'OTHER');
CREATE TYPE construction_standard AS ENUM ('baixo', 'normal', 'alto');

-- =====================================================
-- TABELAS
-- =====================================================

-- EMPRESAS (tenant principal)
CREATE TABLE companies (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  cnpj       TEXT UNIQUE,
  logo       TEXT,
  state      TEXT,
  price_base price_base NOT NULL DEFAULT 'SINAPI',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- USUÁRIOS
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id    UUID UNIQUE,  -- FK para auth.users (Supabase Auth)
  email      TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  role       user_role NOT NULL DEFAULT 'ESTIMATOR',
  crea       TEXT,
  cau        TEXT,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PARCEIROS / FORNECEDORES
CREATE TABLE partners (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  cnpj        TEXT,
  email       TEXT,
  phone       TEXT,
  specialties TEXT[] NOT NULL DEFAULT '{}',
  is_global   BOOLEAN NOT NULL DEFAULT false,
  company_id  UUID REFERENCES companies(id) ON DELETE SET NULL,
  rating      DECIMAL(3,2),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PROJETOS
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  type        project_type NOT NULL,
  status      project_status NOT NULL DEFAULT 'STUDY',
  description TEXT,
  address     TEXT,
  city        TEXT,
  state       TEXT,
  total_area  DECIMAL(12,2),
  standard    construction_standard,
  client_name TEXT,
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DOCUMENTOS
CREATE TABLE documents (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  type         document_type NOT NULL DEFAULT 'OTHER',
  file_url     TEXT NOT NULL,
  file_size    INTEGER,
  mime_type    TEXT,
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  processed_at TIMESTAMPTZ,
  ai_result    JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DISCIPLINAS
CREATE TABLE disciplines (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type          discipline_type NOT NULL,
  status        validation_status NOT NULL DEFAULT 'AI_DRAFT',
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  ai_data       JSONB,
  engineer_data JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- COMPOSIÇÕES (base de preços)
CREATE TABLE compositions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code           TEXT NOT NULL,
  description    TEXT NOT NULL,
  unit           TEXT NOT NULL,
  source         price_base NOT NULL,
  unit_cost      DECIMAL(12,4) NOT NULL,
  labor_cost     DECIMAL(12,4),
  material_cost  DECIMAL(12,4),
  equipment_cost DECIMAL(12,4),
  state          TEXT,
  reference_date DATE,
  company_id     UUID REFERENCES companies(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INSUMOS DAS COMPOSIÇÕES
CREATE TABLE composition_inputs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type           composition_input_type NOT NULL,
  code           TEXT,
  description    TEXT NOT NULL,
  unit           TEXT NOT NULL,
  coefficient    DECIMAL(12,6) NOT NULL,
  unit_price     DECIMAL(12,4) NOT NULL,
  composition_id UUID NOT NULL REFERENCES compositions(id) ON DELETE CASCADE
);

-- ORÇAMENTOS
CREATE TABLE budgets (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  version        INTEGER NOT NULL DEFAULT 1,
  type           budget_type NOT NULL,
  status         validation_status NOT NULL DEFAULT 'AI_DRAFT',
  price_base     price_base NOT NULL DEFAULT 'SINAPI',
  price_date     DATE,
  bdi_percentage DECIMAL(5,2),
  total_cost     DECIMAL(14,2),
  confidence     DECIMAL(5,2),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id      UUID REFERENCES budgets(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ITENS DO ORÇAMENTO
CREATE TABLE budget_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code           TEXT,
  description    TEXT NOT NULL,
  unit           TEXT NOT NULL,
  quantity       DECIMAL(12,4) NOT NULL,
  unit_cost      DECIMAL(12,4),
  total_cost     DECIMAL(14,2),
  confidence     confidence_level NOT NULL DEFAULT 'MEDIUM',
  origin         item_origin NOT NULL DEFAULT 'AI_GENERATED',
  category       TEXT,
  subcategory    TEXT,
  notes          TEXT,
  budget_id      UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  composition_id UUID REFERENCES compositions(id) ON DELETE SET NULL,
  created_by_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- COTAÇÕES
CREATE TABLE quotations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title      TEXT NOT NULL,
  status     quotation_status NOT NULL DEFAULT 'OPEN',
  deadline   DATE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ITENS DA COTAÇÃO
CREATE TABLE quotation_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description    TEXT NOT NULL,
  unit           TEXT NOT NULL,
  quantity       DECIMAL(12,4) NOT NULL,
  budget_item_id UUID REFERENCES budget_items(id) ON DELETE SET NULL,
  quotation_id   UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE
);

-- PROPOSTAS (de parceiros)
CREATE TABLE quotes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id    UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  quotation_id  UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  total_price   DECIMAL(14,2),
  payment_terms TEXT,
  deadline      TEXT,
  notes         TEXT,
  file_url      TEXT,
  is_selected   BOOLEAN NOT NULL DEFAULT false,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ITENS DAS PROPOSTAS
CREATE TABLE quote_line_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_price        DECIMAL(12,4) NOT NULL,
  total_price       DECIMAL(14,2),
  notes             TEXT,
  quote_id          UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  quotation_item_id UUID NOT NULL REFERENCES quotation_items(id) ON DELETE CASCADE
);

-- VALIDAÇÕES (human-in-the-loop)
CREATE TABLE validations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status        validation_status NOT NULL,
  comment       TEXT,
  changes       JSONB,
  confidence    confidence_level,
  reason        TEXT,
  suggestion    TEXT,
  item_type     TEXT,
  item_name     TEXT,
  validated_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  budget_id     UUID REFERENCES budgets(id) ON DELETE CASCADE,
  discipline_id UUID REFERENCES disciplines(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_auth ON users(auth_id);
CREATE INDEX idx_projects_company ON projects(company_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_disciplines_project ON disciplines(project_id);
CREATE INDEX idx_budgets_project ON budgets(project_id);
CREATE INDEX idx_budget_items_budget ON budget_items(budget_id);
CREATE INDEX idx_budget_items_category ON budget_items(category);
CREATE INDEX idx_compositions_code ON compositions(code);
CREATE INDEX idx_compositions_source ON compositions(source);
CREATE INDEX idx_quotations_project ON quotations(project_id);
CREATE INDEX idx_quotes_quotation ON quotes(quotation_id);
CREATE INDEX idx_quotes_partner ON quotes(partner_id);
CREATE INDEX idx_validations_budget ON validations(budget_id);
CREATE INDEX idx_validations_user ON validations(validated_by);

-- =====================================================
-- TRIGGER: updated_at automático
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_disciplines_updated_at BEFORE UPDATE ON disciplines FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_budget_items_updated_at BEFORE UPDATE ON budget_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_quotations_updated_at BEFORE UPDATE ON quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

-- Função auxiliar: obtém company_id do usuário autenticado
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM users WHERE auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Ativar RLS em todas as tabelas de dados
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE composition_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE validations ENABLE ROW LEVEL SECURITY;

-- Políticas: cada empresa só vê seus dados
CREATE POLICY company_isolation ON companies FOR ALL USING (id = get_user_company_id());
CREATE POLICY user_isolation ON users FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY project_isolation ON projects FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY partner_isolation ON partners FOR ALL USING (company_id = get_user_company_id() OR is_global = true);

-- Tabelas filhas: isoladas via JOIN com a tabela pai
CREATE POLICY document_isolation ON documents FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE company_id = get_user_company_id())
);
CREATE POLICY discipline_isolation ON disciplines FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE company_id = get_user_company_id())
);
CREATE POLICY budget_isolation ON budgets FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE company_id = get_user_company_id())
);
CREATE POLICY budget_item_isolation ON budget_items FOR ALL USING (
  budget_id IN (SELECT b.id FROM budgets b JOIN projects p ON b.project_id = p.id WHERE p.company_id = get_user_company_id())
);
CREATE POLICY composition_isolation ON compositions FOR ALL USING (
  company_id = get_user_company_id() OR company_id IS NULL
);
CREATE POLICY composition_input_isolation ON composition_inputs FOR ALL USING (
  composition_id IN (SELECT id FROM compositions WHERE company_id = get_user_company_id() OR company_id IS NULL)
);
CREATE POLICY quotation_isolation ON quotations FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE company_id = get_user_company_id())
);
CREATE POLICY quotation_item_isolation ON quotation_items FOR ALL USING (
  quotation_id IN (SELECT id FROM quotations WHERE project_id IN (SELECT id FROM projects WHERE company_id = get_user_company_id()))
);
CREATE POLICY quote_isolation ON quotes FOR ALL USING (
  quotation_id IN (SELECT id FROM quotations WHERE project_id IN (SELECT id FROM projects WHERE company_id = get_user_company_id()))
);
CREATE POLICY quote_line_item_isolation ON quote_line_items FOR ALL USING (
  quote_id IN (SELECT q.id FROM quotes q JOIN quotations qt ON q.quotation_id = qt.id JOIN projects p ON qt.project_id = p.id WHERE p.company_id = get_user_company_id())
);
CREATE POLICY validation_isolation ON validations FOR ALL USING (
  validated_by IN (SELECT id FROM users WHERE company_id = get_user_company_id())
);

-- =====================================================
-- DADOS INICIAIS (Seed)
-- =====================================================

-- Empresa demo
INSERT INTO companies (id, name, cnpj, state, price_base)
VALUES ('aa000000-0000-0000-0000-000000000001', 'MPD Engenharia', '12.345.678/0001-90', 'RJ', 'SINAPI');

-- Usuário admin (auth_id será preenchido após primeiro login)
INSERT INTO users (id, email, name, role, company_id)
VALUES ('ab000000-0000-0000-0000-000000000001', 'admin@quantify.com.br', 'Administrador', 'ADMIN', 'aa000000-0000-0000-0000-000000000001');

-- Parceiro exemplo
INSERT INTO partners (id, name, email, specialties, is_global, rating)
VALUES ('ac000000-0000-0000-0000-000000000001', 'Construtora Exemplo', 'contato@exemplo.com', ARRAY['Estrutural', 'Fundações'], true, 4.50);

-- Projeto exemplo
INSERT INTO projects (id, name, type, status, city, state, total_area, client_name, company_id)
VALUES ('ad000000-0000-0000-0000-000000000001', 'Residencial Vila Nova', 'RESIDENTIAL_MULTI', 'EXECUTIVE', 'Rio de Janeiro', 'RJ', 12500.00, 'Incorporadora ABC', 'aa000000-0000-0000-0000-000000000001');

-- Orçamento exemplo
INSERT INTO budgets (id, name, type, status, price_base, bdi_percentage, total_cost, confidence, project_id)
VALUES ('ae000000-0000-0000-0000-000000000001', 'Orçamento Executivo v1', 'ANALYTICAL', 'IN_REVIEW', 'SINAPI', 25.00, 8750000.00, 82.50, 'ad000000-0000-0000-0000-000000000001');

-- Itens do orçamento exemplo
INSERT INTO budget_items (budget_id, code, description, unit, quantity, unit_cost, total_cost, confidence, origin, category) VALUES
('ae000000-0000-0000-0000-000000000001', '74209/001', 'Concreto fck=30 MPa', 'm3', 1250.0000, 485.0000, 606250.00, 'HIGH', 'IMPORTED', 'Estrutura'),
('ae000000-0000-0000-0000-000000000001', '73964/004', 'Aço CA-50 cortado e dobrado', 'kg', 187500.0000, 8.5000, 1593750.00, 'HIGH', 'IMPORTED', 'Estrutura'),
('ae000000-0000-0000-0000-000000000001', '87878', 'Alvenaria bloco cerâmico 14x19x39', 'm2', 8500.0000, 62.5000, 531250.00, 'MEDIUM', 'AI_GENERATED', 'Alvenaria'),
('ae000000-0000-0000-0000-000000000001', '87879', 'Chapisco interno', 'm2', 17000.0000, 5.8000, 98600.00, 'MEDIUM', 'AI_GENERATED', 'Revestimento'),
('ae000000-0000-0000-0000-000000000001', '87882', 'Reboco interno', 'm2', 17000.0000, 28.5000, 484500.00, 'MEDIUM', 'AI_GENERATED', 'Revestimento'),
('ae000000-0000-0000-0000-000000000001', '89957', 'Instalações elétricas (estimativa)', 'vb', 1.0000, 950000.0000, 950000.00, 'LOW', 'AI_GENERATED', 'Elétrica'),
('ae000000-0000-0000-0000-000000000001', '89711', 'Instalações hidráulicas (estimativa)', 'vb', 1.0000, 680000.0000, 680000.00, 'LOW', 'AI_GENERATED', 'Hidráulica');

-- Disciplinas exemplo
INSERT INTO disciplines (project_id, type, status) VALUES
('ad000000-0000-0000-0000-000000000001', 'STRUCTURAL', 'VALIDATED'),
('ad000000-0000-0000-0000-000000000001', 'ELECTRICAL', 'IN_REVIEW'),
('ad000000-0000-0000-0000-000000000001', 'HYDRAULIC', 'AI_DRAFT');

SELECT 'Migração concluída com sucesso!' AS resultado;
