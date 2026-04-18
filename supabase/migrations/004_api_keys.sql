-- =====================================================
-- QUANTIFY — Migração 005: API Keys
-- Data: 2026-04-12
-- =====================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  key         TEXT NOT NULL UNIQUE,
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  last_used_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys (key) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_company ON api_keys (company_id);
