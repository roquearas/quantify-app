import ExcelJS from 'exceljs'

export interface SinapiInsumoRow {
  codigo: string
  descricao: string
  unidade: string
  categoria: string | null
  preco_unitario: number
}

export interface SinapiComposicaoInsumoRef {
  codigo: string
  quantidade: number
  preco_unitario: number
}

export interface SinapiComposicaoRow {
  codigo: string
  descricao: string
  unidade: string
  grupo: string | null
  preco_unitario: number
  insumos: SinapiComposicaoInsumoRef[]
}

export interface ParsedSinapi {
  insumos: SinapiInsumoRow[]
  composicoes: SinapiComposicaoRow[]
  warnings: string[]
}

export interface ParseOptions {
  insumoSheetName?: string
  composicaoSheetName?: string
  maxRows?: number
}

const DEFAULT_INSUMO_SHEET = 'Insumos'
const DEFAULT_COMPOSICAO_SHEET = 'Composicoes'
const DEFAULT_MAX_ROWS = 200_000

const INSUMO_HEADERS = ['codigo', 'descricao', 'unidade', 'categoria', 'preco_unitario'] as const
const COMPOSICAO_HEADERS = [
  'codigo',
  'descricao',
  'unidade',
  'grupo',
  'preco_unitario',
  'insumos_json',
] as const

export async function parseSinapiXlsx(
  buffer: ArrayBuffer | Buffer,
  opts: ParseOptions = {},
): Promise<ParsedSinapi> {
  const workbook = new ExcelJS.Workbook()
  const input = Buffer.isBuffer(buffer) ? buffer : new Uint8Array(buffer as ArrayBuffer)
  await workbook.xlsx.load(input as unknown as ExcelJS.Buffer)

  const warnings: string[] = []
  const maxRows = opts.maxRows ?? DEFAULT_MAX_ROWS

  const insumoSheet = workbook.getWorksheet(opts.insumoSheetName ?? DEFAULT_INSUMO_SHEET)
  const composicaoSheet = workbook.getWorksheet(
    opts.composicaoSheetName ?? DEFAULT_COMPOSICAO_SHEET,
  )

  if (!insumoSheet) {
    throw new Error(
      `Sheet "${opts.insumoSheetName ?? DEFAULT_INSUMO_SHEET}" não encontrada no XLSX`,
    )
  }
  if (!composicaoSheet) {
    throw new Error(
      `Sheet "${opts.composicaoSheetName ?? DEFAULT_COMPOSICAO_SHEET}" não encontrada no XLSX`,
    )
  }

  const insumos = parseInsumos(insumoSheet, warnings, maxRows)
  const composicoes = parseComposicoes(composicaoSheet, warnings, maxRows)

  return { insumos, composicoes, warnings }
}

function parseInsumos(
  sheet: ExcelJS.Worksheet,
  warnings: string[],
  maxRows: number,
): SinapiInsumoRow[] {
  const headerMap = extractHeaderMap(sheet, INSUMO_HEADERS)
  const rows: SinapiInsumoRow[] = []
  const seenCodigos = new Set<string>()

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    if (rows.length >= maxRows) return

    const codigo = cellString(row.getCell(headerMap.codigo))
    if (!codigo) return

    if (seenCodigos.has(codigo)) {
      warnings.push(`Insumo duplicado ignorado: ${codigo} (linha ${rowNumber})`)
      return
    }

    const descricao = cellString(row.getCell(headerMap.descricao))
    const unidade = cellString(row.getCell(headerMap.unidade))
    const preco = cellNumber(row.getCell(headerMap.preco_unitario))

    if (!descricao || !unidade) {
      warnings.push(`Insumo ${codigo} ignorado: descricao/unidade vazios (linha ${rowNumber})`)
      return
    }
    if (preco === null || preco < 0) {
      warnings.push(`Insumo ${codigo} ignorado: preço inválido (linha ${rowNumber})`)
      return
    }

    seenCodigos.add(codigo)
    rows.push({
      codigo,
      descricao,
      unidade,
      categoria: cellString(row.getCell(headerMap.categoria)) || null,
      preco_unitario: preco,
    })
  })

  return rows
}

