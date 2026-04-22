import { describe, expect, it } from 'vitest'
import { parseMemorialMd, MEMORIAL_TEMPLATE } from './memorial'

describe('parseMemorialMd', () => {
  it('returns empty array for null/undefined/empty', () => {
    expect(parseMemorialMd(null)).toEqual([])
    expect(parseMemorialMd(undefined)).toEqual([])
    expect(parseMemorialMd('')).toEqual([])
  })

  it('parses h1, h2, h3', () => {
    const out = parseMemorialMd('# Título\n\n## Subt\n\n### Sub-sub')
    expect(out).toEqual([
      { kind: 'h1', text: 'Título' },
      { kind: 'h2', text: 'Subt' },
      { kind: 'h3', text: 'Sub-sub' },
    ])
  })

  it('groups consecutive bullets into one ul', () => {
    const out = parseMemorialMd('- item 1\n- item 2\n* item 3')
    expect(out).toEqual([{ kind: 'ul', items: ['item 1', 'item 2', 'item 3'] }])
  })

  it('splits bullets when separated by paragraphs', () => {
    const out = parseMemorialMd('- a\n- b\n\ntexto\n\n- c')
    expect(out).toEqual([
      { kind: 'ul', items: ['a', 'b'] },
      { kind: 'p', text: 'texto' },
      { kind: 'ul', items: ['c'] },
    ])
  })

  it('joins consecutive non-empty lines into a single paragraph', () => {
    const out = parseMemorialMd('linha 1\nlinha 2\nlinha 3\n\noutro')
    expect(out).toEqual([
      { kind: 'p', text: 'linha 1 linha 2 linha 3' },
      { kind: 'p', text: 'outro' },
    ])
  })

  it('handles CRLF line endings', () => {
    const out = parseMemorialMd('# título\r\n\r\ntexto')
    expect(out).toEqual([
      { kind: 'h1', text: 'título' },
      { kind: 'p', text: 'texto' },
    ])
  })

  it('parses the default template into a non-trivial structure', () => {
    const out = parseMemorialMd(MEMORIAL_TEMPLATE)
    // pelo menos 1 h1, vários h2 e 1 ul
    expect(out.some(b => b.kind === 'h1')).toBe(true)
    expect(out.filter(b => b.kind === 'h2').length).toBeGreaterThanOrEqual(5)
    expect(out.some(b => b.kind === 'ul')).toBe(true)
  })

  it('ignores trailing whitespace-only lines', () => {
    const out = parseMemorialMd('# x\n   \n\t\n')
    expect(out).toEqual([{ kind: 'h1', text: 'x' }])
  })
})
