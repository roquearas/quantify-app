'use client'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { ArrowLeft, CheckCircle2, XCircle, Edit3, Send, Database } from 'lucide-react'
import { formatBRL } from '../../lib/pricingEngine'
import { SinapiPicker } from '../../components/SinapiPicker'
import { linkBudgetItemSinapi, type SinapiSearchResult } from '../../lib/sinapi/search'

type Confidence = 'HIGH' | 'MEDIUM' | 'LOW'
type BudgetItemOrigem = 'MANUAL' | 'SINAPI_INSUMO' | 'SINAPI_COMPOSICAO' | 'AI_DRAFT'

interface BudgetItem {
  id: string
  code: string | null
  description: string
  unit: string
  quantity: number
  unit_cost: number | null
  total_cost: number | null
  confidence: Confidence
  category: string | null
  origem: BudgetItemOrigem
  sinapi_codigo: string | null
  sinapi_mes_referencia: string | null
}

interface Validation {
  id: string
  status: string
  item_type: string | null
  item_name: string | null
  comment: string | null
  created_at: string
  validated_by: string
}

interface Budget {
  id: string
  name: string
  status: string
  project_id: string
  projects: { name: string } | null
}

const confColor: Record<Confidence, string> = { HIGH: '#16A085', MEDIUM: '#E67E22', LOW: '#C0392B' }

