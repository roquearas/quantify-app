-- =====================================================
-- QUANTIFY — Migração 003: Portal do Fornecedor
-- Data: 2026-04-12
-- =====================================================

-- Adicionar token de acesso para fornecedores
ALTER TABLE partners ADD COLUMN IF NOT EXISTS access_token TEXT UNIQUE;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

-- Índice para busca por token
CREATE INDEX IF NOT EXISTS idx_partners_access_token ON partners (access_token) WHERE access_token IS NOT NULL;
