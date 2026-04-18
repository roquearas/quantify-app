-- =====================================================
-- QUANTIFY — Migração 002: Supabase Storage
-- Data: 2026-04-12
-- =====================================================
-- Execute no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/rrfmfybklhlaoaxmhdyr/sql/new
-- =====================================================

-- Criar bucket para documentos do projeto
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-documents',
  'project-documents',
  false,
  52428800,  -- 50MB
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/dwg',
    'application/dxf',
    'application/ifc',
    'application/octet-stream'
  ]
) ON CONFLICT (id) DO NOTHING;

-- RLS: Usuários autenticados podem fazer upload
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'project-documents');

-- RLS: Usuários autenticados podem ver documentos
CREATE POLICY "Authenticated users can view documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'project-documents');

-- RLS: Usuários autenticados podem deletar documentos
CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'project-documents');