export default function AdminBudgetReview() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { user } = useAuth()
  const [budget, setBudget] = useState<Budget | null>(null)
  const [items, setItems] = useState<BudgetItem[]>([])
  const [validations, setValidations] = useState<Validation[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editFields, setEditFields] = useState<{ quantity: string; unit_cost: string }>({ quantity: '', unit_cost: '' })
  const [busy, setBusy] = useState(false)
  const [pickerItem, setPickerItem] = useState<BudgetItem | null>(null)

  async function load() {
    setLoading(true)
    const [bRes, iRes, vRes] = await Promise.all([
      supabase.from('budgets').select('id, name, status, project_id, projects!inner(name)').eq('id', id).single(),
      supabase.from('budget_items').select('*').eq('budget_id', id).order('category').order('description'),
      supabase.from('validations').select('*').eq('budget_id', id).order('created_at'),
    ])
    setBudget((bRes.data as unknown as Budget) || null)
    setItems((iRes.data as unknown as BudgetItem[]) || [])
    setValidations((vRes.data as unknown as Validation[]) || [])
    setLoading(false)
  }

  useEffect(() => { if (id) load() }, [id])

  const itemStatusMap = new Map<string, string>()
  for (const v of validations) {
    if (v.item_type === 'BUDGET_ITEM' && v.item_name) itemStatusMap.set(v.item_name, v.status)
  }

  async function onAction(itemId: string, action: 'APPROVE' | 'REJECT') {
    if (!user) { alert('Não autenticado'); return }
    let comment: string | undefined
    if (action === 'REJECT') {
      const input = window.prompt('Motivo da rejeição:')
      if (!input) return
      comment = input
    }
    setBusy(true)
    const { error } = await supabase.rpc('validate_budget_item', {
      p_item_id: itemId, p_user_id: user.id, p_action: action, p_comment: comment,
    })
    setBusy(false)
    if (error) { alert('Erro: ' + error.message); return }
    await load()
  }

  async function onEdit(itemId: string) {
    if (!user) { alert('Não autenticado'); return }
    const qty = editFields.quantity ? Number(editFields.quantity) : undefined
    const cost = editFields.unit_cost ? Number(editFields.unit_cost) : undefined
    const changes: Record<string, number> = {}
    if (qty !== undefined) changes.quantity = qty
    if (cost !== undefined) changes.unit_cost = cost
    setBusy(true)
    const { error } = await supabase.rpc('validate_budget_item', {
      p_item_id: itemId, p_user_id: user.id, p_action: 'EDIT',
      p_comment: 'Editado na revisão',
      p_changes: changes,
    })
    setBusy(false)
    if (error) { alert('Erro: ' + error.message); return }
    setEditing(null)
    await load()
  }

  async function onLinkSinapi(
    itemId: string,
    result: SinapiSearchResult,
    updateCost: boolean,
  ) {
    if (!user) { alert('Não autenticado'); return }
    setBusy(true)
    try {
      await linkBudgetItemSinapi(supabase, {
        itemId,
        userId: user.id,
        sinapiType: result.tipo,
        sinapiId: result.id,
        updateCost,
      })
      setPickerItem(null)
      await load()
    } catch (err) {
      alert('Erro ao linkar SINAPI: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setBusy(false)
    }
  }

  async function onFinalize() {
    if (!user) return
    if (!confirm('Finalizar revisão? Itens aprovados serão validados; se houver rejeição, o budget vai para REJECTED.')) return
    setBusy(true)
    const { data, error } = await supabase.rpc('finalize_budget_review', {
      p_budget_id: id, p_user_id: user.id,
    })
    setBusy(false)
    if (error) { alert('Erro: ' + error.message); return }
    alert('Resultado: ' + data)
    router.push(`/admin/orcamentos/${id}`)
  }

  if (loading) return <div className="loading">Carregando...</div>
  if (!budget) return <div className="empty-state"><h3>Orçamento não encontrado</h3></div>
  if (budget.status !== 'IN_REVIEW') {
    return (
      <div className="empty-state">
        <h3>Orçamento não está em revisão</h3>
        <p>Status atual: {budget.status}</p>
        <Link href={`/admin/orcamentos/${id}`} className="btn btn-outline">Ver detalhes</Link>
      </div>
    )
  }

  const approvedCount = items.filter((it) => itemStatusMap.get(it.description) === 'VALIDATED').length
  const rejectedCount = items.filter((it) => itemStatusMap.get(it.description) === 'REJECTED').length
  const pendingCount = items.length - approvedCount - rejectedCount
  const canFinalize = pendingCount === 0 || rejectedCount > 0

  return (
    <>
      <div className="page-header">
        <div>
          <Link href={`/admin/orcamentos/${id}`} className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }}>
            <ArrowLeft size={14} /> Voltar
          </Link>
          <h2>Revisar: {budget.name}</h2>
          <p>{budget.projects?.name} · {items.length} itens ({approvedCount} aprovados, {rejectedCount} rejeitados, {pendingCount} pendentes)</p>
        </div>
        <button className="btn btn-primary" onClick={onFinalize} disabled={busy || !canFinalize}>
          <Send size={14} /> Finalizar revisão
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 20 }}></th>
              <th>Descrição</th>
              <th>Unid.</th>
              <th style={{ textAlign: 'right' }}>Qtde</th>
              <th style={{ textAlign: 'right' }}>Custo unit.</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th style={{ textAlign: 'center', width: 160 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const status = itemStatusMap.get(it.description)
              const isEditing = editing === it.id
              const isApproved = status === 'VALIDATED'
              const isRejected = status === 'REJECTED'
              return (
                <tr key={it.id} style={{ opacity: isApproved ? 0.6 : 1 }}>
                  <td style={{ color: confColor[it.confidence] }}>●</td>
                  <td>
                    <div>{it.description}</div>
                    {it.category && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{it.category}</div>}
                    {it.origem !== 'MANUAL' && it.sinapi_codigo && (
                      <div style={{ fontSize: 11, color: '#2980B9', display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                        <Database size={10} />
                        SINAPI {it.origem === 'SINAPI_INSUMO' ? 'insumo' : 'composição'} {it.sinapi_codigo}
                        {it.sinapi_mes_referencia && ` · ${it.sinapi_mes_referencia.slice(0, 7)}`}
                      </div>
                    )}
                    {isApproved && <div style={{ fontSize: 11, color: '#16A085' }}>✓ aprovado</div>}
                    {isRejected && <div style={{ fontSize: 11, color: '#C0392B' }}>✗ rejeitado</div>}
                  </td>
                  <td>{it.unit}</td>
                  <td style={{ textAlign: 'right' }}>
                    {isEditing
                      ? <input type="number" step="any" value={editFields.quantity} onChange={(e) => setEditFields({ ...editFields, quantity: e.target.value })} style={{ width: 90 }} />
                      : Number(it.quantity).toLocaleString('pt-BR')}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {isEditing
                      ? <input type="number" step="any" value={editFields.unit_cost} onChange={(e) => setEditFields({ ...editFields, unit_cost: e.target.value })} style={{ width: 110 }} />
                      : (it.unit_cost != null ? formatBRL(Number(it.unit_cost)) : '—')}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{it.total_cost != null ? formatBRL(Number(it.total_cost)) : '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button className="btn btn-xs btn-primary" onClick={() => onEdit(it.id)} disabled={busy}>Salvar</button>
                        <button className="btn btn-xs btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button className="btn btn-xs btn-outline" title="Aprovar" onClick={() => onAction(it.id, 'APPROVE')} disabled={busy || isApproved}><CheckCircle2 size={12} /></button>
                        <button className="btn btn-xs btn-outline" title="Editar" onClick={() => { setEditing(it.id); setEditFields({ quantity: String(it.quantity), unit_cost: String(it.unit_cost ?? '') }) }} disabled={busy || isApproved}><Edit3 size={12} /></button>
                        <button className="btn btn-xs btn-outline" title="Linkar SINAPI" onClick={() => setPickerItem(it)} disabled={busy || isApproved}><Database size={12} /></button>
                        <button className="btn btn-xs btn-outline" title="Rejeitar" onClick={() => onAction(it.id, 'REJECT')} disabled={busy || isRejected}><XCircle size={12} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <SinapiPicker
        isOpen={pickerItem !== null}
        defaultQuery={pickerItem?.description ?? ''}
        onClose={() => setPickerItem(null)}
        onSelect={async (result, updateCost) => {
          if (pickerItem) await onLinkSinapi(pickerItem.id, result, updateCost)
        }}
      />

      {validations.length > 0 && (
        <div className="card" style={{ marginTop: 16, padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: 16 }}><h3>Trilha de validações ({validations.length})</h3></div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Status</th>
                <th>Item</th>
                <th>Comentário</th>
              </tr>
            </thead>
            <tbody>
              {validations.map((v) => (
                <tr key={v.id}>
                  <td style={{ fontSize: 11 }}>{new Date(v.created_at).toLocaleString('pt-BR')}</td>
                  <td>
                    <span className={`badge ${v.status === 'VALIDATED' ? 'badge-validated' : v.status === 'REJECTED' ? 'badge-rejected' : 'badge-review'}`}>
                      {v.status}
                    </span>
                  </td>
                  <td>{v.item_name || <em style={{ color: 'var(--text-muted)' }}>(budget)</em>}</td>
                  <td style={{ fontSize: 12 }}>{v.comment || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
