import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { parseMemorialMd } from '../memorial'

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
const fmt = (n: number | null | undefined) => (n == null ? '—' : BRL.format(Number(n)))
const fmtNum = (n: number | null | undefined) => (n == null ? '—' : Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))

const styles = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 60, paddingHorizontal: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#0B1D3A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 12, borderBottom: '2pt solid #16A085' },
  brand: { fontSize: 24, fontWeight: 'bold', color: '#0B1D3A' },
  brandDot: { color: '#E67E22' },
  brandSub: { fontSize: 8, color: '#16A085', marginTop: 2 },
  docTitle: { textAlign: 'right' },
  docTitleLabel: { fontSize: 10, color: '#16A085', textTransform: 'uppercase', letterSpacing: 1 },
  docTitleValue: { fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  docMeta: { fontSize: 8, color: '#64748B', marginTop: 4 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', color: '#16A085', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  infoCell: { width: '50%', paddingHorizontal: 4, paddingVertical: 3 },
  infoLabel: { fontSize: 7, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 10, marginTop: 2 },
  table: { borderTop: '1pt solid #CBD5E1', borderLeft: '1pt solid #CBD5E1', borderRight: '1pt solid #CBD5E1' },
  tableRow: { flexDirection: 'row', borderBottom: '1pt solid #CBD5E1' },
  tableRowStriped: { backgroundColor: '#F8FAFC' },
  tableRowHeader: { backgroundColor: '#0B1D3A' },
  th: { padding: 5, fontSize: 8, fontWeight: 'bold', color: '#FFFFFF' },
  td: { padding: 5, fontSize: 8 },
  colCode: { width: '10%' },
  colDesc: { width: '38%' },
  colUnit: { width: '8%', textAlign: 'center' },
  colQty: { width: '10%', textAlign: 'right' },
  colUnitCost: { width: '14%', textAlign: 'right' },
  colTotal: { width: '14%', textAlign: 'right' },
  colConf: { width: '6%', textAlign: 'center' },
  totalsBox: { marginTop: 12, padding: 10, backgroundColor: '#F8FAFC', borderLeft: '3pt solid #16A085' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  totalsFinalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6, marginTop: 6, borderTop: '1pt solid #CBD5E1' },
  totalsLabel: { fontSize: 9, color: '#64748B' },
  totalsValue: { fontSize: 10 },
  totalsFinalLabel: { fontSize: 11, fontWeight: 'bold' },
  totalsFinalValue: { fontSize: 13, fontWeight: 'bold', color: '#E67E22' },
  trailRow: { flexDirection: 'row', paddingVertical: 3, borderBottom: '0.5pt solid #E2E8F0' },
  trailDate: { width: '18%', fontSize: 7, color: '#64748B' },
  trailStatus: { width: '14%', fontSize: 8, fontWeight: 'bold' },
  trailItem: { width: '40%', fontSize: 8 },
  trailComment: { width: '28%', fontSize: 7, color: '#64748B' },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, borderTop: '1pt solid #CBD5E1', paddingTop: 8 },
  footerLine1: { fontSize: 8, color: '#0B1D3A', textAlign: 'center' },
  footerLine2: { fontSize: 6, color: '#64748B', textAlign: 'center', marginTop: 3 },
  pageNum: { position: 'absolute', bottom: 8, right: 40, fontSize: 7, color: '#94A3B8' },
  memorialH1: { fontSize: 12, fontWeight: 'bold', marginTop: 10, marginBottom: 6, color: '#0B1D3A' },
  memorialH2: { fontSize: 10, fontWeight: 'bold', marginTop: 8, marginBottom: 4, color: '#16A085' },
  memorialH3: { fontSize: 9, fontWeight: 'bold', marginTop: 6, marginBottom: 3, color: '#0B1D3A' },
  memorialP: { fontSize: 9, marginBottom: 5, lineHeight: 1.5, textAlign: 'justify' },
  memorialLi: { fontSize: 9, marginBottom: 2, marginLeft: 10, lineHeight: 1.4 },
})

const ABC_COLOR: Record<CurvaAbcClasse, string> = {
  A: '#C0392B',
  B: '#E67E22',
  C: '#16A085',
}

const confSymbol: Record<string, string> = { HIGH: '●', MEDIUM: '●', LOW: '●' }
const confColor: Record<string, string> = { HIGH: '#16A085', MEDIUM: '#E67E22', LOW: '#C0392B' }

