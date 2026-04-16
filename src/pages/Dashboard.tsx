import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

interface Stats {
  projects: number
  budgets: number
  partners: number
  quotations: number
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

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ projects: 0, budgets: 0, partners: 0, quotations: 0 })
  const [recentProjects, setRecentProjects] = useState<any[]>([])
  const [recentBudgets, setRecentBudgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [pCount, bCount, partCount, qCount, projects, budgets] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('budgets').select('id', { count: 'exact', head: true }),
        supabase.from('partners').select('id', { count: 'exact', head: true }),
        supabase.from('quotations').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('budgets').select('*, projects(name)').order('created_at', { ascending: false }).limit(5),
      ])
      setStats({
        projects: pCount.count || 0,
        budgets: bCount.count || 0,
        partners: partCount.count || 0,
        quotations: qCount.count || 0,
      })
      setRecentProjects(projects.data || [])
      setRecentBudgets(budgets.data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="loading">Carregando...</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Visão geral da Quantify Engenharia</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="kpi-label">Projetos</div>
          <div className="kpi-value">{stats.projects}</div>
        </div>
        <div className="card">
          <div className="kpi-label">Orçamentos</div>
          <div className="kpi-value">{stats.budgets}</div>
        </div>
        <div className="card">
          <div className="kpi-label">Parceiros</div>
          <div className="kpi-value">{stats.partners}</div>
        </div>
        <div className="card">
          <div className="kpi-label">Cotações</div>
          <div className="kpi-value">{stats.quotations}</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3>Projetos recentes</h3>
            <Link to="/projetos" className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px' }}>
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          {recentProjects.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhum projeto ainda.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Nome</th><th>Tipo</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recentProjects.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><span className="chip chip-mixed">{p.type}</span></td>
                    <td><span className={`badge ${statusClass[p.status] || ''}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Orçamentos recentes</h3>
            <Link to="/orcamentos" className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px' }}>
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          {recentBudgets.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhum orçamento ainda.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Nome</th><th>Base</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recentBudgets.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(b as any).projects?.name}</div>
                    </td>
                    <td><span className={`chip chip-${b.price_base?.toLowerCase() || 'own'}`}>{b.price_base}</span></td>
                    <td><span className={`badge ${statusClass[b.status] || ''}`}>{statusLabel[b.status] || b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
