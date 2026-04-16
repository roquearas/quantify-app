import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { PlusCircle, ArrowRight } from 'lucide-react'

interface RequestRow {
  id: string
  title: string
  stage: string
  created_at: string
  typology: string | null
  area_m2: number | null
  services: { name: string } | null
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

export default function MinhasSolicitacoes() {
  const { user } = useAuth()
  const [rows, setRows] = useState<RequestRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('service_requests')
      .select('id, title, stage, created_at, typology, area_m2, services(name)')
      .eq('company_id', user.company_id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRows((data as unknown as RequestRow[]) || [])
        setLoading(false)
      })
  }, [user])

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Minhas solicitações</h2>
          <p>Histórico completo e estágio atual de cada solicitação.</p>
        </div>
        <Link to="/app/solicitar" className="btn btn-primary">
          <PlusCircle size={16} /> Nova solicitação
        </Link>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Carregando...</div>
        ) : rows.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhuma solicitação</h3>
            <p>Comece pelo wizard guiado.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Título</th><th>Serviço</th><th>Tipologia</th><th>Área</th>
                <th>Estágio</th><th>Data</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.title}</td>
                  <td>{r.services?.name || '—'}</td>
                  <td>{r.typology || '—'}</td>
                  <td>{r.area_m2 ? `${r.area_m2} m²` : '—'}</td>
                  <td><span className={`badge ${stageClass[r.stage] || ''}`}>{stageLabel[r.stage] || r.stage}</span></td>
                  <td>{new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <Link to={`/app/solicitacoes/${r.id}`} className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px' }}>
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
