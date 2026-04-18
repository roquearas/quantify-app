-- =====================================================
-- QUANTIFY — Migração 006: Pedidos de Serviço
-- Data: 2026-04-12
-- Modelo pay-per-service (cobrança por serviço prestado)
-- =====================================================

-- Enum de tipos de serviço
DO $$ BEGIN
  CREATE TYPE service_type AS ENUM (
    'ORCAMENTO_OBRA',
    'ORCAMENTO_ELETRICA',
    'ORCAMENTO_HIDRAULICA',
    'ORCAMENTO_ESTRUTURAL',
    'PROJETO_ARQUITETONICO',
    'PROJETO_ELETRICO',
    'PROJETO_HIDRAULICO',
    'PROJETO_ESTRUTURAL',
    'LAUDO_TECNICO',
    'CONSULTORIA',
    'OUTRO'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enum de status do pedido
DO $$ BEGIN
  CREATE TYPE service_status AS ENUM (
    'REQUESTED',
    'QUOTED',
    'APPROVED',
    'PAID',
    'IN_PROGRESS',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tabela de pedidos de serviço
CREATE TABLE IF NOT EXISTS service_orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  type             service_type NOT NULL,
  status           service_status NOT NULL DEFAULT 'REQUESTED',
  description      TEXT,
  price            DECIMAL(12, 2),
  stripe_payment_id TEXT UNIQUE,
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id       UUID REFERENCES projects(id) ON DELETE SET NULL,
  delivery_notes   TEXT,
  quoted_at        TIMESTAMPTZ,
  paid_at          TIMESTAMPTZ,
  delivered_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_orders_company ON service_orders (company_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders (status);
CREATE INDEX IF NOT EXISTS idx_service_orders_project ON service_orders (project_id);

-- Remover colunas de assinatura (legado)
ALTER TABLE companies DROP COLUMN IF EXISTS stripe_subscription_id;
ALTER TABLE companies DROP COLUMN IF EXISTS plan;
ALTER TABLE companies DROP COLUMN IF EXISTS plan_expires_at;
ALTER TABLE companies DROP COLUMN IF EXISTS credit_balance;
