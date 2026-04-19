import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { parseSinapiXlsx, type ParsedSinapi } from './parser'

export interface ImportParams {
  fileBuffer: Buffer
  fileName: string
  estado: string
  mesReferencia: string
  desonerado: boolean
  importedBy?: string | null
}

export interface ImportResult {
  logId: string
  status: 'OK' | 'ERROR'
  insumosInserted: number
  insumosUpdated: number
  composicoesInserted: number
  composicoesUpdated: number
  warnings: string[]
  errors: string[]
  duracaoMs: number
}

const BATCH_SIZE = 500

export async function importSinapi(
  supabase: SupabaseClient,
  params: ImportParams,
): Promise<ImportResult> {
  const startedAt = Date.now()
  const sha256 = createHash('sha256').update(params.fileBuffer).digest('hex')

  const { data: logRow, error: logErr } = await supabase
    .from('sinapi_import_log')
    .insert({
      imported_by: params.importedBy ?? null,
      estado: params.estado,
      mes_referencia: params.mesReferencia,
      desonerado: params.desonerado,
      arquivo_nome: params.fileName,
      arquivo_sha256: sha256,
      status: 'RUNNING',
    })
    .select('id')
    .single()

  if (logErr || !logRow) {
    throw new Error(`Falha ao criar import log: ${logErr?.message ?? 'unknown'}`)
  }

  const logId = logRow.id as string
  const errors: string[] = []
  let parsed: ParsedSinapi
  try {
    parsed = await parseSinapiXlsx(params.fileBuffer)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await markLogError(supabase, logId, [msg], Date.now() - startedAt)
    return {
      logId,
      status: 'ERROR',
      insumosInserted: 0,
      insumosUpdated: 0,
      composicoesInserted: 0,
      composicoesUpdated: 0,
      warnings: [],
      errors: [msg],
      duracaoMs: Date.now() - startedAt,
    }
  }

  const insumoCounts = await upsertBatch(
    supabase,
    'sinapi_insumo',
    parsed.insumos.map((i) => ({
      codigo: i.codigo,
      descricao: i.descricao,
      unidade: i.unidade,
      categoria: i.categoria,
      preco_unitario: i.preco_unitario,
      estado: params.estado,
      mes_referencia: params.mesReferencia,
      desonerado: params.desonerado,
      origem_arquivo: params.fileName,
    })),
    errors,
  )

  const composicaoCounts = await upsertBatch(
    supabase,
    'sinapi_composicao',
    parsed.composicoes.map((c) => ({
      codigo: c.codigo,
      descricao: c.descricao,
      unidade: c.unidade,
      grupo: c.grupo,
      preco_unitario: c.preco_unitario,
      estado: params.estado,
      mes_referencia: params.mesReferencia,
      desonerado: params.desonerado,
      insumos_jsonb: c.insumos,
      origem_arquivo: params.fileName,
    })),
    errors,
  )

  const duracaoMs = Date.now() - startedAt
  const finalStatus: 'OK' | 'ERROR' = errors.length > 0 ? 'ERROR' : 'OK'

  await supabase
    .from('sinapi_import_log')
    .update({
      status: finalStatus,
      insumos_inserted: insumoCounts.inserted,
      insumos_updated: insumoCounts.updated,
      composicoes_inserted: composicaoCounts.inserted,
      composicoes_updated: composicaoCounts.updated,
      erros_jsonb: [...parsed.warnings, ...errors],
      duracao_ms: duracaoMs,
    })
    .eq('id', logId)

  return {
    logId,
    status: finalStatus,
    insumosInserted: insumoCounts.inserted,
    insumosUpdated: insumoCounts.updated,
    composicoesInserted: composicaoCounts.inserted,
    composicoesUpdated: composicaoCounts.updated,
    warnings: parsed.warnings,
    errors,
    duracaoMs,
  }
}

async function upsertBatch(
  supabase: SupabaseClient,
  table: 'sinapi_insumo' | 'sinapi_composicao',
  rows: Array<Record<string, unknown>>,
  errors: string[],
): Promise<{ inserted: number; updated: number }> {
  let inserted = 0
  let updated = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE)
    const { data, error } = await supabase
      .from(table)
      .upsert(chunk, {
        onConflict: 'codigo,estado,mes_referencia,desonerado',
        count: 'exact',
        ignoreDuplicates: false,
      })
      .select('id, created_at, updated_at')

    if (error) {
      errors.push(`Upsert ${table} batch ${i}: ${error.message}`)
      continue
    }

    const returned = data ?? []
    for (const row of returned) {
      const createdAt = new Date(row.created_at as string).getTime()
      const updatedAt = new Date(row.updated_at as string).getTime()
      if (Math.abs(createdAt - updatedAt) < 1000) inserted += 1
      else updated += 1
    }
  }

  return { inserted, updated }
}

async function markLogError(
  supabase: SupabaseClient,
  logId: string,
  errors: string[],
  duracaoMs: number,
): Promise<void> {
  await supabase
    .from('sinapi_import_log')
    .update({
      status: 'ERROR',
      erros_jsonb: errors,
      duracao_ms: duracaoMs,
    })
    .eq('id', logId)
}
