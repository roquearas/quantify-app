import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import { parseSinapiXlsx } from './parser'

async function buildFixture(opts?: {
  insumos?: Array<Record<string, unknown>>
  composicoes?: Array<Record<string, unknown>>
  omitSheet?: 'insumos' | 'composicoes'
  headerCasing?: 'lower' | 'upper' | 'accented'
}): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()

  const headerCasing = opts?.headerCasing ?? 'lower'
  const formatHeader = (h: string): string => {
    if (headerCasing === 'upper') return h.toUpperCase()
    if (headerCasing === 'accented') {
      return h.replace('descricao', 'DESCRIÇÃO').replace('preco_unitario', 'Preço Unitário').toUpperCase()
    }
    return h
  }

  if (opts?.omitSheet !== 'insumos') {
    const ws = wb.addWorksheet('Insumos')
    ws.columns = ['codigo', 'descricao', 'unidade', 'categoria', 'preco_unitario'].map((key) => ({
      header: formatHeader(key),
      key,
    }))
    const insumos = opts?.insumos ?? [
      { codigo: '00001', descricao: 'Cimento CP-II 50kg', unidade: 'SC', categoria: 'MATERIAL', preco_unitario: 38.5 },
      { codigo: '00002', descricao: 'Areia lavada', unidade: 'M3', categoria: 'MATERIAL', preco_unitario: 120.0 },
      { codigo: '88262', descricao: 'Pedreiro com encargos', unidade: 'H', categoria: 'MAO_OBRA', preco_unitario: 22.3 },
    ]
    insumos.forEach((row) => ws.addRow(row))
  }

  if (opts?.omitSheet !== 'composicoes') {
    const ws = wb.addWorksheet('Composicoes')
    ws.columns = [
      { header: formatHeader('codigo'), key: 'codigo' },
      { header: formatHeader('descricao'), key: 'descricao' },
      { header: formatHeader('unidade'), key: 'unidade' },
      { header: formatHeader('grupo'), key: 'grupo' },
      { header: formatHeader('preco_unitario'), key: 'preco_unitario' },
      { header: formatHeader('insumos_json'), key: 'insumos_json' },
    ]
    const composicoes = opts?.composicoes ?? [
      {
        codigo: '87471',
        descricao: 'Alvenaria de vedação 1 vez tijolo cerâmico furado',
        unidade: 'M2',
        grupo: 'ALVENARIA',
        preco_unitario: 98.4,
        insumos_json: JSON.stringify([
          { codigo: '00001', quantidade: 0.5, preco_unitario: 38.5 },
          { codigo: '00002', quantidade: 0.04, preco_unitario: 120.0 },
          { codigo: '88262', quantidade: 1.2, preco_unitario: 22.3 },
        ]),
      },
    ]
    composicoes.forEach((row) => ws.addRow(row))
  }

  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}

