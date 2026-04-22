/**
 * Memorial descritivo — helpers para markdown minimalista.
 *
 * Escopo intencionalmente raso: o memorial é texto técnico curto
 * (1–3 páginas) preenchido pelo admin engenheiro. Não precisa ser
 * um parser de markdown completo — lidamos com:
 *
 *   # H1     → título grande
 *   ## H2    → subtítulo
 *   ### H3   → sub-sub (mesmo estilo do H2)
 *   - item   → bullet
 *   *       → bullet (alias)
 *   texto   → parágrafo
 *   (linha em branco → separador)
 *
 * Não suportamos bold/italic/links/code/tabelas — se o pilot pedir,
 * a gente evolui. YAGNI.
 */

export type MemorialBlock =
  | { kind: 'h1'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }

/**
 * Parse markdown simples em blocos renderizáveis.
 * Linhas em branco separam blocos. Bullets consecutivos viram uma `ul`.
 */
export function parseMemorialMd(md: string | null | undefined): MemorialBlock[] {
  if (!md) return []
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const blocks: MemorialBlock[] = []

  let paragraph: string[] = []
  let bullets: string[] = []

  function flushParagraph() {
    if (paragraph.length > 0) {
      blocks.push({ kind: 'p', text: paragraph.join(' ').trim() })
      paragraph = []
    }
  }
  function flushBullets() {
    if (bullets.length > 0) {
      blocks.push({ kind: 'ul', items: bullets.slice() })
      bullets = []
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (line.trim() === '') {
      flushParagraph()
      flushBullets()
      continue
    }
    const h1 = /^#\s+(.*)$/.exec(line)
    const h2 = /^##\s+(.*)$/.exec(line)
    const h3 = /^###\s+(.*)$/.exec(line)
    const li = /^[-*]\s+(.*)$/.exec(line)

    if (h1) { flushParagraph(); flushBullets(); blocks.push({ kind: 'h1', text: h1[1].trim() }); continue }
    if (h2) { flushParagraph(); flushBullets(); blocks.push({ kind: 'h2', text: h2[1].trim() }); continue }
    if (h3) { flushParagraph(); flushBullets(); blocks.push({ kind: 'h3', text: h3[1].trim() }); continue }
    if (li) { flushParagraph(); bullets.push(li[1].trim()); continue }

    flushBullets()
    paragraph.push(line.trim())
  }
  flushParagraph()
  flushBullets()
  return blocks
}

/** Memorial padrão sugerido (placeholder editável). */
export const MEMORIAL_TEMPLATE = `# Memorial descritivo

## 1. Objeto
Descrever o escopo da obra, localização e area total.

## 2. Normas técnicas
- ABNT NBR 6118 — Projeto de estruturas de concreto
- ABNT NBR 15575 — Desempenho de edificações habitacionais
- ABNT NBR 8800 — Projeto de estruturas de aço (quando aplicável)

## 3. Materiais e especificações
Descrever materiais principais (concreto, aço, alvenaria, revestimentos) com classe/fck/especificação.

## 4. Serviços preliminares
Mobilização, canteiro, instalações provisórias, sondagem.

## 5. Fundações e estrutura
Tipo de fundação, sistema estrutural, controle tecnológico.

## 6. Acabamentos
Pisos, revestimentos internos/externos, esquadrias, pintura.

## 7. Instalações
Hidráulica, elétrica, telefonia, segurança.

## 8. Considerações finais
Prazos, garantias, responsabilidade técnica.
`
