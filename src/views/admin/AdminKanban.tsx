'use client'
import Link from 'next/link'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../lib/database.types'

type RequestStage = Database['public']['Enums']['request_stage']

interface RequestRow {
  id: string
  title: string
  stage: RequestStage
  created_at: string
  project_id: string | null
  services: { name: string } | null
  companies: { name: string } | null
}

const columns: { stage: RequestStage; label: string }[] = [
  { stage: 'RECEIVED', label: 'Recebido' },
  { stage: 'QUOTING', label: 'Cotando' },
  { stage: 'COMPOSING', label: 'Compondo' },
  { stage: 'UNDER_REVIEW', label: 'Em revisão' },
  { stage: 'VALIDATED', label: 'Validado' },
  { stage: 'SENT', label: 'Enviado' },
  { stage: 'ACCEPTED', label: 'Aceito' },
]

const stageNext: Record<RequestStage, RequestStage | null> = {
  RECEIVED: 'QUOTING', QUOTING: 'COMPOSING', COMPOSING: 'UNDER_REVIEW',
  UNDER_REVIEW: 'VALIDATED', VALIDATED: 'SENT', SENT: 'ACCEPTED', ACCEPTED: null,
  REJECTED: null, CANCELLED: null,
}

export default function AdminKanban() {
  const [rows, setRows] = useState<RequestRow[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase
      .from('service_requests')
      .select('id, title, stage, created_at, project_id, services(name), companies(name)')
      .order('created_at', { ascending: true })
    setRows((data as unknown as RequestRow[]) || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function advance(id: string, current: RequestStage) {
    const nxt = stageNext[current]
    if (!nxt) return

    const { error: updErr } = await supabase
      .from('service_requests')
      .update({ stage: nxt })
      .eq('id', id)
    if (updErr) {
      console.error('Erro ao avançar estágio:', updErr)
      alert('Erro ao avançar: ' + updErr.message)
      return
    }

    const { data: authData } = await supabase.auth.getUser()
    const actorId = authData?.user?.id ?? null

    await supabase.from('request_stages').insert({
      request_id: id,
      from_stage: current,
      to_stage: nxt,
      actor_user_id: actorId,
      notes: 'Avançado via Kanban',
    })

    if (nxt === 'ACCEPTED') {
      const { data: updated } = await supabase
        .from('service_requests')
        .select('project_id')
        .eq('id', id)
        .single()
      if (!updated?.project_id) {
        console.warn(`service_request ${id} aceita mas sem project_id — trigger pode ter falhado`)
        alert('Atenção: projeto não foi criado automaticamente. Verifique os logs do banco.')
      }
    }
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
                    <div className="kanban-card-title">
                      {r.title}
                      {r.project_id && (
                        <span
                          title="Projeto vinculado"
                          style={{ marginLeft: 6, color: '#16A085' }}
                        >●</span>
                      )}
                    </div>
                    <div className="kanban-card-meta">{r.companies?.name || '—'}</div>
                    <div className="kanban-card-meta">{r.services?.name || '—'}</div>
                    <div className="kanban-card-actions">
                      <Link href={`/admin/solicitacoes/${r.id}`} className="btn btn-outline btn-xs">Abrir</Link>
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
