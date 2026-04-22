'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, ClipboardCheck, Send, FileDown, BarChart3 } from 'lucide-react'
import { formatBRL } from '../../lib/pricingEngine'

type BudgetStatus = 'AI_DRAFT' | 'IN_REVIEW' | 'VALIDATED' | 'REJECTED'
type Confidence = 'HIGH' | 'MEDIUM' | 'LOW'

interface BudgetItem {
  id: string
  code: string | null
  description: string
  unit: string
  quantity: number
  unit_cost: number | null
  total_cost: number | null
  confidence: Confidence
  origin: string
  category: string | null
}

interface Budget {
  id: string
  name: string
  version: number
  status: BudgetStatus
  type: string
  price_base: string
  total_cost: number | null
  bdi_percentage: number | null
  project_id: string
  projects: { name: string; client_name: string | null } | null
}

const confColor: Record<Confidence, string> = { HIGH: '#16A085', MEDIUM: '#E67E22', LOW: '#C0392B' }
const confLabel: Record<Confidence, string> = { HIGH: '🟢 Alta', MEDIUM: '🟡 Média', LOW: '🔴 Baixa' }
const statusLabel: Record<BudgetStatus, string> = {
  AI_DRAFT: 'Rascunho IA', IN_REVIEW: 'Em revisão', VALIDATED: 'Validado', REJECTED: 'Rejeitado',
}

export default function AdminBudgetDetail() {
  const { id } = useParams() as { id: string }
  const [budget, setBudget] = useState<Budget | null>(null)
  const [items, setItems] = useState<BudgetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    const [bRes, iRes] = await Promise.all([
      supabase.from('budgets').select('id, name, version, status, type, price_base, total_cost, bdi_percentage, project_id, projects!inner(name, client_name)').eq('id', id).single(),
      supabase.from('budget_items').select('*').eq('budget_id', id).order('category').order('description'),
    ])
    setBudget((bRes.data as unknown as Budget) || null)
    setItems((iRes.data as unknown as BudgetItem[]) || [])
    setLoading(false)
  }

  useEffect(() => { if (id) load() }, [id])

  async function submitForReview() {
    if (!budget) return
    if (items.length === 0) { alert('Budget sem itens — adicione itens antes de enviar para revisão.'); return }
    setSubmitting(true)
    const { error } = await supabase.rpc('submit_budget_for_review', { p_budget_id: budget.id })
    setSubmitting(false)
    if (error) { alert('Erro: ' + error.message); return }
    await load()
  }

  if (loading) return <div className="loading">Carregando...</div>
  if (!budget) return <div className="empty-state"><h3>Orçamento não encontrado</h3></div>

  const subtotal = items.reduce((s, it) => s + Number(it.total_cost ?? 0), 0)
  const bdiMult = budget.bdi_percentage ? 1 + Number(budget.bdi_percentage) / 100 : 1
  const total = subtotal * bdiMult

  return (
    <>
      <div className="page-header">
        <div>
          <Link href="/admin/orcamentos" className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }}>
            <ArrowLeft size={14} /> Voltar
          </Link>
          <h2>{budget.name}</h2>
          <p>{budget.projects?.name} · {budget.projects?.client_name || '—'} · v{budget.version} · {statusLabel[budget.status]}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {items.length > 0 && (
            <Link href={`/admin/orcamentos/${budget.id}/curva-abc`} className="btn btn-outline">
              <BarChart3 size={14} /> Curva ABC
            </Link>
          )}
          {budget.status === 'AI_DRAFT' && (
            <button className="btn btn-primary" onClick={submitForReview} disabled={submitting}>
              <Send size={14} /> {submitting ? 'Enviando...' : 'Enviar para revisão'}
            </button>
          )}
          {budget.status === 'IN_REVIEW' && (
            <Link href={`/admin/orcamentos/${budget.id}/revisar`} className="btn btn-primary">
              <ClipboardCheck size={14} /> Revisar
            </Link>
          )}
          {budget.status === 'VALIDATED' && (
            <a
              href={`/api/budgets/${budget.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <FileDown size={14} /> Baixar PDF
            </a>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: 16 }}><h3>Itens ({items.length})</h3></div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descrição</th>
              <th>Unid.</th>
              <th style={{ textAlign: 'right' }}>Qtde</th>
              <th style={{ textAlign: 'right' }}>Custo unit.</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th>Confiança</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.code || '—'}</td>
                <td>
                  <div>{it.description}</div>
                  {it.category && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{it.category}</div>}
                </td>
                <td>{it.unit}</td>
                <td style={{ textAlign: 'right' }}>{Number(it.quantity).toLocaleString('pt-BR')}</td>
                <td style={{ textAlign: 'right' }}>{it.unit_cost != null ? formatBRL(Number(it.unit_cost)) : '—'}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{it.total_cost != null ? formatBRL(Number(it.total_cost)) : '—'}</td>
                <td style={{ color: confColor[it.confidence] }}>{confLabel[it.confidence]}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={5} style={{ textAlign: 'right' }}>Subtotal</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{formatBRL(subtotal)}</td><td /></tr>
            {budget.bdi_percentage != null && (
              <tr><td colSpan={5} style={{ textAlign: 'right' }}>BDI ({Number(budget.bdi_percentage).toFixed(1)}%)</td><td style={{ textAlign: 'right' }}>{formatBRL(total - subtotal)}</td><td /></tr>
            )}
            <tr><td colSpan={5} style={{ textAlign: 'right' }}><strong>Total</strong></td><td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-warm)' }}><strong>{formatBRL(total)}</strong></td><td /></tr>
          </tfoot>
        </table>
      </div>
    </>
  )
}
