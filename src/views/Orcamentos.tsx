import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Calculator, Plus } from 'lucide-react'

const typeLabel: Record<string, string> = {
  PARAMETRIC: 'Paramétrico',
  ANALYTICAL: 'Analítico',
  HYBRID: 'Híbrido',
  ADDITIVE: 'Aditivo',
}

const statusLabel: Record<string, string> = {
  AI_DRAFT: 'Rascunho IA',
  IN_REVIEW: 'Em revisão',
  VALIDATED: 'Validado',
  REJECTED: 'Rejeitado',
}

const statusClass: Record<string, string> = {
  AI_DRAFT: 'badge-draft',
  IN_REVIEW: 'badge-review',
  VALIDATED: 'badge-validated',
  REJECTED: 'badge-rejected',
}

export default function Orcamentos() {
  const [budgets, setBudgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('budgets').select('*, projects(name, type)').order('created_at', { ascending: false })
      .then(({ data }) => { setBudgets(data || []); setLoading(false) })
  }, [])

  if (loading) return <div className="loading">Carregando orçamentos...</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Orçamentos</h2>
          <p>{budgets.length} orçamento(s)</p>
        </div>
        <button className="btn btn-primary"><Plus size={16} /> Novo orçamento</button>
      </div>

      {budgets.length === 0 ? (
        <div className="card empty-state">
          <Calculator size={48} />
          <h3>Nenhum orçamento</h3>
          <p>Vincule um orçamento a um projeto para começar.</p>
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
                <th>BDI</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>v{b.version}</div>
                  </td>
                  <td>{(b as any).projects?.name || '—'}</td>
                  <td>{typeLabel[b.type] || b.type}</td>
                  <td><span className={`chip chip-${b.price_base?.toLowerCase() || 'own'}`}>{b.price_base}</span></td>
                  <td>{b.bdi_percentage ? `${Number(b.bdi_percentage).toFixed(1)}%` : '—'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--accent-warm)' }}>
                    {b.total_cost ? `R$ ${Number(b.total_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td><span className={`badge ${statusClass[b.status]}`}>{statusLabel[b.status] || b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
