# SCHEMA ATUAL — Quantify Supabase
Gerado em: 2026-04-18T19:45:28.632Z

## Tabelas (27)
- agent_logs
- api_keys
- budget_items
- budgets
- companies
- composition_inputs
- compositions
- contracts
- disciplines
- documents
- partners
- payments
- projects
- proposals
- quotation_items
- quotations
- quote_line_items
- quotes
- request_files
- request_stages
- revisions
- service_orders
- service_pricing
- service_requests
- services
- users
- validations

## Enums (21)
- budget_type: PARAMETRIC,ANALYTICAL,HYBRID,ADDITIVE
- composition_input_type: LABOR,MATERIAL,EQUIPMENT,TRANSPORT,OTHER
- confidence_level: HIGH,MEDIUM,LOW
- construction_standard: baixo,normal,alto
- discipline_type: ARCHITECTURAL,STRUCTURAL,ELECTRICAL,HYDRAULIC,HVAC,FIRE_PROTECTION,TELECOM
- document_type: FLOOR_PLAN,MEMORIAL,SPREADSHEET,BIM_MODEL,TECHNICAL,OTHER
- file_kind: INPUT,DELIVERABLE,CONTRACT,RECEIPT
- item_origin: AI_GENERATED,MANUAL,IMPORTED,COMPOSITION
- payment_method: CARD,PIX,BOLETO
- payment_status: PENDING,AUTHORIZED,PROCESSING,PAID,FAILED,REFUNDED,CANCELLED
- price_base: SINAPI,SICRO,TCPO,OWN,MIXED
- project_status: STUDY,PRELIMINARY,EXECUTIVE,BIDDING,IN_PROGRESS,COMPLETED,ARCHIVED
- project_type: RESIDENTIAL,RESIDENTIAL_MULTI,COMMERCIAL,HOSPITAL,INDUSTRIAL,EDUCATIONAL,INFRASTRUCTURE,RENOVATION,OTHER
- proposal_status: DRAFT,SENT,ACCEPTED,REJECTED,EXPIRED,CANCELLED
- quotation_status: OPEN,CLOSED,AWARDED,CANCELLED
- request_stage: RECEIVED,QUOTING,COMPOSING,UNDER_REVIEW,VALIDATED,SENT,ACCEPTED,REJECTED,CANCELLED
- revision_status: REQUESTED,IN_PROGRESS,DELIVERED,ACCEPTED,REJECTED
- service_status: REQUESTED,QUOTED,APPROVED,PAID,IN_PROGRESS,DELIVERED,COMPLETED,CANCELLED
- service_type: ORCAMENTO_OBRA,ORCAMENTO_ELETRICA,ORCAMENTO_HIDRAULICA,ORCAMENTO_ESTRUTURAL,PROJETO_ARQUITETONICO,PROJETO_ELETRICO,PROJETO_HIDRAULICO,PROJETO_ESTRUTURAL,LAUDO_TECNICO,CONSULTORIA,OUTRO
- user_role: ADMIN,MANAGER,ENGINEER,ESTIMATOR,VIEWER,CLIENT
- validation_status: AI_DRAFT,IN_REVIEW,VALIDATED,REJECTED

## Colunas por tabela

### agent_logs
  - id uuid NOT NULL
  - request_id uuid
  - budget_id uuid
  - agent_name text NOT NULL
  - action text NOT NULL
  - status text NOT NULL
  - model text
  - input_tokens integer
  - output_tokens integer
  - cost_usd numeric
  - duration_ms integer
  - payload jsonb
  - error text
  - created_at timestamp with time zone NOT NULL

### api_keys
  - id uuid NOT NULL
  - name text NOT NULL
  - key text NOT NULL
  - company_id uuid NOT NULL
  - last_used_at timestamp with time zone
  - expires_at timestamp with time zone
  - is_active boolean NOT NULL
  - created_at timestamp with time zone NOT NULL

### budget_items
  - id uuid NOT NULL
  - code text
  - description text NOT NULL
  - unit text NOT NULL
  - quantity numeric NOT NULL
  - unit_cost numeric
  - total_cost numeric
  - confidence USER-DEFINED NOT NULL
  - origin USER-DEFINED NOT NULL
  - category text
  - subcategory text
  - notes text
  - budget_id uuid NOT NULL
  - composition_id uuid
  - created_by_id uuid
  - created_at timestamp with time zone NOT NULL
  - updated_at timestamp with time zone NOT NULL

