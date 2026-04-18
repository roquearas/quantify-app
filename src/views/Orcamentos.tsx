'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Calculator, Clock, ClipboardCheck, CheckCircle2, XCircle } from 'lucide-react'

type BudgetStatus = 'AI_DRAFT' | 'IN_REVIEW' | 'VALIDATED' | 'REJECTED'

interface BudgetRow {
  id: string
  name: string
  version: number
  status: BudgetStatus
  type: string
  price_base: string
  bdi_percentage: number | null
  total_cost: number | null
  confidence: number | null
  created_at: string
  projects: {
    id: string
    name: string
    client_name: string | null
  } | null
}

const statusLabel: Record<BudgetStatus, string> = {
  AI_DRAFT: 'Rascunho IA',
  IN_REVIEW: 'Em revisão',
  VALIDATED: 'Validado',
  REJECTED: 'Rejeitado',
}

const statusClass: Record<BudgetStatus, string> = {
  AI_DRAFT: 'badge-draft',
  IN_REVIEW: 'badge-review',
  VALIDATED: 'badge-validated',
  REJECTED: 'badge-rejected',
}

const statusIcon: Record<BudgetStatus, React.ReactNode> = {
  AI_DRAFT: <Clock size={12} />,
  IN_REVIEW: <ClipboardCheck size={12} />,
  VALIDATED: <CheckCircle2 size={12} />,
  REJECTED: <XCircle size={12} />,
}

export default function Orcamentos() {
  const [rows, setRows] = useState<BudgetRow[]>([])
  const [filter, setFilter] = useState<BudgetStatus | 'ALL'>('IN_REVIEW')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    let q = supabase
      .from('budgets')
      .select('id, name, version, status, type, price_base, bdi_percentage, total_cost, confidence, created_at, projects!inner(id, name, client_name)')
      .order('created_at', { ascending: false })
    if (filter !== 'ALL') q = q.eq('status', filter)
    const { data } = await q
    setRows((data as unknown as BudgetRow[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Orçamentos</h2>
          <p>Revisão humana antes de enviar proposta.</p>
        </div>
        <div className="filter-tabs" style={{ display: 'flex', gap: 6 }}>
          {(['IN_REVIEW', 'AI_DRAFT', 'VALIDATED', 'REJECTED', 'ALL'] as const).map((f) => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'Todos' : statusLabel[f]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : rows.length === 0 ? (
        <div className="card empty-state">
          <Calculator size={48} />
          <h3>Nada aqui</h3>
          <p>Nenhum orçamento com esse status.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Orçamento</th>
                <th>Projeto</th>
                <th>Tipo</th>
                <th>Base</th>
                <th style={{ textAlign: 'right' }}>BDI</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} style={{ cursor: 'pointer' }}>
                  <td>
                    <Link href={`/admin/orcamentos/${b.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      <div style={{ fontWeight: 600 }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>v{b.version}</div>
                    </Link>
                  </td>
                  <td>
                    <div>{b.projects?.name || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.projects?.client_name || ''}</div>
                  </td>
                  <td>{b.type}</td>
                  <td><span className={`chip chip-${b.price_base?.toLowerCase() || 'own'}`}>{b.price_base}</span></td>
                  <td style={{ textAlign: 'right' }}>{b.bdi_percentage ? `${Number(b.bdi_percentage).toFixed(1)}%` : '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-warm)' }}>
                    {b.total_cost ? `R$ ${Number(b.total_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td>
                    <span className={`badge ${statusClass[b.status]}`}>
                      {statusIcon[b.status]} {statusLabel[b.status] || b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
