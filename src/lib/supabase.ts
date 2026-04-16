import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rrfmfybklhlaoaxmhdyr.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyZm1meWJrbGhsYW9heG1oZHlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODM5MTMsImV4cCI6MjA4NDA1OTkxM30.G3-8iYrktvtWLqt9mZRk-lomIEVA1uu5b4l0hyXlzw8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