interface BudgetPDFProps {
  budget: {
    id: string
    name: string
    version: number
    status: string
    type: string
    price_base: string
    bdi_percentage: number | null
    total_cost: number | null
    memorial_md: string | null
    created_at: string
  }
  project: {
    id: string
    name: string
    type: string
    client_name: string | null
    city: string | null
    state: string | null
    total_area: number | null
  }
  items: Array<{
    id: string
    code: string | null
    description: string
    unit: string
    quantity: number
    unit_cost: number | null
    total_cost: number | null
    confidence: string
    category: string | null
  }>
  validations: Array<{
    id: string
    status: string
    item_type: string | null
    item_name: string | null
    comment: string | null
    created_at: string
  }>
  validator: {
    name: string
    crea: string | null
    when: string
  }
  contentHash: string
  generatedAt: string
}

export function BudgetPDF(props: BudgetPDFProps) {
  const { budget, project, items, validations, validator, contentHash, generatedAt } = props

  const subtotal = items.reduce((s, it) => s + Number(it.total_cost ?? 0), 0)
  const bdi = budget.bdi_percentage ? Number(budget.bdi_percentage) : 0
  const bdiAmount = subtotal * (bdi / 100)
  const total = subtotal + bdiAmount

  const memorialBlocks = parseMemorialMd(budget.memorial_md)

  const footerText = validator.crea
    ? `Validado por ${validator.name}, CREA ${validator.crea} em ${new Date(validator.when).toLocaleString('pt-BR')}`
    : `Validado por ${validator.name} em ${new Date(validator.when).toLocaleString('pt-BR')}`

  return (
    <Document
      title={`Orçamento ${budget.version} — ${project.name}`}
      author="Quantify"
      subject="Orçamento Analítico"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.brand}>Quantify<Text style={styles.brandDot}>.</Text></Text>
            <Text style={styles.brandSub}>Engenharia inteligente</Text>
          </View>
          <View style={styles.docTitle}>
            <Text style={styles.docTitleLabel}>Orçamento Analítico</Text>
            <Text style={styles.docTitleValue}>{budget.name}</Text>
            <Text style={styles.docMeta}>#{budget.id.slice(0, 8)} · v{budget.version} · emitido {new Date(generatedAt).toLocaleDateString('pt-BR')}</Text>
          </View>
        </View>

        {/* Project info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identificação do projeto</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoCell}><Text style={styles.infoLabel}>Projeto</Text><Text style={styles.infoValue}>{project.name}</Text></View>
            <View style={styles.infoCell}><Text style={styles.infoLabel}>Cliente</Text><Text style={styles.infoValue}>{project.client_name || '—'}</Text></View>
            <View style={styles.infoCell}><Text style={styles.infoLabel}>Tipologia</Text><Text style={styles.infoValue}>{project.type}</Text></View>
            <View style={styles.infoCell}><Text style={styles.infoLabel}>Localização</Text><Text style={styles.infoValue}>{[project.city, project.state].filter(Boolean).join(' / ') || '—'}</Text></View>
            <View style={styles.infoCell}><Text style={styles.infoLabel}>Área total</Text><Text style={styles.infoValue}>{project.total_area ? `${Number(project.total_area).toLocaleString('pt-BR')} m²` : '—'}</Text></View>
            <View style={styles.infoCell}><Text style={styles.infoLabel}>Tipo de orçamento</Text><Text style={styles.infoValue}>{budget.type} · base {budget.price_base}</Text></View>
          </View>
        </View>

        {/* Memorial descritivo */}
        {memorialBlocks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Memorial descritivo</Text>
            {memorialBlocks.map((b, i) => {
              if (b.kind === 'h1') return <Text key={i} style={styles.memorialH1}>{b.text}</Text>
              if (b.kind === 'h2') return <Text key={i} style={styles.memorialH2}>{b.text}</Text>
              if (b.kind === 'h3') return <Text key={i} style={styles.memorialH3}>{b.text}</Text>
              if (b.kind === 'p') return <Text key={i} style={styles.memorialP}>{b.text}</Text>
              if (b.kind === 'ul') return (
                <View key={i}>
                  {b.items.map((it, j) => <Text key={j} style={styles.memorialLi}>•  {it}</Text>)}
                </View>
              )
              return null
            })}
          </View>
        )}

        {/* Items table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Planilha analítica ({items.length} {items.length === 1 ? 'item' : 'itens'})</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableRowHeader]}>
              <Text style={[styles.th, styles.colCode]}>Código</Text>
              <Text style={[styles.th, styles.colDesc]}>Descrição</Text>
              <Text style={[styles.th, styles.colUnit]}>Unid.</Text>
              <Text style={[styles.th, styles.colQty]}>Qtde</Text>
              <Text style={[styles.th, styles.colUnitCost]}>Custo unit.</Text>
              <Text style={[styles.th, styles.colTotal]}>Total</Text>
              <Text style={[styles.th, styles.colConf]}> </Text>
            </View>
            {items.map((it, idx) => (
              <View key={it.id} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowStriped : {}]} wrap={false}>
                <Text style={[styles.td, styles.colCode]}>{it.code || '—'}</Text>
                <View style={[styles.colDesc, { padding: 5 }]}>
                  <Text style={{ fontSize: 8 }}>{it.description}</Text>
                  {it.category && <Text style={{ fontSize: 7, color: '#64748B', marginTop: 1 }}>{it.category}</Text>}
                </View>
                <Text style={[styles.td, styles.colUnit]}>{it.unit}</Text>
                <Text style={[styles.td, styles.colQty]}>{fmtNum(Number(it.quantity))}</Text>
                <Text style={[styles.td, styles.colUnitCost]}>{fmt(it.unit_cost)}</Text>
                <Text style={[styles.td, styles.colTotal]}>{fmt(it.total_cost)}</Text>
                <Text style={[styles.td, styles.colConf, { color: confColor[it.confidence] || '#64748B', fontWeight: 'bold' }]}>{confSymbol[it.confidence] || '-'}</Text>
              </View>
            ))}
          </View>

          {/* Totalizadores */}
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Custo direto (subtotal)</Text>
              <Text style={styles.totalsValue}>{fmt(subtotal)}</Text>
            </View>
            {bdi > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>BDI ({bdi.toFixed(2)}%)</Text>
                <Text style={styles.totalsValue}>{fmt(bdiAmount)}</Text>
              </View>
            )}
            <View style={styles.totalsFinalRow}>
              <Text style={styles.totalsFinalLabel}>Total geral</Text>
              <Text style={styles.totalsFinalValue}>{fmt(total)}</Text>
            </View>
          </View>
        </View>

        {/* Curva ABC */}
        {subtotal > 0 && (
          <View style={styles.abcSection} wrap={false}>
            <Text style={styles.sectionTitle}>Composição por curva ABC</Text>
            {(['A', 'B', 'C'] as const).map((classe) => {
              const row = abcSummary[classe]
              const percent = subtotal > 0 ? (row.sum / subtotal) * 100 : 0
              return (
                <View key={classe} style={styles.abcRow}>
                  <Text style={[styles.abcLabel, { color: ABC_COLOR[classe] }]}>{classe}</Text>
                  <Text style={styles.abcPct}>{percent.toFixed(1)}%</Text>
                  <Text style={styles.abcCount}>{row.count} {row.count === 1 ? 'item' : 'itens'}</Text>
                  <View style={styles.abcTrack}>
                    <View style={[styles.abcFill, { width: `${percent}%`, backgroundColor: ABC_COLOR[classe] }]} />
                  </View>
                  <Text style={styles.abcValue}>{fmt(row.sum)}</Text>
                </View>
              )
            })}
          </View>
        )}

        {/* Trilha de validações */}
        {validations.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Trilha de validação</Text>
            {validations.map((v) => (
              <View key={v.id} style={styles.trailRow}>
                <Text style={styles.trailDate}>{new Date(v.created_at).toLocaleString('pt-BR')}</Text>
                <Text style={[styles.trailStatus, { color: v.status === 'VALIDATED' ? '#16A085' : v.status === 'REJECTED' ? '#C0392B' : '#E67E22' }]}>{v.status}</Text>
                <Text style={styles.trailItem}>{v.item_name || '(budget)'}</Text>
                <Text style={styles.trailComment}>{v.comment || ''}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Legenda de confiança */}
        <View style={{ marginTop: 14, flexDirection: 'row', gap: 12 }}>
          <Text style={{ fontSize: 7, color: '#64748B' }}>Confiança: </Text>
          <Text style={{ fontSize: 7, color: '#16A085' }}>● Alta</Text>
          <Text style={{ fontSize: 7, color: '#E67E22' }}>● Média</Text>
          <Text style={{ fontSize: 7, color: '#C0392B' }}>● Baixa</Text>
        </View>

        {/* Footer fixo em cada página */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerLine1}>{footerText}</Text>
          <Text style={styles.footerLine2}>SHA-256: {contentHash}</Text>
        </View>
        <Text style={styles.pageNum} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  )
}
