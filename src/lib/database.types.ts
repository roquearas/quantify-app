export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_logs: {
        Row: {
          action: string
          agent_name: string
          budget_id: string | null
          cost_usd: number | null
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          input_tokens: number | null
          model: string | null
          output_tokens: number | null
          payload: Json | null
          request_id: string | null
          status: string
        }
        Insert: {
          action: string
          agent_name: string
          budget_id?: string | null
          cost_usd?: number | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          payload?: Json | null
          request_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          agent_name?: string
          budget_id?: string | null
          cost_usd?: number | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          payload?: Json | null
          request_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_logs_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_logs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          company_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key: string
          last_used_at: string | null
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key: string
          last_used_at?: string | null
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key?: string
          last_used_at?: string | null
          name?: string
        }
        Relationships: []
      }
      budget_items: {
        Row: {
          bdi_override_percent: number | null
          budget_id: string
          category: string | null
          code: string | null
          composition_id: string | null
          confidence: Database["public"]["Enums"]["confidence_level"]
          created_at: string
          created_by_id: string | null
          description: string
          id: string
          notes: string | null
          origem: Database["public"]["Enums"]["budget_item_origem"]
          origin: Database["public"]["Enums"]["item_origin"]
          quantity: number
          sinapi_codigo: string | null
          sinapi_composicao_id: string | null
          sinapi_insumo_id: string | null
          sinapi_mes_referencia: string | null
          sinapi_snapshot_jsonb: Json | null
          subcategory: string | null
          total_cost: number | null
          unit: string
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          bdi_override_percent?: number | null
          budget_id: string
          category?: string | null
          code?: string | null
          composition_id?: string | null
          confidence?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string
          created_by_id?: string | null
          description: string
          id?: string
          notes?: string | null
          origem?: Database["public"]["Enums"]["budget_item_origem"]
          origin?: Database["public"]["Enums"]["item_origin"]
          quantity: number
          sinapi_codigo?: string | null
          sinapi_composicao_id?: string | null
          sinapi_insumo_id?: string | null
          sinapi_mes_referencia?: string | null
          sinapi_snapshot_jsonb?: Json | null
          subcategory?: string | null
          total_cost?: number | null
          unit: string
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          bdi_override_percent?: number | null
          budget_id?: string
          category?: string | null
          code?: string | null
          composition_id?: string | null
          confidence?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string
          created_by_id?: string | null
          description?: string
          id?: string
          notes?: string | null
          origem?: Database["public"]["Enums"]["budget_item_origem"]
          origin?: Database["public"]["Enums"]["item_origin"]
          quantity?: number
          sinapi_codigo?: string | null
          sinapi_composicao_id?: string | null
          sinapi_insumo_id?: string | null
          sinapi_mes_referencia?: string | null
          sinapi_snapshot_jsonb?: Json | null
          subcategory?: string | null
          total_cost?: number | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_composition_id_fkey"
            columns: ["composition_id"]
            isOneToOne: false
            referencedRelation: "compositions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_sinapi_composicao_id_fkey"
            columns: ["sinapi_composicao_id"]
            isOneToOne: false
            referencedRelation: "sinapi_composicao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_sinapi_insumo_id_fkey"
            columns: ["sinapi_insumo_id"]
            isOneToOne: false
            referencedRelation: "sinapi_insumo"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          bdi_percentage: number | null
          confidence: number | null
          created_at: string
          id: string
          name: string
          parent_id: string | null
          price_base: Database["public"]["Enums"]["price_base"]
          price_date: string | null
          project_id: string
          status: Database["public"]["Enums"]["validation_status"]
          total_cost: number | null
          type: Database["public"]["Enums"]["budget_type"]
          updated_at: string
          version: number
        }
        Insert: {
          bdi_percentage?: number | null
          confidence?: number | null
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          price_base?: Database["public"]["Enums"]["price_base"]
          price_date?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["validation_status"]
          total_cost?: number | null
          type: Database["public"]["Enums"]["budget_type"]
          updated_at?: string
          version?: number
        }
        Update: {
          bdi_percentage?: number | null
          confidence?: number | null
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          price_base?: Database["public"]["Enums"]["price_base"]
          price_date?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["validation_status"]
          total_cost?: number | null
          type?: Database["public"]["Enums"]["budget_type"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cnpj: string | null
          created_at: string
          id: string
          logo: string | null
          name: string
          price_base: Database["public"]["Enums"]["price_base"]
          state: string | null
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          id?: string
          logo?: string | null
          name: string
          price_base?: Database["public"]["Enums"]["price_base"]
          state?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          id?: string
          logo?: string | null
          name?: string
          price_base?: Database["public"]["Enums"]["price_base"]
          state?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      composition_inputs: {
        Row: {
          code: string | null
          coefficient: number
          composition_id: string
          description: string
          id: string
          type: Database["public"]["Enums"]["composition_input_type"]
          unit: string
          unit_price: number
        }
        Insert: {
          code?: string | null
          coefficient: number
          composition_id: string
          description: string
          id?: string
          type: Database["public"]["Enums"]["composition_input_type"]
          unit: string
          unit_price: number
        }
        Update: {
          code?: string | null
          coefficient?: number
          composition_id?: string
          description?: string
          id?: string
          type?: Database["public"]["Enums"]["composition_input_type"]
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "composition_inputs_composition_id_fkey"
            columns: ["composition_id"]
            isOneToOne: false
            referencedRelation: "compositions"
            referencedColumns: ["id"]
          },
        ]
      }
      compositions: {
        Row: {
          code: string
          company_id: string | null
          created_at: string
          description: string
          equipment_cost: number | null
          id: string
          labor_cost: number | null
          material_cost: number | null
          reference_date: string | null
          source: Database["public"]["Enums"]["price_base"]
          state: string | null
          unit: string
          unit_cost: number
        }
        Insert: {
          code: string
          company_id?: string | null
          created_at?: string
          description: string
          equipment_cost?: number | null
          id?: string
          labor_cost?: number | null
          material_cost?: number | null
          reference_date?: string | null
          source: Database["public"]["Enums"]["price_base"]
          state?: string | null
          unit: string
          unit_cost: number
        }
        Update: {
          code?: string
          company_id?: string | null
          created_at?: string
          description?: string
          equipment_cost?: number | null
          id?: string
          labor_cost?: number | null
          material_cost?: number | null
          reference_date?: string | null
          source?: Database["public"]["Enums"]["price_base"]
          state?: string | null
          unit?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "compositions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_company_id: string
          code: string
          created_at: string
          delivery_days: number | null
          html_content: string | null
          id: string
          payment_terms: string | null
          provider_company: string
          request_id: string
          scope: string
          signed_at: string | null
          signed_by_client_name: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          client_company_id: string
          code: string
          created_at?: string
          delivery_days?: number | null
          html_content?: string | null
          id?: string
          payment_terms?: string | null
          provider_company?: string
          request_id: string
          scope: string
          signed_at?: string | null
          signed_by_client_name?: string | null
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          client_company_id?: string
          code?: string
          created_at?: string
          delivery_days?: number | null
          html_content?: string | null
          id?: string
          payment_terms?: string | null
          provider_company?: string
          request_id?: string
          scope?: string
          signed_at?: string | null
          signed_by_client_name?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_company_id_fkey"
            columns: ["client_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplines: {
        Row: {
          ai_data: Json | null
          created_at: string
          engineer_data: Json | null
          id: string
          project_id: string
          status: Database["public"]["Enums"]["validation_status"]
          type: Database["public"]["Enums"]["discipline_type"]
          updated_at: string
        }
        Insert: {
          ai_data?: Json | null
          created_at?: string
          engineer_data?: Json | null
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["validation_status"]
          type: Database["public"]["Enums"]["discipline_type"]
          updated_at?: string
        }
        Update: {
          ai_data?: Json | null
          created_at?: string
          engineer_data?: Json | null
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["validation_status"]
          type?: Database["public"]["Enums"]["discipline_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disciplines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ai_result: Json | null
          created_at: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          name: string
          processed_at: string | null
          project_id: string
          type: Database["public"]["Enums"]["document_type"]
        }
        Insert: {
          ai_result?: Json | null
          created_at?: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          name: string
          processed_at?: string | null
          project_id: string
          type?: Database["public"]["Enums"]["document_type"]
        }
        Update: {
          ai_result?: Json | null
          created_at?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          name?: string
          processed_at?: string | null
          project_id?: string
          type?: Database["public"]["Enums"]["document_type"]
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          access_token: string | null
          cnpj: string | null
          company_id: string | null
          created_at: string
          email: string | null
          id: string
          is_global: boolean
          name: string
          phone: string | null
          rating: number | null
          specialties: string[] | null
          token_expires_at: string | null
        }
        Insert: {
          access_token?: string | null
          cnpj?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_global?: boolean
          name: string
          phone?: string | null
          rating?: number | null
          specialties?: string[] | null
          token_expires_at?: string | null
        }
        Update: {
          access_token?: string | null
          cnpj?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_global?: boolean
          name?: string
          phone?: string | null
          rating?: number | null
          specialties?: string[] | null
          token_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          failed_reason: string | null
          id: string
          installments: number | null
          method: Database["public"]["Enums"]["payment_method"]
          mp_payment_id: string | null
          mp_payment_method_id: string | null
          mp_preference_id: string | null
          mp_qr_code: string | null
          mp_qr_code_base64: string | null
          mp_raw: Json | null
          mp_ticket_url: string | null
          paid_at: string | null
          proposal_id: string | null
          request_id: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          failed_reason?: string | null
          id?: string
          installments?: number | null
          method: Database["public"]["Enums"]["payment_method"]
          mp_payment_id?: string | null
          mp_payment_method_id?: string | null
          mp_preference_id?: string | null
          mp_qr_code?: string | null
          mp_qr_code_base64?: string | null
          mp_raw?: Json | null
          mp_ticket_url?: string | null
          paid_at?: string | null
          proposal_id?: string | null
          request_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          failed_reason?: string | null
          id?: string
          installments?: number | null
          method?: Database["public"]["Enums"]["payment_method"]
          mp_payment_id?: string | null
          mp_payment_method_id?: string | null
          mp_preference_id?: string | null
          mp_qr_code?: string | null
          mp_qr_code_base64?: string | null
          mp_raw?: Json | null
          mp_ticket_url?: string | null
          paid_at?: string | null
          proposal_id?: string | null
          request_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          city: string | null
          client_name: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          standard: Database["public"]["Enums"]["construction_standard"] | null
          state: string | null
          status: Database["public"]["Enums"]["project_status"]
          total_area: number | null
          type: Database["public"]["Enums"]["project_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          client_name?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          standard?: Database["public"]["Enums"]["construction_standard"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          total_area?: number | null
          type: Database["public"]["Enums"]["project_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          client_name?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          standard?: Database["public"]["Enums"]["construction_standard"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          total_area?: number | null
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          breakdown: Json | null
          company_id: string
          created_at: string
          created_by: string | null
          deliverables: string[] | null
          delivery_days: number | null
          estimated_price: number | null
          final_price: number | null
          id: string
          notes: string | null
          request_id: string
          responded_at: string | null
          revisions_included: number | null
          scope: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          breakdown?: Json | null
          company_id: string
          created_at?: string
          created_by?: string | null
          deliverables?: string[] | null
          delivery_days?: number | null
          estimated_price?: number | null
          final_price?: number | null
          id?: string
          notes?: string | null
          request_id: string
          responded_at?: string | null
          revisions_included?: number | null
          scope?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          breakdown?: Json | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          deliverables?: string[] | null
          delivery_days?: number | null
          estimated_price?: number | null
          final_price?: number | null
          id?: string
          notes?: string | null
          request_id?: string
          responded_at?: string | null
          revisions_included?: number | null
          scope?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          budget_item_id: string | null
          description: string
          id: string
          quantity: number
          quotation_id: string
          unit: string
        }
        Insert: {
          budget_item_id?: string | null
          description: string
          id?: string
          quantity: number
          quotation_id: string
          unit: string
        }
        Update: {
          budget_item_id?: string | null
          description?: string
          id?: string
          quantity?: number
          quotation_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_budget_item_id_fkey"
            columns: ["budget_item_id"]
            isOneToOne: false
            referencedRelation: "budget_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          created_at: string
          deadline: string | null
          id: string
          project_id: string
          status: Database["public"]["Enums"]["quotation_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["quotation_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["quotation_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_line_items: {
        Row: {
          id: string
          notes: string | null
          quotation_item_id: string
          quote_id: string
          total_price: number | null
          unit_price: number
        }
        Insert: {
          id?: string
          notes?: string | null
          quotation_item_id: string
          quote_id: string
          total_price?: number | null
          unit_price: number
        }
        Update: {
          id?: string
          notes?: string | null
          quotation_item_id?: string
          quote_id?: string
          total_price?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_items_quotation_item_id_fkey"
            columns: ["quotation_item_id"]
            isOneToOne: false
            referencedRelation: "quotation_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          deadline: string | null
          file_url: string | null
          id: string
          is_selected: boolean
          notes: string | null
          partner_id: string
          payment_terms: string | null
          quotation_id: string
          submitted_at: string
          total_price: number | null
        }
        Insert: {
          deadline?: string | null
          file_url?: string | null
          id?: string
          is_selected?: boolean
          notes?: string | null
          partner_id: string
          payment_terms?: string | null
          quotation_id: string
          submitted_at?: string
          total_price?: number | null
        }
        Update: {
          deadline?: string | null
          file_url?: string | null
          id?: string
          is_selected?: boolean
          notes?: string | null
          partner_id?: string
          payment_terms?: string | null
          quotation_id?: string
          submitted_at?: string
          total_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      request_files: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          filename: string
          id: string
          kind: Database["public"]["Enums"]["file_kind"]
          mime_type: string | null
          request_id: string
          sha256: string | null
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
          version: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          filename: string
          id?: string
          kind: Database["public"]["Enums"]["file_kind"]
          mime_type?: string | null
          request_id: string
          sha256?: string | null
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
          version?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          filename?: string
          id?: string
          kind?: Database["public"]["Enums"]["file_kind"]
          mime_type?: string | null
          request_id?: string
          sha256?: string | null
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "request_files_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_files_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      request_stages: {
        Row: {
          actor_user_id: string | null
          created_at: string
          from_stage: Database["public"]["Enums"]["request_stage"] | null
          id: string
          notes: string | null
          request_id: string
          to_stage: Database["public"]["Enums"]["request_stage"]
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          from_stage?: Database["public"]["Enums"]["request_stage"] | null
          id?: string
          notes?: string | null
          request_id: string
          to_stage: Database["public"]["Enums"]["request_stage"]
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          from_stage?: Database["public"]["Enums"]["request_stage"] | null
          id?: string
          notes?: string | null
          request_id?: string
          to_stage?: Database["public"]["Enums"]["request_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "request_stages_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_stages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      revisions: {
        Row: {
          accepted_at: string | null
          client_notes: string | null
          created_at: string
          delivered_at: string | null
          engineer_notes: string | null
          extra_price: number | null
          id: string
          is_extra: boolean
          proposal_id: string | null
          request_id: string
          requested_by: string | null
          revision_number: number
          status: Database["public"]["Enums"]["revision_status"]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          client_notes?: string | null
          created_at?: string
          delivered_at?: string | null
          engineer_notes?: string | null
          extra_price?: number | null
          id?: string
          is_extra?: boolean
          proposal_id?: string | null
          request_id: string
          requested_by?: string | null
          revision_number: number
          status?: Database["public"]["Enums"]["revision_status"]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          client_notes?: string | null
          created_at?: string
          delivered_at?: string | null
          engineer_notes?: string | null
          extra_price?: number | null
          id?: string
          is_extra?: boolean
          proposal_id?: string | null
          request_id?: string
          requested_by?: string | null
          revision_number?: number
          status?: Database["public"]["Enums"]["revision_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revisions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revisions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revisions_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          company_id: string
          created_at: string
          delivered_at: string | null
          delivery_notes: string | null
          description: string | null
          id: string
          paid_at: string | null
          price: number | null
          project_id: string | null
          quoted_at: string | null
          status: Database["public"]["Enums"]["service_status"]
          stripe_payment_id: string | null
          title: string
          type: Database["public"]["Enums"]["service_type"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          delivered_at?: string | null
          delivery_notes?: string | null
          description?: string | null
          id?: string
          paid_at?: string | null
          price?: number | null
          project_id?: string | null
          quoted_at?: string | null
          status?: Database["public"]["Enums"]["service_status"]
          stripe_payment_id?: string | null
          title: string
          type: Database["public"]["Enums"]["service_type"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          delivered_at?: string | null
          delivery_notes?: string | null
          description?: string | null
          id?: string
          paid_at?: string | null
          price?: number | null
          project_id?: string | null
          quoted_at?: string | null
          status?: Database["public"]["Enums"]["service_status"]
          stripe_payment_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["service_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      service_pricing: {
        Row: {
          base_price: number
          created_at: string
          from_price_display: string | null
          id: string
          max_price: number | null
          min_price: number | null
          multipliers: Json
          service_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          base_price: number
          created_at?: string
          from_price_display?: string | null
          id?: string
          max_price?: number | null
          min_price?: number | null
          multipliers?: Json
          service_id: string
          unit: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          created_at?: string
          from_price_display?: string | null
          id?: string
          max_price?: number | null
          min_price?: number | null
          multipliers?: Json
          service_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_pricing_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: true
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          budget_id: string | null
          city: string | null
          code: string
          company_id: string
          created_at: string
          deadline: string | null
          description: string | null
          estimated_price: number | null
          file_urls: string[] | null
          final_price: number | null
          id: string
          project_id: string | null
          project_type: string | null
          rejection_reason: string | null
          requester_user_id: string
          service_id: string
          stage: Database["public"]["Enums"]["request_stage"]
          standard: string | null
          state: string | null
          title: string
          total_area: number | null
          updated_at: string
        }
        Insert: {
          budget_id?: string | null
          city?: string | null
          code: string
          company_id: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          estimated_price?: number | null
          file_urls?: string[] | null
          final_price?: number | null
          id?: string
          project_id?: string | null
          project_type?: string | null
          rejection_reason?: string | null
          requester_user_id: string
          service_id: string
          stage?: Database["public"]["Enums"]["request_stage"]
          standard?: string | null
          state?: string | null
          title: string
          total_area?: number | null
          updated_at?: string
        }
        Update: {
          budget_id?: string | null
          city?: string | null
          code?: string
          company_id?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          estimated_price?: number | null
          file_urls?: string[] | null
          final_price?: number | null
          id?: string
          project_id?: string | null
          project_type?: string | null
          rejection_reason?: string | null
          requester_user_id?: string
          service_id?: string
          stage?: Database["public"]["Enums"]["request_stage"]
          standard?: string | null
          state?: string | null
          title?: string
          total_area?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_requester_user_id_fkey"
            columns: ["requester_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          base_price: number | null
          created_at: string
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          long_description: string | null
          name: string
          price_unit: string | null
          short_description: string
          slug: string
          updated_at: string
        }
        Insert: {
          base_price?: number | null
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          long_description?: string | null
          name: string
          price_unit?: string | null
          short_description: string
          slug: string
          updated_at?: string
        }
        Update: {
          base_price?: number | null
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          long_description?: string | null
          name?: string
          price_unit?: string | null
          short_description?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      sinapi_composicao: {
        Row: {
          codigo: string
          created_at: string
          descricao: string
          desonerado: boolean
          estado: string
          grupo: string | null
          id: string
          insumos_jsonb: Json
          mes_referencia: string
          origem_arquivo: string | null
          preco_unitario: number
          unidade: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descricao: string
          desonerado: boolean
          estado: string
          grupo?: string | null
          id?: string
          insumos_jsonb?: Json
          mes_referencia: string
          origem_arquivo?: string | null
          preco_unitario: number
          unidade: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descricao?: string
          desonerado?: boolean
          estado?: string
          grupo?: string | null
          id?: string
          insumos_jsonb?: Json
          mes_referencia?: string
          origem_arquivo?: string | null
          preco_unitario?: number
          unidade?: string
          updated_at?: string
        }
        Relationships: []
      }
      sinapi_import_log: {
        Row: {
          arquivo_nome: string
          arquivo_sha256: string | null
          composicoes_inserted: number
          composicoes_updated: number
          created_at: string
          desonerado: boolean
          duracao_ms: number | null
          erros_jsonb: Json
          estado: string
          id: string
          imported_by: string | null
          insumos_inserted: number
          insumos_updated: number
          mes_referencia: string
          status: string
        }
        Insert: {
          arquivo_nome: string
          arquivo_sha256?: string | null
          composicoes_inserted?: number
          composicoes_updated?: number
          created_at?: string
          desonerado: boolean
          duracao_ms?: number | null
          erros_jsonb?: Json
          estado: string
          id?: string
          imported_by?: string | null
          insumos_inserted?: number
          insumos_updated?: number
          mes_referencia: string
          status: string
        }
        Update: {
          arquivo_nome?: string
          arquivo_sha256?: string | null
          composicoes_inserted?: number
          composicoes_updated?: number
          created_at?: string
          desonerado?: boolean
          duracao_ms?: number | null
          erros_jsonb?: Json
          estado?: string
          id?: string
          imported_by?: string | null
          insumos_inserted?: number
          insumos_updated?: number
          mes_referencia?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sinapi_import_log_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sinapi_insumo: {
        Row: {
          categoria: string | null
          codigo: string
          created_at: string
          descricao: string
          desonerado: boolean
          estado: string
          id: string
          mes_referencia: string
          origem_arquivo: string | null
          preco_unitario: number
          unidade: string
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          codigo: string
          created_at?: string
          descricao: string
          desonerado: boolean
          estado: string
          id?: string
          mes_referencia: string
          origem_arquivo?: string | null
          preco_unitario: number
          unidade: string
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          codigo?: string
          created_at?: string
          descricao?: string
          desonerado?: boolean
          estado?: string
          id?: string
          mes_referencia?: string
          origem_arquivo?: string | null
          preco_unitario?: number
          unidade?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_id: string | null
          cau: string | null
          company_id: string
          crea: string | null
          created_at: string
          email: string
          id: string
          is_super_admin: boolean
          name: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          auth_id?: string | null
          cau?: string | null
          company_id: string
          crea?: string | null
          created_at?: string
          email: string
          id?: string
          is_super_admin?: boolean
          name: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          auth_id?: string | null
          cau?: string | null
          company_id?: string
          crea?: string | null
          created_at?: string
          email?: string
          id?: string
          is_super_admin?: boolean
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      validations: {
        Row: {
          budget_id: string | null
          changes: Json | null
          comment: string | null
          confidence: Database["public"]["Enums"]["confidence_level"] | null
          created_at: string
          discipline_id: string | null
          id: string
          item_name: string | null
          item_type: string | null
          reason: string | null
          status: Database["public"]["Enums"]["validation_status"]
          suggestion: string | null
          validated_by: string
        }
        Insert: {
          budget_id?: string | null
          changes?: Json | null
          comment?: string | null
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          created_at?: string
          discipline_id?: string | null
          id?: string
          item_name?: string | null
          item_type?: string | null
          reason?: string | null
          status: Database["public"]["Enums"]["validation_status"]
          suggestion?: string | null
          validated_by: string
        }
        Update: {
          budget_id?: string | null
          changes?: Json | null
          comment?: string | null
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          created_at?: string
          discipline_id?: string | null
          id?: string
          item_name?: string | null
          item_type?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["validation_status"]
          suggestion?: string | null
          validated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "validations_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validations_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validations_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      finalize_budget_review: {
        Args: { p_budget_id: string; p_user_id: string }
        Returns: string
      }
      get_user_company_id: { Args: never; Returns: string }
      map_service_slug_to_budget_type: {
        Args: { svc_slug: string }
        Returns: Database["public"]["Enums"]["budget_type"]
      }
      map_service_slug_to_project_type: {
        Args: { svc_slug: string }
        Returns: Database["public"]["Enums"]["project_type"]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      submit_budget_for_review: {
        Args: { p_budget_id: string }
        Returns: undefined
      }
      validate_budget_item: {
        Args: {
          p_action: string
          p_changes?: Json
          p_comment?: string
          p_item_id: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      budget_item_origem:
        | "MANUAL"
        | "SINAPI_INSUMO"
        | "SINAPI_COMPOSICAO"
        | "AI_DRAFT"
      budget_type: "PARAMETRIC" | "ANALYTICAL" | "HYBRID" | "ADDITIVE"
      composition_input_type:
        | "LABOR"
        | "MATERIAL"
        | "EQUIPMENT"
        | "TRANSPORT"
        | "OTHER"
      confidence_level: "HIGH" | "MEDIUM" | "LOW"
      construction_standard: "baixo" | "normal" | "alto"
      discipline_type:
        | "ARCHITECTURAL"
        | "STRUCTURAL"
        | "ELECTRICAL"
        | "HYDRAULIC"
        | "HVAC"
        | "FIRE_PROTECTION"
        | "TELECOM"
      document_type:
        | "FLOOR_PLAN"
        | "MEMORIAL"
        | "SPREADSHEET"
        | "BIM_MODEL"
        | "TECHNICAL"
        | "OTHER"
      file_kind: "INPUT" | "DELIVERABLE" | "CONTRACT" | "RECEIPT"
      item_origin: "AI_GENERATED" | "MANUAL" | "IMPORTED" | "COMPOSITION"
      payment_method: "CARD" | "PIX" | "BOLETO"
      payment_status:
        | "PENDING"
        | "AUTHORIZED"
        | "PROCESSING"
        | "PAID"
        | "FAILED"
        | "REFUNDED"
        | "CANCELLED"
      price_base: "SINAPI" | "SICRO" | "TCPO" | "OWN" | "MIXED"
      project_status:
        | "STUDY"
        | "PRELIMINARY"
        | "EXECUTIVE"
        | "BIDDING"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "ARCHIVED"
      project_type:
        | "RESIDENTIAL"
        | "RESIDENTIAL_MULTI"
        | "COMMERCIAL"
        | "HOSPITAL"
        | "INDUSTRIAL"
        | "EDUCATIONAL"
        | "INFRASTRUCTURE"
        | "RENOVATION"
        | "OTHER"
      proposal_status:
        | "DRAFT"
        | "SENT"
        | "ACCEPTED"
        | "REJECTED"
        | "EXPIRED"
        | "CANCELLED"
      quotation_status: "OPEN" | "CLOSED" | "AWARDED" | "CANCELLED"
      request_stage:
        | "RECEIVED"
        | "QUOTING"
        | "COMPOSING"
        | "UNDER_REVIEW"
        | "VALIDATED"
        | "SENT"
        | "ACCEPTED"
        | "REJECTED"
        | "CANCELLED"
      revision_status:
        | "REQUESTED"
        | "IN_PROGRESS"
        | "DELIVERED"
        | "ACCEPTED"
        | "REJECTED"
      service_status:
        | "REQUESTED"
        | "QUOTED"
        | "APPROVED"
        | "PAID"
        | "IN_PROGRESS"
        | "DELIVERED"
        | "COMPLETED"
        | "CANCELLED"
      service_type:
        | "ORCAMENTO_OBRA"
        | "ORCAMENTO_ELETRICA"
        | "ORCAMENTO_HIDRAULICA"
        | "ORCAMENTO_ESTRUTURAL"
        | "PROJETO_ARQUITETONICO"
        | "PROJETO_ELETRICO"
        | "PROJETO_HIDRAULICO"
        | "PROJETO_ESTRUTURAL"
        | "LAUDO_TECNICO"
        | "CONSULTORIA"
        | "OUTRO"
      user_role:
        | "ADMIN"
        | "MANAGER"
        | "ENGINEER"
        | "ESTIMATOR"
        | "VIEWER"
        | "CLIENT"
      validation_status: "AI_DRAFT" | "IN_REVIEW" | "VALIDATED" | "REJECTED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      budget_item_origem: [
        "MANUAL",
        "SINAPI_INSUMO",
        "SINAPI_COMPOSICAO",
        "AI_DRAFT",
      ],
      budget_type: ["PARAMETRIC", "ANALYTICAL", "HYBRID", "ADDITIVE"],
      composition_input_type: [
        "LABOR",
        "MATERIAL",
        "EQUIPMENT",
        "TRANSPORT",
        "OTHER",
      ],
      confidence_level: ["HIGH", "MEDIUM", "LOW"],
      construction_standard: ["baixo", "normal", "alto"],
      discipline_type: [
        "ARCHITECTURAL",
        "STRUCTURAL",
        "ELECTRICAL",
        "HYDRAULIC",
        "HVAC",
        "FIRE_PROTECTION",
        "TELECOM",
      ],
      document_type: [
        "FLOOR_PLAN",
        "MEMORIAL",
        "SPREADSHEET",
        "BIM_MODEL",
        "TECHNICAL",
        "OTHER",
      ],
      file_kind: ["INPUT", "DELIVERABLE", "CONTRACT", "RECEIPT"],
      item_origin: ["AI_GENERATED", "MANUAL", "IMPORTED", "COMPOSITION"],
      payment_method: ["CARD", "PIX", "BOLETO"],
      payment_status: [
        "PENDING",
        "AUTHORIZED",
        "PROCESSING",
        "PAID",
        "FAILED",
        "REFUNDED",
        "CANCELLED",
      ],
      price_base: ["SINAPI", "SICRO", "TCPO", "OWN", "MIXED"],
      project_status: [
        "STUDY",
        "PRELIMINARY",
        "EXECUTIVE",
        "BIDDING",
        "IN_PROGRESS",
        "COMPLETED",
        "ARCHIVED",
      ],
      project_type: [
        "RESIDENTIAL",
        "RESIDENTIAL_MULTI",
        "COMMERCIAL",
        "HOSPITAL",
        "INDUSTRIAL",
        "EDUCATIONAL",
        "INFRASTRUCTURE",
        "RENOVATION",
        "OTHER",
      ],
      proposal_status: [
        "DRAFT",
        "SENT",
        "ACCEPTED",
        "REJECTED",
        "EXPIRED",
        "CANCELLED",
      ],
      quotation_status: ["OPEN", "CLOSED", "AWARDED", "CANCELLED"],
      request_stage: [
        "RECEIVED",
        "QUOTING",
        "COMPOSING",
        "UNDER_REVIEW",
        "VALIDATED",
        "SENT",
        "ACCEPTED",
        "REJECTED",
        "CANCELLED",
      ],
      revision_status: [
        "REQUESTED",
        "IN_PROGRESS",
        "DELIVERED",
        "ACCEPTED",
        "REJECTED",
      ],
      service_status: [
        "REQUESTED",
        "QUOTED",
        "APPROVED",
        "PAID",
        "IN_PROGRESS",
        "DELIVERED",
        "COMPLETED",
        "CANCELLED",
      ],
      service_type: [
        "ORCAMENTO_OBRA",
        "ORCAMENTO_ELETRICA",
        "ORCAMENTO_HIDRAULICA",
        "ORCAMENTO_ESTRUTURAL",
        "PROJETO_ARQUITETONICO",
        "PROJETO_ELETRICO",
        "PROJETO_HIDRAULICO",
        "PROJETO_ESTRUTURAL",
        "LAUDO_TECNICO",
        "CONSULTORIA",
        "OUTRO",
      ],
      user_role: [
        "ADMIN",
        "MANAGER",
        "ENGINEER",
        "ESTIMATOR",
        "VIEWER",
        "CLIENT",
      ],
      validation_status: ["AI_DRAFT", "IN_REVIEW", "VALIDATED", "REJECTED"],
    },
  },
} as const
