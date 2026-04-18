#!/usr/bin/env node
/**
 * Inspeciona o schema atual do Supabase via conexão direta.
 * Uso: DATABASE_URL="postgresql://..." npx tsx scripts/inspect-schema.ts
 */
import { Client } from 'pg'

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  console.error('ERRO: DATABASE_URL não definida.')
  process.exit(1)
}

async function main() {
  const client = new Client({ connectionString: dbUrl })
  await client.connect()

  const tables = await client.query<{ table_name: string }>(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema='public' AND table_type='BASE TABLE'
    ORDER BY table_name
  `)

  const enums = await client.query<{ enum_name: string, values: string }>(`
    SELECT t.typname AS enum_name,
           string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) AS values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname='public'
    GROUP BY t.typname
    ORDER BY t.typname
  `)

  const columns = await client.query<{ table_name: string, column_name: string, data_type: string, is_nullable: string }>(`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema='public'
    ORDER BY table_name, ordinal_position
  `)

  const policies = await client.query<{ tablename: string, policyname: string, cmd: string }>(`
    SELECT schemaname || '.' || tablename AS tablename, policyname, cmd
    FROM pg_policies
    WHERE schemaname='public'
    ORDER BY tablename, policyname
  `)

  const triggers = await client.query<{ trigger_name: string, event_object_table: string, action_timing: string, event_manipulation: string }>(`
    SELECT trigger_name, event_object_table, action_timing, event_manipulation
    FROM information_schema.triggers
    WHERE trigger_schema='public'
    ORDER BY event_object_table, trigger_name
  `)

  console.log('# SCHEMA ATUAL — Quantify Supabase')
  console.log(`Gerado em: ${new Date().toISOString()}`)
  console.log()
  console.log(`## Tabelas (${tables.rows.length})`)
  for (const row of tables.rows) console.log(`- ${row.table_name}`)
  console.log()
  console.log(`## Enums (${enums.rows.length})`)
  for (const row of enums.rows) console.log(`- ${row.enum_name}: ${row.values}`)
  console.log()
  console.log(`## Colunas por tabela`)
  const byTable: Record<string, typeof columns.rows> = {}
  for (const c of columns.rows) {
    if (!byTable[c.table_name]) byTable[c.table_name] = []
    byTable[c.table_name].push(c)
  }
  for (const [table, cols] of Object.entries(byTable)) {
    console.log(`\n### ${table}`)
    for (const c of cols) {
      console.log(`  - ${c.column_name} ${c.data_type}${c.is_nullable === 'NO' ? ' NOT NULL' : ''}`)
    }
  }
  console.log()
  console.log(`## Policies RLS (${policies.rows.length})`)
  for (const p of policies.rows) console.log(`- ${p.tablename} / ${p.policyname} (${p.cmd})`)
  console.log()
  console.log(`## Triggers (${triggers.rows.length})`)
  for (const t of triggers.rows) console.log(`- ${t.event_object_table}.${t.trigger_name} (${t.action_timing} ${t.event_manipulation})`)

  await client.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
