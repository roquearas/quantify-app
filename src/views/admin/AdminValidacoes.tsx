import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { ShieldCheck, XCircle } from 'lucide-react'

interface RequestRow {
  id: string
  title: string
  stage: string
  created_at: string
  project_type: string | null
  total_area: number | null
  description: string | null
  services: { name: string } | null
  companies: { name: string } | null
}

export default function AdminValidacoes() {
  const { user } = useAuth()
  const [rows, setRows] = useState<RequestRow[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase
      .from('service_requests')
      .select('id, title, stage, created_at, project_type, total_area, description, services(name), companies(name)')
      .eq('stage', 'UNDER_REVIEW')
      .order('created_at', { ascending: true })
    setRows((data as unknown as RequestRow[]) || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function validate(id: string) {
    await supabase.from('service_requests').update({ stage: 'VALIDATED' }).eq('id', id)
    await supabase.from('request_stages').insert({
      request_id: id,
      from_stage: 'UNDER_REVIEW',
      to_stage: 'VALIDATED',
      actor_user_id: user?.id ?? null,
      notes: `Validado por engenheiro ${user?.name || ''}`,
    })
    load()
  }

  async function reject(id: string) {
    const reason = window.prompt('Motivo da rejeição (será registrado no histórico):')
    if (!reason) return
    await supabase.from('service_requests').update({ stage: 'REJECTED' }).eq('id', id)
    await supabase.from('request_stages').insert({
      request_id: id,
      from_stage: 'UNDER_REVIEW',
      to_stage: 'REJECTED',
      actor_user_id: user?.id ?? null,
      notes: `Rejeitado: ${reason}`,
    })
    load()
  }

  if (loading) return <div className="loading">Carregando...</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Fila de validação</h2>
          <p>Orçamentos gerados pela IA aguardando validação de engenheiro.</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card empty-state">
          <h3>Nada para validar</h3>
          <p>Quando a IA terminar uma composição, aparece aqui.</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {rows.map((r) => (
            <div className="card validation-card" key={r.id}>
              <div className="card-header">
                <h3>{r.title}</h3>
                <span className="badge badge-draft">Aguardando</span>
              </div>
              <dl className="detail-list">
                <dt>Cliente</dt><dd>{r.companies?.name || '—'}</dd>
                <dt>Serviço</dt><dd>{r.services?.name || '—'}</dd>
                <dt>Tipologia</dt><dd>{r.project_type || '—'}</dd>
                <dt>Área</dt><dd>{r.total_area ? `${r.total_area} m²` : '—'}</dd>
              </dl>
              {r.description && <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>{r.description}</p>}
              <div className="validation-actions">
                <button className="btn btn-outline" onClick={() => reject(r.id)}>
                  <XCircle size={14} /> Rejeitar
                </button>
                <button className="btn btn-primary" onClick={() => validate(r.id)}>
                  <ShieldCheck size={14} /> Validar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
