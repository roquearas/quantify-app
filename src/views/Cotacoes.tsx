import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ShoppingCart, ChevronDown, ChevronUp, Check, Clock, XCircle, Award } from 'lucide-react'

interface Quotation {
  id: string
  title: string
  status: string
  deadline: string | null
  project_id: string
  projects: { name: string } | null
  created_at: string
  quotes: Quote[]
}

interface Quote {
  id: string
  total_price: number | null
  payment_terms: string | null
  deadline: string | null
  notes: string | null
  is_selected: boolean
  submitted_at: string
  partners: { name: string } | null
}

const statusLabel: Record<string, string> = {
  OPEN: 'Aberta',
  CLOSED: 'Fechada',
  AWARDED: 'Adjudicada',
  CANCELLED: 'Cancelada',
}

const statusIcon: Record<string, React.ReactNode> = {
  OPEN: <Clock size={13} />,
  CLOSED: <XCircle size={13} />,
  AWARDED: <Award size={13} />,
  CANCELLED: <XCircle size={13} />,
}

const statusClass: Record<string, string> = {
  OPEN: 'badge-review',
  CLOSED: 'badge-draft',
  AWARDED: 'badge-validated',
  CANCELLED: 'badge-rejected',
}

function formatBRL(v: number | null) {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

export default function Cotacoes() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('quotations')
        .select('*, projects(name), quotes(*, partners(name))')
        .order('created_at', { ascending: false })
      setQuotations((data as Quotation[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="loading">Carregando...</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Cotações</h2>
          <p>{quotations.length} cotações registradas</p>
        </div>
        <button className="btn btn-primary">
          <ShoppingCart size={16} /> Nova cotação
        </button>
      </div>

      {quotations.length === 0 ? (
        <div className="card empty-state">
          <ShoppingCart size={48} />
          <h3>Nenhuma cotação</h3>
          <p>Crie cotações para solicitar preços de materiais e serviços aos seus parceiros.</p>
        </div>
      ) : (
        <div className="quotations-list">
          {quotations.map((q) => {
            const isExpanded = expandedId === q.id
            const quotes = q.quotes || []
            return (
              <div key={q.id} className="card quotation-card">
                <div
                  className="quotation-row"
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="quotation-info">
                    <h4>{q.title}</h4>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {q.projects?.name}
                    </span>
                  </div>
                  <div className="quotation-meta">
                    <span className="quotation-deadline">
                      <Clock size={13} /> {formatDate(q.deadline)}
                    </span>
                    <span className="quotation-quotes-count">
                      {quotes.length} proposta{quotes.length !== 1 ? 's' : ''}
                    </span>
                    <span className={`badge ${statusClass[q.status] || ''}`}>
                      {statusIcon[q.status]} {statusLabel[q.status] || q.status}
                    </span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="quotation-detail">
                    {quotes.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>
                        Nenhuma proposta recebida ainda.
                      </p>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Fornecedor</th>
                            <th>Valor total</th>
                            <th>Condição pgto</th>
                            <th>Prazo entrega</th>
                            <th>Obs</th>
                            <th>Selecionada</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quotes.map((qt) => (
                            <tr key={qt.id} className={qt.is_selected ? 'row-selected' : ''}>
                              <td style={{ fontWeight: 600 }}>{qt.partners?.name || '—'}</td>
                              <td style={{ fontWeight: 600, color: 'var(--accent)' }}>
                                {formatBRL(qt.total_price ? Number(qt.total_price) : null)}
                              </td>
                              <td>{qt.payment_terms || '—'}</td>
                              <td>{qt.deadline || '—'}</td>
                              <td style={{ fontSize: 12, maxWidth: 200 }}>{qt.notes || '—'}</td>
                              <td style={{ textAlign: 'center' }}>
                                {qt.is_selected && (
                                  <span className="badge badge-validated">
                                    <Check size={12} /> Selecionada
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
