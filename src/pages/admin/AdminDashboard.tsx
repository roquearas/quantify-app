import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  ArrowRight, Clock, AlertTriangle, Bot, CheckCircle2, Activity,
  TrendingUp, Users as UsersIcon, Briefcase, Calendar,
} from 'lucide-react'

interface Stats {
  requests: number
  received: number
  quoting: number
  composing: number
  underReview: number
  validated: number
  sent: number
  accepted: number
  rejected: number
  companies: number
  services: number
  thisWeek: number
  overdue: number
}

interface AgentStats {
  running: number
  success: number
  failed: number
  warning: number
  last24h: number
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
  deadline: string | null
  services: { name: string } | null
  companies: { name: string } | null
}

interface AgentLog {
  id: string
  agent: string
  action: string
  status: string
  created_at: string
  request_id: string | null
}

interface StageFlow {
  stage: string
  count: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    requests: 0, received: 0, quoting: 0, composing: 0, underReview: 0,
    validated: 0, sent: 0, accepted: 0, rejected: 0,
    companies: 0, services: 0, thisWeek: 0, overdue: 0,
  })
  const [agentStats, setAgentStats] = useState<AgentStats>({ running: 0, success: 0, failed: 0, warning: 0, last24h: 0 })
  const [focus, setFocus] = useState<RequestRow[]>([])
  const [deadlines, setDeadlines] = useState<RequestRow[]>([])
  const [recentAgents, setRecentAgents] = useState<AgentLog[]>([])
  const [stageFlow, setStageFlow] = useState<StageFlow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      const today = now.toISOString().slice(0, 10)

      const [
        reqAll, received, quoting, composing, underReview, validated, sent, accepted, rejected,
        companies, services, thisWeek, overdue,
        focusList, deadlineList,
        agRunning, agSuccess, agFailed, agWarning, agLast24h, agRecent,
      ] = await Promise.all([
        supabase.from('service_requests').select('id', { count: 'exact', head: true }),
        supabase.from('service_requests').select('id', { count: 'exact', head: true }).eq('stage', 'RECEIVED'),
        supabase.from('service_requests').select('id', { count: 'exact', head: true }).eq('stage', 'QUOTING'),
        supabase.from('service_requests').select('id', { count: 'exact', head: true }).eq('stage', 'COMPOSING'),
        supabase.from('service_requests').select('id', { count: 'exact', head: true }).eq('stage', 'UNDER_REVIEW'),
        supabase.from('service_requests').select('id', { count: 'exact', head: true }).eq('stage', 'VALIDATED'),
        supabase.from('service_requests').select('id', { count: 'exact', head: true }).eq('stage', 'SENT'),
        supabase.from('service_requests').select('id', { count: 'exact', head: true }).eq('stage', 'ACCEPTED'),
        supabase.from('service_requests').select('id', { count: 'exact', head: true }).eq('stage', 'REJECTED'),
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('services').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('service_requests').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('service_requests').select('id', { count: 'exact', head: true })
          .lt('deadline', today).not('stage', 'in', '(ACCEPTED,REJECTED,CANCELLED)'),
        supabase.from('service_requests')
          .select('id, title, stage, created_at, deadline, services(name), companies(name)')
          .in('stage', ['RECEIVED', 'QUOTING', 'COMPOSING', 'UNDER_REVIEW'])
          .order('created_at', { ascending: true })
          .limit(8),
        supabase.from('service_requests')
          .select('id, title, stage, created_at, deadline, services(name), companies(name)')
          .not('deadline', 'is', null)
          .not('stage', 'in', '(ACCEPTED,REJECTED,CANCELLED)')
          .order('deadline', { ascending: true })
          .limit(6),
        supabase.from('agent_logs').select('id', { count: 'exact', head: true }).eq('status', 'RUNNING'),
        supabase.from('agent_logs').select('id', { count: 'exact', head: true }).eq('status', 'SUCCESS'),
        supabase.from('agent_logs').select('id', { count: 'exact', head: true }).eq('status', 'FAILED'),
        supabase.from('agent_logs').select('id', { count: 'exact', head: true }).eq('status', 'WARNING'),
        supabase.from('agent_logs').select('id', { count: 'exact', head: true }).gte('created_at', dayAgo),
        supabase.from('agent_logs').select('*').order('created_at', { ascending: false }).limit(6),
      ])

      // Flow counts per stage (for bars)
      const flowData: StageFlow[] = [
        { stage: 'RECEIVED', count: received.count || 0 },
        { stage: 'QUOTING', count: quoting.count || 0 },
        { stage: 'COMPOSING', count: composing.count || 0 },
        { stage: 'UNDER_REVIEW', count: underReview.count || 0 },
        { stage: 'VALIDATED', count: validated.count || 0 },
        { stage: 'SENT', count: sent.count || 0 },
        { stage: 'ACCEPTED', count: accepted.count || 0 },
      ]

      setStats({
        requests: reqAll.count || 0,
        received: received.count || 0,
        quoting: quoting.count || 0,
        composing: composing.count || 0,
        underReview: underReview.count || 0,
        validated: validated.count || 0,
        sent: sent.count || 0,
        accepted: accepted.count || 0,
        rejected: rejected.count || 0,
        companies: companies.count || 0,
        services: services.count || 0,
        thisWeek: thisWeek.count || 0,
        overdue: overdue.count || 0,
      })
      setAgentStats({
        running: agRunning.count || 0,
        success: agSuccess.count || 0,
        failed: agFailed.count || 0,
        warning: agWarning.count || 0,
        last24h: agLast24h.count || 0,
      })
      setFocus((focusList.data as unknown as RequestRow[]) || [])
      setDeadlines((deadlineList.data as unknown as RequestRow[]) || [])
      setRecentAgents((agRecent.data as AgentLog[]) || [])
      setStageFlow(flowData)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="loading">Carregando...</div>

  const inProgress = stats.received + stats.quoting + stats.composing + stats.underReview
  const maxFlow = Math.max(1, ...stageFlow.map((s) => s.count))

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Dashboard administrativo</h2>
          <p>Métricas, prazos, agentes em execução e projetos em foco.</p>
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card kpi-card">
          <div className="kpi-icon kpi-blue"><Briefcase size={16} /></div>
          <div>
            <div className="kpi-label">Total de solicitações</div>
            <div className="kpi-value">{stats.requests}</div>
            <div className="kpi-sub">+{stats.thisWeek} esta semana</div>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon kpi-orange"><Activity size={16} /></div>
          <div>
            <div className="kpi-label">Em andamento</div>
            <div className="kpi-value">{inProgress}</div>
            <div className="kpi-sub">{stats.underReview} em revisão técnica</div>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon kpi-green"><CheckCircle2 size={16} /></div>
          <div>
            <div className="kpi-label">Concluídas</div>
            <div className="kpi-value">{stats.accepted}</div>
            <div className="kpi-sub">{stats.sent} aguardando aceite</div>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon kpi-red"><AlertTriangle size={16} /></div>
          <div>
            <div className="kpi-label">Prazos vencidos</div>
            <div className="kpi-value">{stats.overdue}</div>
            <div className="kpi-sub">requerem atenção imediata</div>
          </div>
        </div>
      </div>

      {/* Agentes de IA + Clientes */}
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="card kpi-card">
          <div className="kpi-icon kpi-purple"><Bot size={16} /></div>
          <div>
            <div className="kpi-label">Agentes rodando</div>
            <div className="kpi-value">{agentStats.running}</div>
            <div className="kpi-sub">{agentStats.last24h} execuções em 24h</div>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon kpi-green"><CheckCircle2 size={16} /></div>
          <div>
            <div className="kpi-label">Agentes OK</div>
            <div className="kpi-value">{agentStats.success}</div>
            <div className="kpi-sub">{agentStats.warning} warnings</div>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon kpi-red"><AlertTriangle size={16} /></div>
          <div>
            <div className="kpi-label">Agentes com falha</div>
            <div className="kpi-value">{agentStats.failed}</div>
            <div className="kpi-sub">investigar nos logs</div>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon kpi-blue"><UsersIcon size={16} /></div>
          <div>
            <div className="kpi-label">Empresas clientes</div>
            <div className="kpi-value">{stats.companies}</div>
            <div className="kpi-sub">{stats.services} serviços ativos</div>
          </div>
        </div>
      </div>

      {/* Pipeline visual */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3><TrendingUp size={14} style={{ verticalAlign: 'middle' }} /> Pipeline de estágios</h3>
          <Link to="/admin/kanban" className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px' }}>
            Abrir Kanban <ArrowRight size={12} />
          </Link>
        </div>
        <div className="pipeline-bars">
          {stageFlow.map((s) => (
            <div className="pipeline-row" key={s.stage}>
              <div className="pipeline-label">{stageLabel[s.stage]}</div>
              <div className="pipeline-bar">
                <div
                  className={`pipeline-fill pipeline-${s.stage.toLowerCase()}`}
                  style={{ width: `${(s.count / maxFlow) * 100}%` }}
                />
              </div>
              <div className="pipeline-count">{s.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        {/* Projetos em foco */}
        <div className="card">
          <div className="card-header">
            <h3><Activity size={14} style={{ verticalAlign: 'middle' }} /> Projetos em foco</h3>
            <Link to="/admin/kanban" className="btn btn-outline" style={{ fontSize: 11, padding: '3px 8px' }}>
              Kanban <ArrowRight size={10} />
            </Link>
          </div>
          {focus.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nada aguardando ação.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Cliente</th><th>Título</th><th>Estágio</th></tr>
              </thead>
              <tbody>
                {focus.map((r) => (
                  <tr key={r.id}>
                    <td>{r.companies?.name || '—'}</td>
                    <td>
                      <Link to={`/admin/solicitacoes/${r.id}`} style={{ fontWeight: 600 }}>
                        {r.title}
                      </Link>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {r.services?.name}
                      </div>
                    </td>
                    <td><span className={`badge ${stageClass[r.stage] || ''}`}>{stageLabel[r.stage] || r.stage}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Próximos prazos */}
        <div className="card">
          <div className="card-header">
            <h3><Calendar size={14} style={{ verticalAlign: 'middle' }} /> Próximos prazos</h3>
          </div>
          {deadlines.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sem prazos cadastrados.</p>
          ) : (
            <ul className="deadline-list">
              {deadlines.map((r) => {
                const dueDate = r.deadline ? new Date(r.deadline) : null
                const diff = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0
                const overdue = diff < 0
                const urgent = diff >= 0 && diff <= 3
                return (
                  <li key={r.id} className={`deadline-item ${overdue ? 'overdue' : urgent ? 'urgent' : ''}`}>
                    <Clock size={14} />
                    <div style={{ flex: 1 }}>
                      <Link to={`/admin/solicitacoes/${r.id}`} className="deadline-title">{r.title}</Link>
                      <div className="deadline-meta">{r.companies?.name} • {stageLabel[r.stage]}</div>
                    </div>
                    <div className="deadline-date">
                      {dueDate?.toLocaleDateString('pt-BR')}
                      <div className="deadline-rel">
                        {overdue ? `${Math.abs(diff)}d atrasado` : diff === 0 ? 'hoje' : `em ${diff}d`}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Agentes recentes */}
      <div className="card">
        <div className="card-header">
          <h3><Bot size={14} style={{ verticalAlign: 'middle' }} /> Agentes recentes</h3>
          <Link to="/admin/agent-logs" className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px' }}>
            Todos os logs <ArrowRight size={12} />
          </Link>
        </div>
        {recentAgents.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum agente executou ainda</h3>
            <p>Quando cotação/composição/análise rodar, aparece aqui em tempo real.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Quando</th><th>Agente</th><th>Ação</th><th>Status</th></tr>
            </thead>
            <tbody>
              {recentAgents.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>
                    {new Date(l.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td style={{ fontWeight: 600 }}>{l.agent}</td>
                  <td>{l.action}</td>
                  <td>
                    <span className={`badge ${
                      l.status === 'SUCCESS' ? 'badge-validated' :
                      l.status === 'RUNNING' ? 'badge-review' :
                      l.status === 'FAILED' ? 'badge-rejected' :
                      'badge-draft'
                    }`}>{l.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
