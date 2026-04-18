#!/usr/bin/env node
/**
 * Aplica uma migration SQL no banco via conexão direta (pg).
 * Uso: DATABASE_URL="postgresql://..." npx tsx scripts/apply-migration.ts <path-to-migration.sql>
 */
import { readFileSync } from 'node:fs'
import { Client } from 'pg'

const migrationPath = process.argv[2]
if (!migrationPath) {
  console.error('Uso: apply-migration.ts <path-to-migration.sql>')
  process.exit(1)
}

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  console.error('ERRO: DATABASE_URL não definida.')
  process.exit(1)
}

const sql = readFileSync(migrationPath, 'utf-8')
console.log(`# Aplicando migration: ${migrationPath}`)
console.log(`# Tamanho: ${sql.length} bytes`)
console.log()

async function main() {
  const client = new Client({ connectionString: dbUrl })
  await client.connect()

  try {
    const result = await client.query(sql)
    // Handle single or array result
    const rows = Array.isArray(result) ? result[result.length - 1].rows : result.rows
    console.log('✅ Migration aplicada com sucesso.')
    if (rows && rows.length > 0) {
      console.log('Verificação:')
      console.log(JSON.stringify(rows, null, 2))
    }
  } catch (err) {
    console.error('❌ Erro ao aplicar migration:')
    console.error(err)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