### budgets
  - id uuid NOT NULL
  - name text NOT NULL
  - version integer NOT NULL
  - type USER-DEFINED NOT NULL
  - status USER-DEFINED NOT NULL
  - price_base USER-DEFINED NOT NULL
  - price_date date
  - bdi_percentage numeric
  - total_cost numeric
  - confidence numeric
  - project_id uuid NOT NULL
  - parent_id uuid
  - created_at timestamp with time zone NOT NULL
  - updated_at timestamp with time zone NOT NULL

### companies
  - id uuid NOT NULL
  - name text NOT NULL
  - cnpj text
  - logo text
  - state text
  - price_base USER-DEFINED NOT NULL
  - created_at timestamp with time zone NOT NULL
  - updated_at timestamp with time zone NOT NULL
  - stripe_customer_id text

### composition_inputs
  - id uuid NOT NULL
  - type USER-DEFINED NOT NULL
  - code text
  - description text NOT NULL
  - unit text NOT NULL
  - coefficient numeric NOT NULL
  - unit_price numeric NOT NULL
  - composition_id uuid NOT NULL

### compositions
  - id uuid NOT NULL
  - code text NOT NULL
  - description text NOT NULL
  - unit text NOT NULL
  - source USER-DEFINED NOT NULL
  - unit_cost numeric NOT NULL
  - labor_cost numeric
  - material_cost numeric
  - equipment_cost numeric
  - state text
  - reference_date date
  - company_id uuid
  - created_at timestamp with time zone NOT NULL

### contracts
  - id uuid NOT NULL
  - request_id uuid NOT NULL
  - code text NOT NULL
  - provider_company text NOT NULL
  - client_company_id uuid NOT NULL
  - scope text NOT NULL
  - total_amount numeric NOT NULL
  - payment_terms text
  - delivery_days integer
  - signed_at timestamp with time zone
  - signed_by_client_name text
  - status text NOT NULL
  - html_content text
  - created_at timestamp with time zone NOT NULL
  - updated_at timestamp with time zone NOT NULL

### disciplines
  - id uuid NOT NULL
  - type USER-DEFINED NOT NULL
  - status USER-DEFINED NOT NULL
  - project_id uuid NOT NULL
  - ai_data jsonb
  - engineer_data jsonb
  - created_at timestamp with time zone NOT NULL
  - updated_at timestamp with time zone NOT NULL

### documents
  - id uuid NOT NULL
  - name text NOT NULL
  - type USER-DEFINED NOT NULL
  - file_url text NOT NULL
  - file_size integer
  - mime_type text
  - project_id uuid NOT NULL
  - processed_at timestamp with time zone
  - ai_result jsonb
  - created_at timestamp with time zone NOT NULL

### partners
  - id uuid NOT NULL
  - name text NOT NULL
  - cnpj text
  - email text
  - phone text
  - specialties ARRAY
  - is_global boolean NOT NULL
  - company_id uuid
  - rating numeric
  - created_at timestamp with time zone NOT NULL
  - access_token text
  - token_expires_at timestamp with time zone

### payments
  - id uuid NOT NULL
  - request_id uuid NOT NULL
  - proposal_id uuid
  - company_id uuid NOT NULL
  - amount numeric NOT NULL
  - method USER-DEFINED NOT NULL
  - installments integer
  - status USER-DEFINED NOT NULL
  - mp_preference_id text
  - mp_payment_id text
  - mp_payment_method_id text
  - mp_qr_code text
  - mp_qr_code_base64 text
  - mp_ticket_url text
  - mp_raw jsonb
  - paid_at timestamp with time zone
  - failed_reason text
  - created_at timestamp with time zone NOT NULL
  - updated_at timestamp with time zone NOT NULL

