-- 009_sinapi_schema.sql
-- Fase 2A: Schema SINAPI (insumos + composições + log de importação)
-- Referência: https://www.caixa.gov.br/poder-publico/modernizacao-gestao/sinapi/
--
-- Decisões:
-- - Leitura pública (qualquer empresa consulta SINAPI)
-- - Escrita restrita a users com is_super_admin=true (fora do tenant)
-- - Multi-estado e histórico: chave = (codigo, estado, mes_referencia, desonerado)
-- - Snapshot de composição guarda insumos em JSONB (evita join pesado)

-- =============================================================================
-- 1. Flag super_admin (users)
-- =============================================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN users.is_super_admin IS
  'Super-admin Quantify (não-tenant). Usado para importar SINAPI e outras ações globais.';

-- =============================================================================
-- 2. sinapi_insumo — insumos brutos (materiais, mão de obra, equipamento)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sinapi_insumo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL,
  descricao text NOT NULL,
  unidade text NOT NULL,
  categoria text,
  preco_unitario numeric(14,4) NOT NULL CHECK (preco_unitario >= 0),
  estado text NOT NULL,
  mes_referencia date NOT NULL,
  desonerado boolean NOT NULL,
  origem_arquivo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (codigo, estado, mes_referencia, desonerado)
);

CREATE INDEX IF NOT EXISTS idx_sinapi_insumo_lookup
  ON sinapi_insumo (estado, mes_referencia, desonerado, codigo);

CREATE INDEX IF NOT EXISTS idx_sinapi_insumo_descricao_trgm
  ON sinapi_insumo USING gin (descricao gin_trgm_ops);

-- =============================================================================
-- 3. sinapi_composicao — receitas (m² alvenaria, h-máquina, etc)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sinapi_composicao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL,
  descricao text NOT NULL,
  unidade text NOT NULL,
  grupo text,
  preco_unitario numeric(14,4) NOT NULL CHECK (preco_unitario >= 0),
  estado text NOT NULL,
  mes_referencia date NOT NULL,
  desonerado boolean NOT NULL,
  insumos_jsonb jsonb NOT NULL DEFAULT '[]'::jsonb,
  origem_arquivo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (codigo, estado, mes_referencia, desonerado)
);

CREATE INDEX IF NOT EXISTS idx_sinapi_composicao_lookup
  ON sinapi_composicao (estado, mes_referencia, desonerado, codigo);

CREATE INDEX IF NOT EXISTS idx_sinapi_composicao_descricao_trgm
  ON sinapi_composicao USING gin (descricao gin_trgm_ops);

-- =============================================================================
-- 4. sinapi_import_log — histórico de importações
-- =============================================================================
CREATE TABLE IF NOT EXISTS sinapi_import_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imported_by uuid REFERENCES users(id),
  estado text NOT NULL,
  mes_referencia date NOT NULL,
  desonerado boolean NOT NULL,
  arquivo_nome text NOT NULL,
  arquivo_sha256 text,
  insumos_inserted int NOT NULL DEFAULT 0,
  insumos_updated int NOT NULL DEFAULT 0,
  composicoes_inserted int NOT NULL DEFAULT 0,
  composicoes_updated int NOT NULL DEFAULT 0,
  erros_jsonb jsonb NOT NULL DEFAULT '[]'::jsonb,
  duracao_ms int,
  status text NOT NULL CHECK (status IN ('RUNNING', 'OK', 'ERROR')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sinapi_import_log_created
  ON sinapi_import_log (created_at DESC);

-- =============================================================================
-- 5. pg_trgm extension (para busca fuzzy)
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- 6. RLS — leitura pública, escrita super_admin
-- =============================================================================
ALTER TABLE sinapi_insumo ENABLE ROW LEVEL SECURITY;
ALTER TABLE sinapi_composicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE sinapi_import_log ENABLE ROW LEVEL SECURITY;

-- insumo: read-all authenticated
DROP POLICY IF EXISTS sinapi_insumo_read ON sinapi_insumo;
CREATE POLICY sinapi_insumo_read ON sinapi_insumo
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS sinapi_insumo_write ON sinapi_insumo;
CREATE POLICY sinapi_insumo_write ON sinapi_insumo
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true)
  );

-- composicao: read-all authenticated
DROP POLICY IF EXISTS sinapi_composicao_read ON sinapi_composicao;
CREATE POLICY sinapi_composicao_read ON sinapi_composicao
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS sinapi_composicao_write ON sinapi_composicao;
CREATE POLICY sinapi_composicao_write ON sinapi_composicao
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true)
  );

-- log: super_admin vê todos, demais não veem nada
DROP POLICY IF EXISTS sinapi_import_log_read ON sinapi_import_log;
CREATE POLICY sinapi_import_log_read ON sinapi_import_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true)
  );

DROP POLICY IF EXISTS sinapi_import_log_write ON sinapi_import_log;
CREATE POLICY sinapi_import_log_write ON sinapi_import_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true)
  );

-- =============================================================================
-- 7. Triggers de updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sinapi_insumo_updated ON sinapi_insumo;
CREATE TRIGGER trg_sinapi_insumo_updated
  BEFORE UPDATE ON sinapi_insumo
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

DROP TRIGGER IF EXISTS trg_sinapi_composicao_updated ON sinapi_composicao;
CREATE TRIGGER trg_sinapi_composicao_updated
  BEFORE UPDATE ON sinapi_composicao
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