function parseComposicoes(
  sheet: ExcelJS.Worksheet,
  warnings: string[],
  maxRows: number,
): SinapiComposicaoRow[] {
  const headerMap = extractHeaderMap(sheet, COMPOSICAO_HEADERS)
  const rows: SinapiComposicaoRow[] = []
  const seenCodigos = new Set<string>()

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    if (rows.length >= maxRows) return

    const codigo = cellString(row.getCell(headerMap.codigo))
    if (!codigo) return

    if (seenCodigos.has(codigo)) {
      warnings.push(`Composição duplicada ignorada: ${codigo} (linha ${rowNumber})`)
      return
    }

    const descricao = cellString(row.getCell(headerMap.descricao))
    const unidade = cellString(row.getCell(headerMap.unidade))
    const preco = cellNumber(row.getCell(headerMap.preco_unitario))

    if (!descricao || !unidade) {
      warnings.push(`Composição ${codigo} ignorada: descricao/unidade vazios (linha ${rowNumber})`)
      return
    }
    if (preco === null || preco < 0) {
      warnings.push(`Composição ${codigo} ignorada: preço inválido (linha ${rowNumber})`)
      return
    }

    const insumosRaw = cellString(row.getCell(headerMap.insumos_json))
    const insumos = parseInsumosJson(insumosRaw, codigo, rowNumber, warnings)

    seenCodigos.add(codigo)
    rows.push({
      codigo,
      descricao,
      unidade,
      grupo: cellString(row.getCell(headerMap.grupo)) || null,
      preco_unitario: preco,
      insumos,
    })
  })

  return rows
}

function parseInsumosJson(
  raw: string,
  codigoComposicao: string,
  rowNumber: number,
  warnings: string[],
): SinapiComposicaoInsumoRef[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      warnings.push(
        `Composição ${codigoComposicao}: insumos_json não é array (linha ${rowNumber})`,
      )
      return []
    }
    const result: SinapiComposicaoInsumoRef[] = []
    for (const item of parsed) {
      if (
        typeof item?.codigo === 'string' &&
        typeof item?.quantidade === 'number' &&
        typeof item?.preco_unitario === 'number'
      ) {
        result.push({
          codigo: item.codigo,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
        })
      }
    }
    return result
  } catch {
    warnings.push(`Composição ${codigoComposicao}: insumos_json inválido (linha ${rowNumber})`)
    return []
  }
}

function extractHeaderMap<T extends readonly string[]>(
  sheet: ExcelJS.Worksheet,
  expected: T,
): Record<T[number], number> {
  const headerRow = sheet.getRow(1)
  const map: Record<string, number> = {}

  for (let col = 1; col <= (headerRow.cellCount || 0); col++) {
    const raw = cellString(headerRow.getCell(col)).toLowerCase()
    if (!raw) continue
    const normalized = normalizeHeader(raw)
    map[normalized] = col
  }

  for (const header of expected) {
    if (!(header in map)) {
      throw new Error(`Coluna "${header}" não encontrada em "${sheet.name}"`)
    }
  }

  return map as Record<T[number], number>
}

function normalizeHeader(raw: string): string {
  return raw
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
}

function cellString(cell: ExcelJS.Cell): string {
  const v = cell?.value
  if (v == null) return ''
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return String(v)
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'object' && 'text' in v) return String((v as { text: unknown }).text).trim()
  if (typeof v === 'object' && 'result' in v) return String((v as { result: unknown }).result).trim()
  return String(v).trim()
}

function cellNumber(cell: ExcelJS.Cell): number | null {
  const v = cell?.value
  if (v == null || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'string') {
    const normalized = v.replace(/\./g, '').replace(',', '.').trim()
    const n = Number(normalized)
    return Number.isFinite(n) ? n : null
  }
  if (typeof v === 'object' && v !== null && 'result' in v) {
    const r = (v as { result: unknown }).result
    if (typeof r === 'number') return Number.isFinite(r) ? r : null
  }
  return null
}
