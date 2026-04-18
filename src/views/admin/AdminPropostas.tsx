'use client'
import Link from 'next/link'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import {
  FileSignature, Send, Save, ArrowRight, Clock, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react'
import { formatBRL } from '../../lib/pricingEngine'

type ProposalStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED'

interface Proposal {
  id: string
  request_id: string
  company_id: string
  estimated_price: number | null
  final_price: number | null
  scope: string | null
  deliverables: string[] | null
  delivery_days: number | null
  revisions_included: number | null
  valid_until: string | null
  status: ProposalStatus
  breakdown: Record<string, unknown> | null
  notes: string | null
  sent_at: string | null
  responded_at: string | null
  created_at: string
  service_requests: {
    id: string
    title: string
    project_type: string | null
    area_m2: number | null
    location: string | null
    standard: string | null
    deadline: string | null
    services: { name: string; slug: string } | null
    companies: { name: string } | null
  } | null
}

const STATUS_LABEL: Record<ProposalStatus, string> = {
  DRAFT: 'Rascunho',
  SENT: 'Enviada',
  ACCEPTED: 'Aceita',
  REJECTED: 'Recusada',
  EXPIRED: 'Expirada',
  CANCELLED: 'Cancelada',
}

const STATUS_CLASS: Record<ProposalStatus, string> = {
  DRAFT: 'badge badge-neutral',
  SENT: 'badge badge-info',
  ACCEPTED: 'badge badge-success',
  REJECTED: 'badge badge-danger',
  EXPIRED: 'badge badge-warning',
  CANCELLED: 'badge badge-neutral',
}

export default function AdminPropostas() {
  const { user } = useAuth()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ProposalStatus | 'ALL'>('ALL')
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<{
    final_price: string
    delivery_days: string
    revisions_included: string
    valid_until: string
    deliverables: string
    notes: string
  }>({ final_price: '', delivery_days: '7', revisions_included: '1', valid_until: '', deliverables: '', notes: '' })

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('proposals')
      .select(`
        *,
        service_requests!inner(
          id, title, project_type, area_m2, location, standard, deadline,
          services(name, slug),
          companies(name)
        )
      `)
      .order('created_at', { ascending: false })
    setProposals((data as unknown as Proposal[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function startEdit(p: Proposal) {
    setEditing(p.id)
    setForm({
      final_price: String(p.final_price ?? p.estimated_price ?? ''),
      delivery_days: String(p.delivery_days ?? 7),
      revisions_included: String(p.revisions_included ?? 1),
      valid_until: p.valid_until?.slice(0, 10) ?? defaultValidUntil(),
      deliverables: (p.deliverables ?? []).join('\n'),
      notes: p.notes ?? '',
    })
  }

  function cancelEdit() { setEditing(null) }

  async function saveDraft(p: Proposal) {
    const payload = parseForm()
    if (!payload) return
    await supabase.from('proposals').update({
      ...payload,
      status: 'DRAFT',
    }).eq('id', p.id)
    setEditing(null)
    load()
  }

  async function sendProposal(p: Proposal) {
    const payload = parseForm()
    if (!payload) return
    if (!payload.final_price || payload.final_price <= 0) {
      alert('Defina um valor final antes de enviar.')
      return
    }
    await supabase.from('proposals').update({
      ...payload,
      status: 'SENT',
      sent_at: new Date().toISOString(),
    }).eq('id', p.id)

    // Avança a etapa da solicitação se ainda estiver em RECEIVED/QUOTING
    if (p.service_requests) {
      const currentStage = await supabase
        .from('service_requests').select('stage').eq('id', p.request_id).maybeSingle()
      const stage = (currentStage.data as { stage?: string } | null)?.stage
      if (stage && ['RECEIVED', 'QUOTING', 'COMPOSING'].includes(stage)) {
        await supabase.from('service_requests').update({ stage: 'UNDER_REVIEW' }).eq('id', p.request_id)
        await supabase.from('request_stages').insert({
          request_id: p.request_id,
          from_stage: stage as 'RECEIVED' | 'QUOTING' | 'COMPOSING',
          to_stage: 'UNDER_REVIEW',
          actor_user_id: user?.id ?? null,
          notes: 'Proposta enviada ao cliente',
        })
      }
    }

    setEditing(null)
    load()
  }

  async function cancelProposal(p: Proposal) {
    if (!confirm('Cancelar esta proposta?')) return
    await supabase.from('proposals').update({ status: 'CANCELLED' }).eq('id', p.id)
    load()
  }

  function parseForm() {
    const finalPrice = parseFloat(form.final_price.replace(',', '.'))
    const deliveryDays = parseInt(form.delivery_days, 10)
    const revs = parseInt(form.revisions_included, 10)
    const deliverables = form.deliverables
      .split('\n').map((s) => s.trim()).filter(Boolean)

    if (Number.isNaN(finalPrice) || finalPrice <= 0) {
      alert('Valor final inválido.')
      return null
    }
    return {
      final_price: finalPrice,
      delivery_days: Number.isNaN(deliveryDays) ? null : deliveryDays,
      revisions_included: Number.isNaN(revs) ? null : revs,
      valid_until: form.valid_until || null,
      deliverables: deliverables.length ? deliverables : null,
      notes: form.notes || null,
    }
  }

  const filtered = filter === 'ALL' ? proposals : proposals.filter((p) => p.status === filter)

  const stats = {
    total: proposals.length,
    draft: proposals.filter((p) => p.status === 'DRAFT').length,
    sent: proposals.filter((p) => p.status === 'SENT').length,
    accepted: proposals.filter((p) => p.status === 'ACCEPTED').length,
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Propostas</h2>
          <p>Ajuste valores finais e envie propostas ao cliente.</p>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <Kpi label="Total" value={stats.total} icon={<FileSignature size={18} />} />
        <Kpi label="Rascunho" value={stats.draft} icon={<Clock size={18} />} tone="neutral" />
        <Kpi label="Enviadas" value={stats.sent} icon={<Send size={18} />} tone="info" />
        <Kpi label="Aceitas" value={stats.accepted} icon={<CheckCircle2 size={18} />} tone="success" />
      </div>

      <div className="proposal-filter">
        {(['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'] as const).map((f) => (
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
          <h3>Nenhuma proposta</h3>
          <p>As propostas geradas automaticamente pelas solicitações aparecerão aqui.</p>
        </div>
      )}

      <div className="proposal-list">
        {filtered.map((p) => {
          const req = p.service_requests
          const isEditing = editing === p.id
          return (
            <div key={p.id} className={`card proposal-card ${isEditing ? 'editing' : ''}`}>
              <div className="proposal-head">
                <div>
                  <div className="proposal-title">
                    <FileSignature size={16} />
                    <strong>{req?.title ?? 'Solicitação'}</strong>
                    <span className={STATUS_CLASS[p.status]}>{STATUS_LABEL[p.status]}</span>
                  </div>
                  <div className="proposal-sub">
                    {req?.services?.name ?? '—'} · {req?.companies?.name ?? '—'} · {req?.project_type ?? '—'}
                    {req?.area_m2 ? ` · ${req.area_m2} m²` : ''}
                    {req?.location ? ` · ${req.location}` : ''}
                  </div>
                </div>
                <div className="proposal-prices">
                  <div>
                    <span>Estimativa</span>
                    <strong>{p.estimated_price != null ? formatBRL(Number(p.estimated_price)) : '—'}</strong>
                  </div>
                  <ArrowRight size={14} className="proposal-arrow" />
                  <div>
                    <span>Valor final</span>
                    <strong className={p.final_price ? 'proposal-final' : 'proposal-final-empty'}>
                      {p.final_price != null ? formatBRL(Number(p.final_price)) : '—'}
                    </strong>
                  </div>
                </div>
              </div>

              {!isEditing && (
                <div className="proposal-actions">
                  {p.status === 'DRAFT' && (
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => startEdit(p)}>
                      Editar e enviar
                    </button>
                  )}
                  {p.status === 'SENT' && (
                    <>
                      <span className="proposal-sent-at">
                        Enviada em {p.sent_at ? new Date(p.sent_at).toLocaleDateString('pt-BR') : '—'}
                      </span>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => cancelProposal(p)}>
                        <XCircle size={14} /> Cancelar
                      </button>
                    </>
                  )}
                  <Link href={`/admin/solicitacoes/${p.request_id}`} className="btn btn-ghost btn-sm">
                    Ver solicitação →
                  </Link>
                </div>
              )}

              {isEditing && (
                <div className="proposal-editor">
                  <div className="wizard-grid">
                    <label>
                      <span>Valor final (R$)</span>
                      <input
                        type="number" step="0.01"
                        value={form.final_price}
                        onChange={(e) => setForm({ ...form, final_price: e.target.value })}
                        placeholder="2400.00"
                      />
                    </label>
                    <label>
                      <span>Prazo de entrega (dias)</span>
                      <input
                        type="number"
                        value={form.delivery_days}
                        onChange={(e) => setForm({ ...form, delivery_days: e.target.value })}
                      />
                    </label>
                    <label>
                      <span>Revisões incluídas</span>
                      <input
                        type="number"
                        value={form.revisions_included}
                        onChange={(e) => setForm({ ...form, revisions_included: e.target.value })}
                      />
                    </label>
                    <label>
                      <span>Válida até</span>
                      <input
                        type="date"
                        value={form.valid_until}
                        onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                      />
                    </label>
                  </div>
                  <label className="wizard-full">
                    <span>Entregáveis (um por linha)</span>
                    <textarea
                      rows={3}
                      value={form.deliverables}
                      onChange={(e) => setForm({ ...form, deliverables: e.target.value })}
                      placeholder={'Planilha orçamentária em .xlsx\nMemória de cálculo em PDF\nART/RRT assinada'}
                    />
                  </label>
                  <label className="wizard-full">
                    <span>Observações para o cliente</span>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Premissas, exclusões, condições..."
                    />
                  </label>
                  <div className="proposal-editor-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEdit}>Cancelar</button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => saveDraft(p)}>
                      <Save size={14} /> Salvar rascunho
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => sendProposal(p)}>
                      <Send size={14} /> Enviar ao cliente
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

function defaultValidUntil(): string {
  const d = new Date()
  d.setDate(d.getDate() + 15)
  return d.toISOString().slice(0, 10)
}

function Kpi({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone?: string }) {
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