### projects
  - id uuid NOT NULL
  - name text NOT NULL
  - type USER-DEFINED NOT NULL
  - status USER-DEFINED NOT NULL
  - description text
  - address text
  - city text
  - state text
  - total_area numeric
  - standard USER-DEFINED
  - client_name text
  - company_id uuid NOT NULL
  - created_at timestamp with time zone NOT NULL
  - updated_at timestamp with time zone NOT NULL

### proposals
  - id uuid NOT NULL
  - request_id uuid NOT NULL
  - company_id uuid NOT NULL
  - created_by uuid
  - estimated_price numeric
  - final_price numeric
  - breakdown jsonb
  - scope text
  - deliverables ARRAY
  - delivery_days integer
  - revisions_included integer
  - valid_until date
  - status USER-DEFINED NOT NULL
  - sent_at timestamp with time zone
  - responded_at timestamp with time zone
  - notes text
  - created_at timestamp with time zone NOT NULL
  - updated_at timestamp with time zone NOT NULL

### quotation_items
  - id uuid NOT NULL
  - description text NOT NULL
  - unit text NOT NULL
  - quantity numeric NOT NULL
  - budget_item_id uuid
  - quotation_id uuid NOT NULL

### quotations
  - id uuid NOT NULL
  - title text NOT NULL
  - status USER-DEFINED NOT NULL
  - deadline date
  - project_id uuid NOT NULL
  - created_at timestamp with time zone NOT NULL
  - updated_at timestamp with time zone NOT NULL

### quote_line_items
  - id uuid NOT NULL
  - unit_price numeric NOT NULL
  - total_price numeric
  - notes text
  - quote_id uuid NOT NULL
  - quotation_item_id uuid NOT NULL

### quotes
  - id uuid NOT NULL
  - partner_id uuid NOT NULL
  - quotation_id uuid NOT NULL
  - total_price numeric
  - payment_terms text
  - deadline text
  - notes text
  - file_url text
  - is_selected boolean NOT NULL
  - submitted_at timestamp with time zone NOT NULL

### request_files
  - id uuid NOT NULL
  - request_id uuid NOT NULL
  - company_id uuid NOT NULL
  - uploaded_by uuid
  - kind USER-DEFINED NOT NULL
  - filename text NOT NULL
  - storage_path text NOT NULL
  - mime_type text
  - size_bytes bigint
  - sha256 text
  - version integer
  - description text
  - created_at timestamp with time zone NOT NULL

### request_stages
  - id uuid NOT NULL
  - request_id uuid NOT NULL
  - from_stage USER-DEFINED
  - to_stage USER-DEFINED NOT NULL
  - actor_user_id uuid
  - notes text
  - created_at timestamp with time zone NOT NULL

### revisions
  - id uuid NOT NULL
  - request_id uuid NOT NULL
  - proposal_id uuid
  - requested_by uuid
  - revision_number integer NOT NULL
  - is_extra boolean NOT NULL
  - extra_price numeric
  - status USER-DEFINED NOT NULL
  - client_notes text
  - engineer_notes text
  - delivered_at timestamp with time zone
  - accepted_at timestamp with time zone
  - created_at timestamp with time zone NOT NULL
  - updated_at timestamp with time zone NOT NULL

### service_orders
  - id uuid NOT NULL
  - title text NOT NULL
  - type USER-DEFINED NOT NULL
  - status USER-DEFINED NOT NULL
  - description text
  - price numeric
  - stripe_payment_id text
  - company_id uuid NOT NULL
  - project_id uuid
  - delivery_notes text
  - quoted_at timestamp with time zone
  - paid_at timestamp with time zone
  - delivered_at timestamp with time zone
  - created_at timestamp with time zone NOT NULL
  - updated_at timestamp with time zone NOT NULL

### service_pricing
  - id uuid NOT NULL
  - service_id uuid NOT NULL
  - base_price numeric NOT NULL
  - unit text NOT NULL
  - min_price numeric
  - max_price numeric
  - multipliers jsonb NOT NULL
  - from_price_display text
  - created_at timestamp with time zone NOT NULL
  - updated_at timestamp with time zone NOT NULL

