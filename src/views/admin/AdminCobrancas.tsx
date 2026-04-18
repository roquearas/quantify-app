'use client'
import Link from 'next/link'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  CreditCard, QrCode, Mail, AlertCircle, CheckCircle2, Clock, XCircle, Loader2, ArrowRight,
} from 'lucide-react'
import { formatBRL } from '../../lib/pricingEngine'

type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'CAPTURING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
type PaymentMethod = 'CARD' | 'PIX' | 'BOLETO'

interface PaymentRow {
  id: string
  proposal_id: string
  request_id: string
  company_id: string
  amount: number
  method: PaymentMethod
  installments: number | null
  status: PaymentStatus
  mp_payment_id: string | null
  mp_preference_id: string | null
  paid_at: string | null
  created_at: string
  proposals: {
    final_price: number | null
    service_requests: {
      title: string
      companies: { name: string } | null
      services: { name: string } | null
    } | null
  } | null
}

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: 'Aguardando',
  AUTHORIZED: 'Autorizado',
  CAPTURING: 'Capturando',
  PAID: 'Pago',
  FAILED: 'Falhou',
  REFUNDED: 'Reembolsado',
  CANCELLED: 'Cancelado',
}
const STATUS_BADGE: Record<PaymentStatus, string> = {
  PENDING: 'badge-neutral',
  AUTHORIZED: 'badge-info',
  CAPTURING: 'badge-info',
  PAID: 'badge-success',
  FAILED: 'badge-danger',
  REFUNDED: 'badge-warning',
  CANCELLED: 'badge-neutral',
}

export default function AdminCobrancas() {
  const [rows, setRows] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<PaymentStatus | 'ALL'>('ALL')
  const [sending, setSending] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('payments')
      .select(`
        *,
        proposals!inner(
          final_price,
          service_requests!inner(
            title,
            companies(name),
            services(name)
          )
        )
      `)
      .order('created_at', { ascending: false })
    setRows((data as unknown as PaymentRow[]) || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function resendReceipt(p: PaymentRow) {
    setSending(p.id)
    setNotice(null)
    const { data, error } = await supabase.functions.invoke('send-receipt', {
      body: { payment_id: p.id },
    })
    setSending(null)
    if (error) { setNotice({ type: 'err', msg: error.message }); return }
    const resp = data as { sent?: boolean; error?: string }
    if (resp?.error) { setNotice({ type: 'err', msg: resp.error }); return }
    setNotice({ type: 'ok', msg: `Recibo reenviado para ${p.proposals?.service_requests?.companies?.name ?? 'cliente'}` })
  }

  async function chargeNow(p: PaymentRow) {
    if (!confirm(`Gerar cobrança agora? ${formatBRL(Number(p.amount))} — ${p.method}`)) return
    setSending(p.id)
    setNotice(null)
    const { data, error } = await supabase.functions.invoke('mp-create-preference', {
      body: { payment_id: p.id },
    })
    setSending(null)
    if (error) { setNotice({ type: 'err', msg: error.message }); return }
    const resp = data as { init_point?: string; sandbox_init_point?: string; error?: string }
    if (resp?.error) { setNotice({ type: 'err', msg: resp.error }); return }
    const link = resp.init_point ?? resp.sandbox_init_point ?? null
    if (link) {
      setNotice({ type: 'ok', msg: `Cobrança criada. Link enviar ao cliente: ${link}` })
    } else {
      setNotice({ type: 'err', msg: 'MP não retornou link.' })
    }
    load()
  }

  const filtered = filter === 'ALL' ? rows : rows.filter((r) => r.status === filter)

  const totalPaid = rows.filter((r) => r.status === 'PAID').reduce((s, r) => s + Number(r.amount), 0)
  const totalPending = rows.filter((r) => r.status === 'PENDING' || r.status === 'AUTHORIZED').reduce((s, r) => s + Number(r.amount), 0)

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Cobranças</h2>
          <p>Acompanhe pagamentos, reenvie recibos e dispare cobranças manuais.</p>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <Kpi label="Total pago" value={formatBRL(totalPaid)} icon={<CheckCircle2 size={18} />} tone="success" />
        <Kpi label="Pendente" value={formatBRL(totalPending)} icon={<Clock size={18} />} tone="warning" />
        <Kpi label="Transações" value={String(rows.length)} icon={<CreditCard size={18} />} />
        <Kpi label="Pagos" value={String(rows.filter((r) => r.status === 'PAID').length)} icon={<CheckCircle2 size={18} />} tone="success" />
      </div>

      {notice && (
        <div className={`auth-${notice.type === 'err' ? 'error' : 'success'}`} style={{ marginBottom: 12 }}>
          {notice.msg}
        </div>
      )}

      <div className="proposal-filter">
        {(['ALL', 'PENDING', 'AUTHORIZED', 'PAID', 'FAILED'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`chip ${filter === f ? 'chip-active' : ''}`}
          >
            {f === 'ALL' ? 'Todas' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {loading && <div className="loading">Carregando...</div>}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <AlertCircle size={32} />
          <h3>Nenhuma cobrança</h3>
          <p>Quando um cliente aceitar uma proposta, o pagamento aparecerá aqui.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Solicitação</th>
                <th>Empresa</th>
                <th>Método</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Data</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const sr = p.proposals?.service_requests
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{sr?.title ?? '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sr?.services?.name ?? '—'}</div>
                    </td>
                    <td>
                      <div>{sr?.companies?.name ?? '—'}</div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {p.method === 'CARD' ? <CreditCard size={12} /> : <QrCode size={12} />}
                        {p.method === 'CARD' ? `Cartão ${p.installments && p.installments > 1 ? `(${p.installments}x)` : ''}` : p.method}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatBRL(Number(p.amount))}</td>
                    <td><span className={`badge ${STATUS_BADGE[p.status]}`}>{STATUS_LABEL[p.status]}</span></td>
                    <td>{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        {p.status === 'PENDING' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => chargeNow(p)}
                            disabled={sending === p.id}
                          >
                            {sending === p.id ? <Loader2 size={12} className="spin" /> : <CreditCard size={12} />}
                            Cobrar
                          </button>
                        )}
                        {p.status === 'PAID' && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => resendReceipt(p)}
                            disabled={sending === p.id}
                          >
                            {sending === p.id ? <Loader2 size={12} className="spin" /> : <Mail size={12} />}
                            Recibo
                          </button>
                        )}
                        {p.status === 'FAILED' && <XCircle size={14} color="#dc2626" />}
                        <Link href={`/admin/solicitacoes/${p.request_id}`} className="btn btn-ghost btn-sm">
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function Kpi({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone?: string }) {
  return (
    <div className={`kpi-card ${tone ? `kpi-${tone}` : ''}`}>
      <div className="kpi-icon">{icon}</div>
      <div>
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
      </div>
    </div>
  )
}
