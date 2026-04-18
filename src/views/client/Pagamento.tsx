'use client'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { CheckCircle2, QrCode, CreditCard, Copy, AlertCircle, ArrowLeft, Loader2, ExternalLink } from 'lucide-react'
import { formatBRL } from '../../lib/pricingEngine'

interface Payment {
  id: string
  proposal_id: string
  request_id: string
  amount: number
  method: 'CARD' | 'PIX' | 'BOLETO'
  installments: number | null
  status: 'PENDING' | 'AUTHORIZED' | 'CAPTURING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
  mp_qr_code: string | null
  mp_qr_code_base64: string | null
  mp_payment_id: string | null
}

export default function Pagamento() {
  const { id: proposalId } = useParams() as { id: string }
  const searchParams = useSearchParams()
  const paymentId = searchParams?.get('payment')
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [creatingPref, setCreatingPref] = useState(false)
  const [initPoint, setInitPoint] = useState<string | null>(null)
  const [prefError, setPrefError] = useState<string | null>(null)

  useEffect(() => {
    if (!paymentId) { setLoading(false); return }
    supabase.from('payments').select('*').eq('id', paymentId).maybeSingle()
      .then(({ data }) => {
        setPayment(data as Payment | null)
        setLoading(false)
      })
  }, [paymentId])

  async function copyPixCode() {
    if (!payment?.mp_qr_code) return
    await navigator.clipboard.writeText(payment.mp_qr_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function startCheckout() {
    if (!payment) return
    setCreatingPref(true)
    setPrefError(null)
    const { data, error } = await supabase.functions.invoke('mp-create-preference', {
      body: { payment_id: payment.id },
    })
    setCreatingPref(false)
    if (error) { setPrefError(error.message); return }
    const resp = data as { init_point?: string; sandbox_init_point?: string; error?: string }
    if (resp?.error) { setPrefError(resp.error); return }
    const point = resp?.init_point ?? resp?.sandbox_init_point ?? null
    if (point) {
      setInitPoint(point)
      window.location.href = point
    } else {
      setPrefError('Mercado Pago não retornou link de checkout')
    }
  }

  if (loading) return <div className="loading"><Loader2 size={18} className="spin" /> Carregando pagamento...</div>

  if (!payment) {
    return (
      <div className="empty-state">
        <AlertCircle size={32} />
        <h3>Pagamento não encontrado</h3>
        <Link href={`/app/propostas/${proposalId}`} className="btn btn-outline">
          <ArrowLeft size={14} /> Voltar à proposta
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Pagamento</h2>
          <p>
            {payment.method === 'CARD' && 'Cartão pré-autorizado — cobrança só ocorre após entrega.'}
            {payment.method === 'PIX' && 'Escaneie o QR code ou copie o código PIX quando estiver pronto.'}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="payment-summary">
          <div>
            <div className="payment-summary-label">Valor</div>
            <div className="payment-summary-value">{formatBRL(Number(payment.amount))}</div>
          </div>
          <div>
            <div className="payment-summary-label">Método</div>
            <div className="payment-summary-method">
              {payment.method === 'CARD' ? <CreditCard size={14} /> : <QrCode size={14} />}
              {payment.method === 'CARD' ? `Cartão ${payment.installments && payment.installments > 1 ? `(${payment.installments}x)` : 'à vista'}` : 'PIX'}
            </div>
          </div>
          <div>
            <div className="payment-summary-label">Status</div>
            <span className={`badge ${statusBadge(payment.status)}`}>{statusLabel(payment.status)}</span>
          </div>
        </div>

        {payment.method === 'CARD' && (payment.status === 'PENDING' || payment.status === 'AUTHORIZED') && (
          <div className="payment-body">
            <p>
              Prosseguiremos para o checkout seguro do Mercado Pago. Seus dados de cartão são
              tokenizados e <strong>nunca passam pelo nosso servidor</strong>.
            </p>
            <p>
              A cobrança só é processada após a confirmação pelo Mercado Pago.
              Você receberá um recibo por e-mail automaticamente.
            </p>
            {prefError && <div className="auth-error">{prefError}</div>}
            {initPoint && (
              <div className="payment-placeholder">
                <Loader2 size={14} className="spin" />
                <span>Redirecionando para o Mercado Pago...</span>
              </div>
            )}
            <button type="button" className="btn btn-primary btn-lg" onClick={startCheckout} disabled={creatingPref}>
              <ExternalLink size={16} />
              {creatingPref ? 'Preparando checkout...' : 'Pagar agora no Mercado Pago'}
            </button>
          </div>
        )}

        {payment.method === 'PIX' && (
          <div className="payment-body">
            {!payment.mp_qr_code_base64 && payment.status !== 'PAID' && (
              <>
                {prefError && <div className="auth-error">{prefError}</div>}
                <p>
                  Clique abaixo para gerar o QR code PIX. O pagamento é processado instantaneamente
                  e você receberá o recibo por e-mail.
                </p>
                <button type="button" className="btn btn-primary btn-lg" onClick={startCheckout} disabled={creatingPref}>
                  <QrCode size={16} />
                  {creatingPref ? 'Gerando QR...' : 'Gerar QR code PIX'}
                </button>
              </>
            )}
            {payment.mp_qr_code_base64 ? (
              <>
                <img
                  src={`data:image/png;base64,${payment.mp_qr_code_base64}`}
                  alt="QR code PIX"
                  className="pix-qr"
                />
                <div className="pix-code-block">
                  <label>PIX copia-e-cola</label>
                  <div className="pix-code">{payment.mp_qr_code}</div>
                  <button type="button" className="btn btn-outline btn-sm" onClick={copyPixCode}>
                    <Copy size={14} /> {copied ? 'Copiado!' : 'Copiar código'}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}

        {payment.status === 'PAID' && (
          <div className="payment-success">
            <CheckCircle2 size={24} />
            <strong>Pagamento confirmado!</strong>
            <p>Você receberá o recibo no seu e-mail.</p>
          </div>
        )}

        <div className="proposal-actions proposal-actions-final">
          <Link href={`/app/solicitacoes/${payment.request_id}`} className="btn btn-outline">
            Ver solicitação
          </Link>
        </div>
      </div>
    </>
  )
}

function statusLabel(s: Payment['status']): string {
  return ({
    PENDING: 'Pendente',
    AUTHORIZED: 'Autorizado',
    CAPTURING: 'Capturando',
    PAID: 'Pago',
    FAILED: 'Falhou',
    REFUNDED: 'Reembolsado',
    CANCELLED: 'Cancelado',
  } as const)[s]
}

function statusBadge(s: Payment['status']): string {
  if (s === 'PAID') return 'badge-success'
  if (s === 'FAILED' || s === 'CANCELLED') return 'badge-danger'
  if (s === 'AUTHORIZED' || s === 'CAPTURING') return 'badge-info'
  return 'badge-neutral'
}
