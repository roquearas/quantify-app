import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import {
  FileSignature, CheckCircle2, XCircle, CreditCard, QrCode, Calendar,
  ClipboardList, ArrowLeft, AlertCircle,
} from 'lucide-react'
import { formatBRL } from '../../lib/pricingEngine'

type ProposalStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED'
type PaymentMethod = 'CARD' | 'PIX'

interface ProposalFull {
  id: string
  request_id: string
  company_id: string
  final_price: number | null
  estimated_price: number | null
  scope: string | null
  deliverables: string[] | null
  delivery_days: number | null
  revisions_included: number | null
  valid_until: string | null
  status: ProposalStatus
  notes: string | null
  sent_at: string | null
  responded_at: string | null
  service_requests: {
    id: string
    title: string
    typology: string | null
    area_m2: number | null
    location: string | null
    services: { name: string } | null
  } | null
}

export default function PropostaDetalhe() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [proposal, setProposal] = useState<ProposalFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [method, setMethod] = useState<PaymentMethod>('CARD')
  const [installments, setInstallments] = useState<number>(1)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase.from('proposals')
      .select(`
        *,
        service_requests!inner(
          id, title, typology, area_m2, location,
          services(name)
        )
      `)
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { setError(error.message); setLoading(false); return }
        setProposal(data as ProposalFull | null)
        setLoading(false)
      })
  }, [id])

  async function acceptAndProceed() {
    if (!proposal || !user) return
    setProcessing(true)

    // 1) Marca a proposta como aceita (RLS permite ao cliente da mesma company)
    const { error: upErr } = await supabase
      .from('proposals')
      .update({ status: 'ACCEPTED', responded_at: new Date().toISOString() })
      .eq('id', proposal.id)

    if (upErr) {
      setError(upErr.message)
      setProcessing(false)
      return
    }

    // 2) Cria o registro de pagamento PENDING
    const { data: pay, error: payErr } = await supabase
      .from('payments')
      .insert({
        proposal_id: proposal.id,
        request_id: proposal.request_id,
        company_id: proposal.company_id,
        amount: proposal.final_price,
        method,
        installments: method === 'CARD' ? installments : 1,
        status: 'PENDING',
      })
      .select()
      .single()

    if (payErr) {
      setError(payErr.message)
      setProcessing(false)
      return
    }

    // 3) Registra no timeline da solicitação
    await supabase.from('request_stages').insert({
      request_id: proposal.request_id,
      stage: 'ACCEPTED',
      note: `Proposta aceita pelo cliente. Método: ${method}${method === 'CARD' ? ` (${installments}x)` : ''}`,
      actor_id: user.id,
    })

    // 4) Navega para a página de pagamento (a criação real de SetupIntent / QR acontece no Edge Function — B9/B10)
    navigate(`/app/propostas/${proposal.id}/pagamento?payment=${pay.id}`, { replace: true })
  }

  async function rejectProposal() {
    if (!proposal) return
    const reason = prompt('Deseja recusar a proposta? Deixe um motivo (opcional):') ?? undefined
    const notesNew = [proposal.notes, reason ? `[Cliente recusou: ${reason}]` : '[Cliente recusou]']
      .filter(Boolean).join('\n')
    await supabase.from('proposals').update({
      status: 'REJECTED',
      responded_at: new Date().toISOString(),
      notes: notesNew,
    }).eq('id', proposal.id)
    navigate('/app/solicitacoes', { replace: true })
  }

  if (loading) return <div className="loading">Carregando...</div>

  if (!proposal) {
    return (
      <div className="empty-state">
        <AlertCircle size={32} />
        <h3>Proposta não encontrada</h3>
        <p>Verifique o link ou volte para suas solicitações.</p>
        <button className="btn btn-outline" onClick={() => navigate('/app')}>
          <ArrowLeft size={14} /> Voltar
        </button>
      </div>
    )
  }

  const req = proposal.service_requests
  const canAccept = proposal.status === 'SENT' && proposal.final_price != null

  return (
    <>
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 8 }}>
            <ArrowLeft size={14} /> Voltar
          </button>
          <h2>Proposta</h2>
          <p>Revise o valor final e aceite para iniciarmos o serviço.</p>
        </div>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="proposal-detail">
        <div className="card">
          <div className="proposal-head">
            <div>
              <div className="proposal-title">
                <FileSignature size={16} />
                <strong>{req?.title ?? 'Solicitação'}</strong>
              </div>
              <div className="proposal-sub">
                {req?.services?.name ?? '—'} · {req?.typology ?? '—'}
                {req?.area_m2 ? ` · ${req.area_m2} m²` : ''}
                {req?.location ? ` · ${req.location}` : ''}
              </div>
            </div>
            <span className={`badge ${proposal.status === 'SENT' ? 'badge-info' : proposal.status === 'ACCEPTED' ? 'badge-success' : 'badge-neutral'}`}>
              {proposal.status === 'SENT' ? 'Aguardando aceite' :
               proposal.status === 'ACCEPTED' ? 'Aceita' :
               proposal.status === 'REJECTED' ? 'Recusada' :
               proposal.status === 'EXPIRED' ? 'Expirada' :
               proposal.status === 'CANCELLED' ? 'Cancelada' : 'Rascunho'}
            </span>
          </div>

          <div className="proposal-headline">
            <div className="proposal-headline-price">
              {proposal.final_price != null ? formatBRL(Number(proposal.final_price)) : '—'}
            </div>
            <div className="proposal-headline-sub">
              Valor final · confirmado pelo engenheiro responsável
              {proposal.estimated_price != null && (
                <> · estimativa inicial: {formatBRL(Number(proposal.estimated_price))}</>
              )}
            </div>
          </div>

          <div className="proposal-meta">
            {proposal.delivery_days != null && (
              <div className="proposal-meta-item">
                <Calendar size={14} />
                <div><span>Prazo de entrega</span><strong>{proposal.delivery_days} dias úteis</strong></div>
              </div>
            )}
            {proposal.revisions_included != null && (
              <div className="proposal-meta-item">
                <ClipboardList size={14} />
                <div><span>Revisões incluídas</span><strong>{proposal.revisions_included}</strong></div>
              </div>
            )}
            {proposal.valid_until && (
              <div className="proposal-meta-item">
                <Calendar size={14} />
                <div><span>Válida até</span><strong>{new Date(proposal.valid_until).toLocaleDateString('pt-BR')}</strong></div>
              </div>
            )}
          </div>

          {proposal.scope && (
            <div className="proposal-section">
              <h4>Escopo</h4>
              <p>{proposal.scope}</p>
            </div>
          )}

          {proposal.deliverables && proposal.deliverables.length > 0 && (
            <div className="proposal-section">
              <h4>Entregáveis</h4>
              <ul className="proposal-deliverables">
                {proposal.deliverables.map((d, i) => (
                  <li key={i}><CheckCircle2 size={14} /> {d}</li>
                ))}
              </ul>
            </div>
          )}

          {proposal.notes && (
            <div className="proposal-section">
              <h4>Observações</h4>
              <p>{proposal.notes}</p>
            </div>
          )}

          <div className="proposal-payment-terms">
            <strong>Termos de pagamento:</strong> 100% na entrega, mediante aceite desta proposta.
            Você pode optar por <strong>cartão (com parcelamento)</strong> ou <strong>PIX</strong> na próxima etapa.
            Nenhum valor é cobrado agora — apenas autorizado.
          </div>

          {canAccept && !showPayment && (
            <div className="proposal-actions proposal-actions-final">
              <button type="button" className="btn btn-outline" onClick={rejectProposal} disabled={processing}>
                <XCircle size={14} /> Recusar
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setShowPayment(true)}>
                <CheckCircle2 size={14} /> Aceitar proposta
              </button>
            </div>
          )}

          {showPayment && canAccept && (
            <div className="payment-picker">
              <h4>Escolha a forma de pagamento</h4>
              <div className="payment-options">
                <button
                  type="button"
                  className={`payment-option ${method === 'CARD' ? 'selected' : ''}`}
                  onClick={() => setMethod('CARD')}
                >
                  <CreditCard size={18} />
                  <span>Cartão de crédito</span>
                  <small>Parcele em até 12x</small>
                </button>
                <button
                  type="button"
                  className={`payment-option ${method === 'PIX' ? 'selected' : ''}`}
                  onClick={() => setMethod('PIX')}
                >
                  <QrCode size={18} />
                  <span>PIX</span>
                  <small>Geramos o QR code na entrega</small>
                </button>
              </div>

              {method === 'CARD' && (
                <label className="payment-installments">
                  <span>Parcelas</span>
                  <select value={installments} onChange={(e) => setInstallments(Number(e.target.value))}>
                    {[1, 2, 3, 4, 6, 10, 12].map((n) => (
                      <option key={n} value={n}>{n}x {n === 1 ? 'à vista' : `de ${formatBRL((proposal.final_price ?? 0) / n)}`}</option>
                    ))}
                  </select>
                </label>
              )}

              <p className="payment-note">
                Ao confirmar, autorizamos a cobrança somente após a entrega do serviço. Você receberá um link/QR para finalizar.
              </p>

              <div className="proposal-actions proposal-actions-final">
                <button type="button" className="btn btn-outline" onClick={() => setShowPayment(false)}>
                  Voltar
                </button>
                <button type="button" className="btn btn-primary" onClick={acceptAndProceed} disabled={processing}>
                  {processing ? 'Processando...' : `Aceitar e prosseguir (${method === 'CARD' ? 'Cartão' : 'PIX'})`}
                </button>
              </div>
            </div>
          )}

          {proposal.status === 'ACCEPTED' && (
            <div className="proposal-accepted-banner">
              <CheckCircle2 size={18} /> Proposta aceita em {proposal.responded_at ? new Date(proposal.responded_at).toLocaleString('pt-BR') : '—'}.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
