'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ChevronLeft, CircleCheck, Clock3 } from 'lucide-react'

interface Stage {
  id: string
  from_stage: string | null
  to_stage: string
  notes: string | null
  created_at: string
}
interface Request {
  id: string
  title: string
  stage: string
  project_type: string | null
  total_area: number | null
  city: string | null
  standard: string | null
  deadline: string | null
  description: string | null
  created_at: string
  services: { name: string } | null
}
interface Contract {
  id: string
  html_content: string | null
  signed_at: string | null
}

const stageLabel: Record<string, string> = {
  RECEIVED: 'Recebido', QUOTING: 'Cotando', COMPOSING: 'Compondo',
  UNDER_REVIEW: 'Em revisão', VALIDATED: 'Validado', SENT: 'Enviado',
  ACCEPTED: 'Aceito', REJECTED: 'Rejeitado', CANCELLED: 'Cancelado',
}

const timelineOrder = ['RECEIVED', 'QUOTING', 'COMPOSING', 'UNDER_REVIEW', 'VALIDATED', 'SENT', 'ACCEPTED']

export default function SolicitacaoDetalhe() {
  const { id } = useParams() as { id: string }
  const [req, setReq] = useState<Request | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('service_requests').select('*, services(name)').eq('id', id).single(),
      supabase.from('request_stages').select('*').eq('request_id', id).order('created_at'),
      supabase.from('contracts').select('*').eq('request_id', id).maybeSingle(),
    ]).then(([r, s, c]) => {
      setReq((r.data as unknown as Request) || null)
      setStages((s.data as unknown as Stage[]) || [])
      setContract((c.data as unknown as Contract) || null)
      setLoading(false)
    })
  }, [id])

  if (loading) return <div className="loading">Carregando...</div>
  if (!req) return <div className="empty-state"><h3>Solicitação não encontrada</h3></div>

  const currentIdx = timelineOrder.indexOf(req.stage)

  return (
    <>
      <div className="page-header">
        <div>
          <Link href="/app/solicitacoes" className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px', marginBottom: 8 }}>
            <ChevronLeft size={12} /> Voltar
          </Link>
          <h2>{req.title}</h2>
          <p>{req.services?.name} • criado em {new Date(req.created_at).toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><h3>Dados do projeto</h3></div>
          <dl className="detail-list">
            <dt>Tipologia</dt><dd>{req.project_type || '—'}</dd>
            <dt>Área</dt><dd>{req.total_area ? `${req.total_area} m²` : '—'}</dd>
            <dt>Localização</dt><dd>{req.city || '—'}</dd>
            <dt>Padrão</dt><dd>{req.standard || '—'}</dd>
            <dt>Prazo desejado</dt><dd>{req.deadline ? new Date(req.deadline).toLocaleDateString('pt-BR') : '—'}</dd>
          </dl>
          {req.description && (
            <>
              <h4 style={{ marginTop: 12, fontSize: 13 }}>Observações</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>{req.description}</p>
            </>
          )}
        </div>

        <div className="card">
          <div className="card-header"><h3>Linha do tempo</h3></div>
          <ol className="timeline">
            {timelineOrder.map((s, i) => {
              const reached = i <= currentIdx
              return (
                <li key={s} className={`timeline-item ${reached ? 'done' : 'pending'}`}>
                  {reached ? <CircleCheck size={16} /> : <Clock3 size={16} />}
                  <span>{stageLabel[s]}</span>
                </li>
              )
            })}
          </ol>
          {stages.length > 0 && (
            <>
              <h4 style={{ marginTop: 12, fontSize: 13 }}>Histórico</h4>
              <ul className="history-list">
                {stages.map((s) => (
                  <li key={s.id}>
                    <strong>{stageLabel[s.to_stage] || s.to_stage}</strong>
                    <span>{new Date(s.created_at).toLocaleString('pt-BR')}</span>
                    {s.notes && <p>{s.notes}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {contract && (
        <div className="card">
          <div className="card-header">
            <h3>Contrato</h3>
            {contract.signed_at && (
              <span className="badge badge-validated">Aceito em {new Date(contract.signed_at).toLocaleDateString('pt-BR')}</span>
            )}
          </div>
          <pre className="contract-preview">{contract.html_content}</pre>
        </div>
      )}
    </>
  )
}