### service_requests
  - id uuid NOT NULL
  - code text NOT NULL
  - company_id uuid NOT NULL
  - requester_user_id uuid NOT NULL
  - service_id uuid NOT NULL
  - project_id uuid
  - budget_id uuid
  - title text NOT NULL
  - description text
  - project_type text
  - total_area numeric
  - standard text
  - city text
  - state text
  - deadline date
  - file_urls ARRAY
  - stage USER-DEFINED NOT NULL
  - estimated_price numeric
  - final_price numeric
  - rejection_reason text
  - created_at timestamp with time zone NOT NULL
  - updated_at timestamp with time zone NOT NULL

### services
  - id uuid NOT NULL
  - slug text NOT NULL
  - name text NOT NULL
  - short_description text NOT NULL
  - long_description text
  - icon text
  - base_price numeric
  - price_unit text
  - display_order integer NOT NULL
  - is_active boolean NOT NULL
  - created_at timestamp with time zone NOT NULL
  - updated_at timestamp with time zone NOT NULL

### users
  - id uuid NOT NULL
  - auth_id uuid
  - email text NOT NULL
  - name text NOT NULL
  - role USER-DEFINED NOT NULL
  - crea text
  - cau text
  - company_id uuid NOT NULL
  - created_at timestamp with time zone NOT NULL

### validations
  - id uuid NOT NULL
  - status USER-DEFINED NOT NULL
  - comment text
  - changes jsonb
  - confidence USER-DEFINED
  - reason text
  - suggestion text
  - item_type text
  - item_name text
  - validated_by uuid NOT NULL
  - budget_id uuid
  - discipline_id uuid
  - created_at timestamp with time zone NOT NULL

## Policies RLS (38)
- public.agent_logs / al_staff_all (ALL)
- public.budget_items / budget_items_company_isolation (ALL)
- public.budgets / budgets_company_isolation (ALL)
- public.companies / users_view_own_company (ALL)
- public.composition_inputs / composition_inputs_access (ALL)
- public.compositions / compositions_global_or_company (ALL)
- public.contracts / ct_select (SELECT)
- public.contracts / ct_staff_write (ALL)
- public.disciplines / disciplines_company_isolation (ALL)
- public.documents / documents_company_isolation (ALL)
- public.partners / partners_global_or_company (ALL)
- public.payments / payments_read (SELECT)
- public.payments / payments_staff_insert (INSERT)
- public.payments / payments_staff_update (UPDATE)
- public.projects / projects_company_isolation (ALL)
- public.proposals / proposals_read (SELECT)
- public.proposals / proposals_staff_all (INSERT)
- public.proposals / proposals_update (UPDATE)
- public.quotation_items / quotation_items_access (ALL)
- public.quotations / quotations_company_isolation (ALL)
- public.quote_line_items / quote_line_items_access (ALL)
- public.quotes / quotes_access (ALL)
- public.request_files / files_insert (INSERT)
- public.request_files / files_read (SELECT)
- public.request_stages / rs_insert_staff (INSERT)
- public.request_stages / rs_select (SELECT)
- public.revisions / revisions_insert (INSERT)
- public.revisions / revisions_read (SELECT)
- public.revisions / revisions_update (UPDATE)
- public.service_pricing / pricing_public_read (SELECT)
- public.service_pricing / pricing_staff_write (ALL)
- public.service_requests / sr_insert_authenticated (INSERT)
- public.service_requests / sr_select_own_or_staff (SELECT)
- public.service_requests / sr_update_staff (UPDATE)
- public.services / services_admin_write (ALL)
- public.services / services_select_all (SELECT)
- public.users / users_view_same_company (ALL)
- public.validations / validations_company_isolation (ALL)

## Triggers (10)
- budget_items.trg_budget_items_updated_at (BEFORE UPDATE)
- budgets.trg_budgets_updated_at (BEFORE UPDATE)
- companies.trg_companies_updated_at (BEFORE UPDATE)
- disciplines.trg_disciplines_updated_at (BEFORE UPDATE)
- payments.trg_payments_ts (BEFORE UPDATE)
- projects.trg_projects_updated_at (BEFORE UPDATE)
- proposals.trg_proposals_ts (BEFORE UPDATE)
- quotations.trg_quotations_updated_at (BEFORE UPDATE)
- revisions.trg_revisions_ts (BEFORE UPDATE)
- service_pricing.trg_service_pricing_ts (BEFORE UPDATE)
