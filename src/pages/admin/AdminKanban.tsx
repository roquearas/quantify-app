import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

interface RequestRow {
  id: string
  title: string
  stage: string
  created_at: string
  services: { name: string } | null
  companies: { name: string } | null
}

const columns: { stage: string; label: string }[] = [
  { stage: 'RECEIVED', label: 'Recebido' },
  { stage: 'QUOTING', label: 'Cotando' },
  { stage: 'COMPOSING', label: 'Compondo' },
  { stage: 'UNDER_REVIEW', label: 'Em revisão' },
  { stage: 'VALIDATED', label: 'Validado' },
  { stage: 'SENT', label: 'Enviado' },
  { stage: 'ACCEPTED', label: 'Aceito' },
]

const stageNext: Record<string, string | null> = {
  RECEIVED: 'QUOTING', QUOTING: 'COMPOSING', COMPOSING: 'UNDER_REVIEW',
  UNDER_REVIEW: 'VALIDATED', VALIDATED: 'SENT', SENT: 'ACCEPTED', ACCEPTED: null,
}

export default function AdminKanban() {
  const [rows, setRows] = useState<RequestRow[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase
      .from('service_requests')
      .select('id, title, stage, created_at, services(name), companies(name)')
      .order('created_at', { ascending: true })
    setRows((data as unknown as RequestRow[]) || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function advance(id: string, current: string) {
    const nxt = stageNext[current]
    if (!nxt) return
    await supabase.from('service_requests').update({ stage: nxt }).eq('id', id)
    await supabase.from('request_stages').insert({ request_id: id, stage: nxt, note: 'Avançado via Kanban' })
    load()
  }

  if (loading) return <div className="loading">Carregando...</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Kanban</h2>
          <p>Gestão operacional dos estágios de cada solicitação.</p>
        </div>
      </div>

      <div className="kanban">
        {columns.map((c) => {
          const items = rows.filter((r) => r.stage === c.stage)
          return (
            <div className="kanban-col" key={c.stage}>
              <div className="kanban-col-header">
                <span>{c.label}</span>
                <span className="kanban-count">{items.length}</span>
              </div>
              <div className="kanban-cards">
                {items.map((r) => (
                  <div className="kanban-card" key={r.id}>
                    <div className="kanban-card-title">{r.title}</div>
                    <div className="kanban-card-meta">{r.companies?.name || '—'}</div>
                    <div className="kanban-card-meta">{r.services?.name || '—'}</div>
                    <div className="kanban-card-actions">
                      <Link to={`/admin/solicitacoes/${r.id}`} className="btn btn-outline btn-xs">Abrir</Link>
                      {stageNext[c.stage] && (
                        <button onClick={() => advance(r.id, c.stage)} className="btn btn-primary btn-xs">Avançar →</button>
                      )}
                    </div>
                  </div>
                ))}
                {items.length === 0 && <div className="kanban-empty">vazio</div>}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
