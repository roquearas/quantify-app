import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Log {
  id: string
  agent_name: string
  action: string
  status: string
  request_id: string | null
  created_at: string
}

const statusClass: Record<string, string> = {
  SUCCESS: 'badge-validated',
  RUNNING: 'badge-review',
  FAILED: 'badge-rejected',
  WARNING: 'badge-draft',
}

export default function AdminAgentLogs() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')

  useEffect(() => {
    supabase.from('agent_logs').select('*').order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => {
        setLogs((data as unknown as Log[]) || [])
        setLoading(false)
      })
  }, [])

  const filtered = filter
    ? logs.filter((l) => l.agent_name.toLowerCase().includes(filter.toLowerCase()) || l.action.toLowerCase().includes(filter.toLowerCase()))
    : logs

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Agent Logs</h2>
          <p>Trilha auditável de cada execução dos agentes de IA.</p>
        </div>
        <div className="search-input-wrapper" style={{ minWidth: 260 }}>
          <input
            className="search-input"
            placeholder="Filtrar por agente ou ação..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <h3>Sem execuções</h3>
            <p>Quando os agentes rodarem (cotação, composição, análise), tudo aparece aqui.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Quando</th><th>Agente</th><th>Ação</th><th>Status</th><th>Request</th></tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>
                    {new Date(l.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td style={{ fontWeight: 600 }}>{l.agent_name}</td>
                  <td>{l.action}</td>
                  <td><span className={`badge ${statusClass[l.status] || ''}`}>{l.status}</span></td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{l.request_id?.slice(0, 8) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