describe('parseSinapiXlsx', () => {
  it('parses insumos and composicoes from well-formed fixture', async () => {
    const buffer = await buildFixture()
    const result = await parseSinapiXlsx(buffer)

    expect(result.insumos).toHaveLength(3)
    expect(result.composicoes).toHaveLength(1)
    expect(result.warnings).toHaveLength(0)

    const cimento = result.insumos[0]
    expect(cimento.codigo).toBe('00001')
    expect(cimento.descricao).toBe('Cimento CP-II 50kg')
    expect(cimento.unidade).toBe('SC')
    expect(cimento.categoria).toBe('MATERIAL')
    expect(cimento.preco_unitario).toBe(38.5)

    const alvenaria = result.composicoes[0]
    expect(alvenaria.codigo).toBe('87471')
    expect(alvenaria.insumos).toHaveLength(3)
    expect(alvenaria.insumos[0]).toEqual({
      codigo: '00001',
      quantidade: 0.5,
      preco_unitario: 38.5,
    })
  })

  it('normalizes headers with case and accents (DESCRIÇÃO, Preço Unitário)', async () => {
    const buffer = await buildFixture({ headerCasing: 'accented' })
    const result = await parseSinapiXlsx(buffer)
    expect(result.insumos.length).toBeGreaterThan(0)
  })

  it('throws when expected sheet is missing', async () => {
    const buffer = await buildFixture({ omitSheet: 'insumos' })
    await expect(parseSinapiXlsx(buffer)).rejects.toThrow(/Insumos.*não encontrada/)
  })

  it('ignores duplicate insumo codes and emits a warning', async () => {
    const buffer = await buildFixture({
      insumos: [
        { codigo: '00001', descricao: 'Cimento A', unidade: 'SC', categoria: 'MATERIAL', preco_unitario: 40 },
        { codigo: '00001', descricao: 'Cimento B', unidade: 'SC', categoria: 'MATERIAL', preco_unitario: 42 },
      ],
    })
    const result = await parseSinapiXlsx(buffer)
    expect(result.insumos).toHaveLength(1)
    expect(result.insumos[0].descricao).toBe('Cimento A')
    expect(result.warnings.some((w) => w.includes('duplicado'))).toBe(true)
  })

  it('rejects rows with negative prices', async () => {
    const buffer = await buildFixture({
      insumos: [
        { codigo: 'X1', descricao: 'Negativo', unidade: 'UN', categoria: null, preco_unitario: -5 },
        { codigo: 'X2', descricao: 'Ok', unidade: 'UN', categoria: null, preco_unitario: 10 },
      ],
    })
    const result = await parseSinapiXlsx(buffer)
    expect(result.insumos).toHaveLength(1)
    expect(result.insumos[0].codigo).toBe('X2')
    expect(result.warnings.some((w) => w.includes('preço inválido'))).toBe(true)
  })

  it('rejects rows with missing descricao or unidade', async () => {
    const buffer = await buildFixture({
      insumos: [
        { codigo: 'Y1', descricao: '', unidade: 'UN', categoria: null, preco_unitario: 10 },
        { codigo: 'Y2', descricao: 'Ok', unidade: '', categoria: null, preco_unitario: 10 },
        { codigo: 'Y3', descricao: 'Ok', unidade: 'UN', categoria: null, preco_unitario: 10 },
      ],
    })
    const result = await parseSinapiXlsx(buffer)
    expect(result.insumos).toHaveLength(1)
    expect(result.insumos[0].codigo).toBe('Y3')
  })

  it('handles composicao with invalid insumos_json gracefully', async () => {
    const buffer = await buildFixture({
      composicoes: [
        {
          codigo: 'C1',
          descricao: 'Teste',
          unidade: 'M2',
          grupo: null,
          preco_unitario: 50,
          insumos_json: '{not-valid-json',
        },
        {
          codigo: 'C2',
          descricao: 'Teste 2',
          unidade: 'M2',
          grupo: null,
          preco_unitario: 60,
          insumos_json: '[{"codigo":"X"}]',
        },
      ],
    })
    const result = await parseSinapiXlsx(buffer)
    expect(result.composicoes).toHaveLength(2)
    expect(result.composicoes[0].insumos).toEqual([])
    expect(result.composicoes[1].insumos).toEqual([])
    expect(result.warnings.length).toBeGreaterThanOrEqual(1)
  })

  it('respects maxRows option', async () => {
    const insumos = Array.from({ length: 10 }, (_, i) => ({
      codigo: `I${i}`,
      descricao: `Item ${i}`,
      unidade: 'UN',
      categoria: null,
      preco_unitario: i + 1,
    }))
    const buffer = await buildFixture({ insumos })
    const result = await parseSinapiXlsx(buffer, { maxRows: 3 })
    expect(result.insumos).toHaveLength(3)
  })

  it('parses numeric strings with BR formatting (comma decimals)', async () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Insumos')
    ws.columns = ['codigo', 'descricao', 'unidade', 'categoria', 'preco_unitario'].map((key) => ({
      header: key,
      key,
    }))
    ws.addRow({ codigo: 'BR1', descricao: 'Teste BR', unidade: 'UN', categoria: null, preco_unitario: '1.234,56' })

    const ws2 = wb.addWorksheet('Composicoes')
    ws2.columns = ['codigo', 'descricao', 'unidade', 'grupo', 'preco_unitario', 'insumos_json'].map((key) => ({
      header: key,
      key,
    }))

    const buf = Buffer.from(await wb.xlsx.writeBuffer())
    const result = await parseSinapiXlsx(buf)
    expect(result.insumos).toHaveLength(1)
    expect(result.insumos[0].preco_unitario).toBe(1234.56)
  })
})
