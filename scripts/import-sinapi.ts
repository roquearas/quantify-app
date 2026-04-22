#!/usr/bin/env tsx
/**
 * Importador SINAPI (CLI) — roda localmente com SUPABASE_SERVICE_ROLE_KEY.
 *
 * Uso:
 *   tsx scripts/import-sinapi.ts \
 *     --file /path/to/SINAPI_SP_2026-03_desonerado.xlsx \
 *     --estado SP \
 *     --mes 2026-03-01 \
 *     --desonerado
 *
 * Requer variáveis de ambiente:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY  (bypass RLS)
 */
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { parseArgs } from 'node:util'
import { createClient } from '@supabase/supabase-js'
import { importSinapi } from '../src/lib/sinapi/importer'

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      file: { type: 'string' },
      estado: { type: 'string' },
      mes: { type: 'string' },
      desonerado: { type: 'boolean', default: false },
      'no-desonerado': { type: 'boolean', default: false },
    },
  })

  if (!values.file || !values.estado || !values.mes) {
    console.error('Uso: tsx scripts/import-sinapi.ts --file <path> --estado SP --mes 2026-03-01 [--desonerado]')
    process.exit(1)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local')
    process.exit(1)
  }

  const buffer = readFileSync(values.file)
  const fileName = basename(values.file)

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const desonerado = values.desonerado === true && values['no-desonerado'] !== true

  console.log(`📥 Importando ${fileName}`)
  console.log(`   Estado: ${values.estado} | Mês: ${values.mes} | Desonerado: ${desonerado}`)

  const result = await importSinapi(supabase, {
    fileBuffer: buffer,
    fileName,
    estado: values.estado,
    mesReferencia: values.mes,
    desonerado,
  })

  console.log('')
  console.log(`Status: ${result.status}`)
  console.log(`Insumos:      ${result.insumosInserted} inseridos / ${result.insumosUpdated} atualizados`)
  console.log(`Composições:  ${result.composicoesInserted} inseridas / ${result.composicoesUpdated} atualizadas`)
  console.log(`Duração:      ${result.duracaoMs}ms`)
  console.log(`Log ID:       ${result.logId}`)

  if (result.warnings.length > 0) {
    console.log(`\n⚠️  ${result.warnings.length} avisos (primeiros 10):`)
    result.warnings.slice(0, 10).forEach((w) => console.log(`   - ${w}`))
  }
  if (result.errors.length > 0) {
    console.log(`\n❌ ${result.errors.length} erros:`)
    result.errors.forEach((e) => console.log(`   - ${e}`))
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('Falha fatal:', e)
  process.exit(1)
})
