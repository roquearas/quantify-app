'use client'
import Link from 'next/link'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { PlusCircle, ArrowRight } from 'lucide-react'

interface RequestRow {
  id: string
  title: string
  stage: string
  created_at: string
  services: { name: string } | null
}

const stageLabel: Record<string, string> = {
  RECEIVED: 'Recebido',
  QUOTING: 'Cotando',
  COMPOSING: 'Compondo',
  UNDER_REVIEW: 'Em revisão',
  VALIDATED: 'Validado',
  SENT: 'Enviado',
  ACCEPTED: 'Aceito',
  REJECTED: 'Rejeitado',
  CANCELLED: 'Cancelado',
}

const stageClass: Record<string, string> = {
  RECEIVED: 'badge-review',
  QUOTING: 'badge-review',
  COMPOSING: 'badge-review',
  UNDER_REVIEW: 'badge-draft',
  VALIDATED: 'badge-validated',
  SENT: 'badge-validated',
  ACCEPTED: 'badge-validated',
  REJECTED: 'badge-rejected',
  CANCELLED: 'badge-rejected',
}

export default function ClientDashboard() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('service_requests')
      .select('id, title, stage, created_at, services(name)')
      .eq('company_id', user.company_id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setRequests((data as unknown as RequestRow[]) || [])
        setLoading(false)
      })
  }, [user])

  const active = requests.filter((r) => !['ACCEPTED', 'REJECTED', 'CANCELLED'].includes(r.stage))
  const completed = requests.filter((r) => r.stage === 'ACCEPTED')

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Olá, {user?.name?.split(' ')[0] || 'cliente'}</h2>
          <p>Acompanhe suas solicitações e contrate novos serviços.</p>
        </div>
        <Link href="/app/solicitar" className="btn btn-primary">
          <PlusCircle size={16} /> Nova solicitação
        </Link>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="kpi-label">Em andamento</div>
          <div className="kpi-value">{active.length}</div>
        </div>
        <div className="card">
          <div className="kpi-label">Concluídas</div>
          <div className="kpi-value">{completed.length}</div>
        </div>
        <div className="card">
          <div className="kpi-label">Total histórico</div>
          <div className="kpi-value">{requests.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Minhas solicitações recentes</h3>
          <Link href="/app/solicitacoes" className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px' }}>
            Ver todas <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="loading">Carregando...</div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhuma solicitação ainda</h3>
            <p>Inicie pelo wizard guiado para contratar seu primeiro serviço.</p>
            <Link href="/app/solicitar" className="btn btn-primary">
              <PlusCircle size={16} /> Solicitar serviço
            </Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Título</th><th>Serviço</th><th>Estágio</th><th>Criada em</th><th></th></tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.title}</td>
                  <td>{r.services?.name || '—'}</td>
                  <td><span className={`badge ${stageClass[r.stage] || ''}`}>{stageLabel[r.stage] || r.stage}</span></td>
                  <td>{new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <Link href={`/app/solicitacoes/${r.id}`} className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px' }}>
                      Ver <ArrowRight size={12} />
                    </Link>
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
