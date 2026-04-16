import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowRight } from 'lucide-react'

interface Stats {
  requests: number
  pending: number
  underReview: number
  validated: number
  companies: number
  services: number
}

const stageLabel: Record<string, string> = {
  RECEIVED: 'Recebido', QUOTING: 'Cotando', COMPOSING: 'Compondo',
  UNDER_REVIEW: 'Em revisão', VALIDATED: 'Validado', SENT: 'Enviado',
  ACCEPTED: 'Aceito', REJECTED: 'Rejeitado', CANCELLED: 'Cancelado',
}

const stageClass: Record<string, string> = {
  RECEIVED: 'badge-review', QUOTING: 'badge-review', COMPOSING: 'badge-review',
  UNDER_REVIEW: 'badge-draft', VALIDATED: 'badge-validated', SENT: 'badge-validated',
  ACCEPTED: 'badge-validated', REJECTED: 'badge-rejected', CANCELLED: 'badge-rejected',
}

interface RequestRow {
  id: string
  title: string
  stage: string
  created_at: string
  services: { name: string } | null
  companies: { name: string } | null
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ requests: 0, pending: 0, underReview: 0, validated: 0, companies: 0, services: 0 })
  const [focus, setFocus] = useState<RequestRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [reqAll, pending, review, validated, companies, services, focusList] = await Promise.all([
        supabase.from('service_requests').select('id', { count: 'exact', head: true }),
        supabase.from('service_requests').select('id', { count: 'exact', head: true }).in('stage', ['RECEIVED', 'QUOTING', 'COMPOSING']),
        supabase.from('service_requests').select('id', { count: 'exact', head: true }).eq('stage', 'UNDER_REVIEW'),
        supabase.from('service_requests').select('id', { count: 'exact', head: true }).eq('stage', 'VALIDATED'),
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('services').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('service_requests')
          .select('id, title, stage, created_at, services(name), companies(name)')
          .in('stage', ['RECEIVED', 'QUOTING', 'COMPOSING', 'UNDER_REVIEW'])
          .order('created_at', { ascending: true })
          .limit(8),
      ])
      setStats({
        requests: reqAll.count || 0,
        pending: pending.count || 0,
        underReview: review.count || 0,
        validated: validated.count || 0,
        companies: companies.count || 0,
        services: services.count || 0,
      })
      setFocus((focusList.data as unknown as RequestRow[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="loading">Carregando...</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Dashboard administrativo</h2>
          <p>Visão operacional: tudo que precisa de foco e validação.</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="card"><div className="kpi-label">Solicitações</div><div className="kpi-value">{stats.requests}</div></div>
        <div className="card"><div className="kpi-label">Em andamento</div><div className="kpi-value">{stats.pending}</div></div>
        <div className="card"><div className="kpi-label">Em revisão</div><div className="kpi-value">{stats.underReview}</div></div>
        <div className="card"><div className="kpi-label">Validadas</div><div className="kpi-value">{stats.validated}</div></div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="card"><div className="kpi-label">Empresas clientes</div><div className="kpi-value">{stats.companies}</div></div>
        <div className="card"><div className="kpi-label">Serviços ativos</div><div className="kpi-value">{stats.services}</div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Projetos em foco</h3>
          <Link to="/admin/kanban" className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px' }}>
            Kanban completo <ArrowRight size={12} />
          </Link>
        </div>
        {focus.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nada aguardando ação.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Cliente</th><th>Título</th><th>Serviço</th><th>Estágio</th><th>Criada</th></tr>
            </thead>
            <tbody>
              {focus.map((r) => (
                <tr key={r.id}>
                  <td>{r.companies?.name || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{r.title}</td>
                  <td>{r.services?.name || '—'}</td>
                  <td><span className={`badge ${stageClass[r.stage] || ''}`}>{stageLabel[r.stage] || r.stage}</span></td>
                  <td>{new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
