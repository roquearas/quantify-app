'use client'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { ArrowLeft, CheckCircle2, XCircle, Edit3, Send, Database, Sparkles } from 'lucide-react'
import { formatBRL } from '../../lib/pricingEngine'
import { SinapiPicker } from '../../components/SinapiPicker'
import { linkBudgetItemSinapi, type SinapiSearchResult } from '../../lib/sinapi/search'
import {
  suggestSinapiForBudget,
  type SinapiSuggestion,
} from '../../lib/sinapi/suggest'
import { applyBdi } from '../../lib/bdi'
import { classifyCurvaAbc, type CurvaAbcClasse } from '../../lib/curvaAbc'
import { BudgetCurvaABC, CURVA_ABC_COLOR } from '../../components/BudgetCurvaABC'

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
  bdi_override_percent: number | null
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
  bdi_percentage: number | null
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
  const [editFields, setEditFields] = useState<{ quantity: string; unit_cost: string; bdi_override: string }>({ quantity: '', unit_cost: '', bdi_override: '' })
  const [busy, setBusy] = useState(false)
  const [pickerItem, setPickerItem] = useState<BudgetItem | null>(null)
  const [filtroClasse, setFiltroClasse] = useState<CurvaAbcClasse | null>(null)
  const [suggestions, setSuggestions] = useState<Map<string, SinapiSuggestion>>(new Map())
  const [suggesting, setSuggesting] = useState(false)
  const [suggestionError, setSuggestionError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const [bRes, iRes, vRes] = await Promise.all([
      supabase.from('budgets').select('id, name, status, bdi_percentage, project_id, projects!inner(name)').eq('id', id).single(),
      supabase.from('budget_items').select('*').eq('budget_id', id).order('category').order('description'),
      supabase.from('validations').select('*').eq('budget_id', id).order('created_at'),
    ])
    setBudget((bRes.data as unknown as Budget) || null)
    setItems((iRes.data as unknown as BudgetItem[]) || [])
    setValidations((vRes.data as unknown as Validation[]) || [])
    setLoading(false)
  }

  useEffect(() => { if (id) load() }, [id])

  const totals = useMemo(() => applyBdi(items, budget?.bdi_percentage ?? 0), [items, budget?.bdi_percentage])
  const hasOverrides = useMemo(() => items.some((it) => it.bdi_override_percent != null), [items])

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
    const origItem = items.find((it) => it.id === itemId)
    const origOverride = origItem?.bdi_override_percent ?? null
    const trimmedBdi = editFields.bdi_override.trim()
    const newOverride: number | null =
      trimmedBdi === '' ? null : Number.isFinite(Number(trimmedBdi)) ? Number(trimmedBdi) : null
    const changes: Record<string, number | null> = {}
    if (qty !== undefined) changes.quantity = qty
    if (cost !== undefined) changes.unit_cost = cost
    // Só envia bdi_override_percent se mudou (para não disparar UPDATE supérfluo)
    if (newOverride !== origOverride) changes.bdi_override_percent = newOverride
    if (Object.keys(changes).length === 0) { setEditing(null); return }
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

  async function runSuggestions() {
    setSuggesting(true)
    setSuggestionError(null)
    try {
      const list = await suggestSinapiForBudget(supabase, id)
      setSuggestions(new Map(list.map((s) => [s.item_id, s])))
    } catch (err) {
      setSuggestionError(err instanceof Error ? err.message : String(err))
    } finally {
      setSuggesting(false)
    }
  }

  async function acceptSuggestion(itemId: string) {
    const sug = suggestions.get(itemId)
    if (!sug || !user) return
    setBusy(true)
    try {
      await linkBudgetItemSinapi(supabase, {
        itemId,
        userId: user.id,
        sinapiType: sug.sinapi_type,
        sinapiId: sug.sinapi_id,
        updateCost: true,
      })
      setSuggestions((prev) => {
        const next = new Map(prev)
        next.delete(itemId)
        return next
      })
      await load()
    } catch (err) {
      alert('Erro ao aceitar sugestão: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setBusy(false)
    }
  }

  function ignoreSuggestion(itemId: string) {
    setSuggestions((prev) => {
      const next = new Map(prev)
      next.delete(itemId)
      return next
    })
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

  const classified = useMemo(() => classifyCurvaAbc(items), [items])
  const classeByItemId = useMemo(
    () => new Map(classified.map((c) => [c.id, c.classe_abc])),
    [classified],
  )
  const itemsFiltrados = useMemo(
    () => (filtroClasse ? items.filter((it) => classeByItemId.get(it.id) === filtroClasse) : items),
    [items, filtroClasse, classeByItemId],
  )

  return (
    <>
      <div className="page-header">
        <div>
          <Link href={`/admin/orcamentos/${id}`} className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }}>
            <ArrowLeft size={14} /> Voltar
          </Link>
          <h2>Revisar: {budget.name}</h2>
          <p>
            {budget.projects?.name} · {items.length} itens ({approvedCount} aprovados, {rejectedCount} rejeitados, {pendingCount} pendentes)
            {filtroClasse && ` · filtrando classe ${filtroClasse} (${itemsFiltrados.length} visíveis)`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn btn-outline"
            onClick={runSuggestions}
            disabled={suggesting || busy}
            title="Sugerir SINAPI (fuzzy-match em batch) para itens ainda não linkados"
          >
            <Sparkles size={14} /> {suggesting ? 'Sugerindo…' : 'Sugerir SINAPI'}
          </button>
          <button className="btn btn-primary" onClick={onFinalize} disabled={busy || !canFinalize}>
            <Send size={14} /> Finalizar revisão
          </button>
        </div>
      </div>

      {suggestionError && (
        <div
          className="card"
          style={{ padding: 12, background: 'rgba(192,57,43,0.08)', color: '#C0392B', marginBottom: 12 }}
        >
          Falha ao sugerir SINAPI: {suggestionError}
        </div>
      )}
      {suggestions.size > 0 && !suggestionError && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          <Sparkles size={11} style={{ verticalAlign: 'middle' }} />{' '}
          {suggestions.size} {suggestions.size === 1 ? 'sugestão SINAPI' : 'sugestões SINAPI'} pendente
          {suggestions.size === 1 ? '' : 's'}. Aceite ou ignore em cada linha.
        </p>
      )}

      <BudgetCurvaABC
        classified={classified}
        filtro={filtroClasse}
        onFiltroChange={setFiltroClasse}
      />

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
              <th style={{ textAlign: 'right', width: 120 }}>BDI %</th>
              <th style={{ textAlign: 'center', width: 160 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {itemsFiltrados.map((it) => {
              const status = itemStatusMap.get(it.description)
              const isEditing = editing === it.id
              const isApproved = status === 'VALIDATED'
              const isRejected = status === 'REJECTED'
              const classe = classeByItemId.get(it.id)
              return (
                <tr key={it.id} style={{ opacity: isApproved ? 0.6 : 1 }}>
                  <td style={{ color: confColor[it.confidence] }}>●</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {classe && (
                        <span
                          title={`Classe ${classe} da curva ABC`}
                          style={{
                            display: 'inline-block',
                            minWidth: 18,
                            padding: '1px 5px',
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#fff',
                            background: CURVA_ABC_COLOR[classe],
                            borderRadius: 3,
                            textAlign: 'center',
                          }}
                        >
                          {classe}
                        </span>
                      )}
                      <span>{it.description}</span>
                    </div>
                    {it.category && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{it.category}</div>}
                    {it.origem !== 'MANUAL' && it.sinapi_codigo && (
                      <div style={{ fontSize: 11, color: '#2980B9', display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                        <Database size={10} />
                        SINAPI {it.origem === 'SINAPI_INSUMO' ? 'insumo' : 'composição'} {it.sinapi_codigo}
                        {it.sinapi_mes_referencia && ` · ${it.sinapi_mes_referencia.slice(0, 7)}`}
                      </div>
                    )}
                    {suggestions.has(it.id) && !isApproved && (() => {
                      const sug = suggestions.get(it.id)!
                      return (
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 11,
                            color: '#8E44AD',
                            display: 'flex',
                            gap: 6,
                            alignItems: 'center',
                            flexWrap: 'wrap',
                          }}
                        >
                          <Sparkles size={11} />
                          <span>
                            SINAPI sugerido{' '}
                            {sug.sinapi_type === 'COMPOSICAO' ? 'composição' : 'insumo'}{' '}
                            <strong>{sug.sinapi_codigo}</strong>
                            {' '}({Math.round(sug.similarity * 100)}%)
                          </span>
                          <button
                            className="btn btn-xs btn-primary"
                            onClick={() => acceptSuggestion(it.id)}
                            disabled={busy}
                          >
                            Aceitar
                          </button>
                          <button
                            className="btn btn-xs btn-ghost"
                            onClick={() => ignoreSuggestion(it.id)}
                            disabled={busy}
                          >
                            Ignorar
                          </button>
                        </div>
                      )
                    })()}
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
                  <td style={{ textAlign: 'right', fontSize: 12 }}>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editFields.bdi_override}
                        onChange={(e) => setEditFields({ ...editFields, bdi_override: e.target.value })}
                        placeholder={`(${Number(budget.bdi_percentage ?? 0).toFixed(1)})`}
                        style={{ width: 90 }}
                        title="Deixe vazio para usar o BDI global do orçamento"
                      />
                    ) : it.bdi_override_percent != null ? (
                      <span style={{ color: 'var(--accent-warm)', fontWeight: 600 }}>
                        {Number(it.bdi_override_percent).toFixed(2)}% *
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>
                        {Number(budget.bdi_percentage ?? 0).toFixed(2)}%
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button className="btn btn-xs btn-primary" onClick={() => onEdit(it.id)} disabled={busy}>Salvar</button>
                        <button className="btn btn-xs btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button className="btn btn-xs btn-outline" title="Aprovar" onClick={() => onAction(it.id, 'APPROVE')} disabled={busy || isApproved}><CheckCircle2 size={12} /></button>
                        <button className="btn btn-xs btn-outline" title="Editar" onClick={() => { setEditing(it.id); setEditFields({ quantity: String(it.quantity), unit_cost: String(it.unit_cost ?? ''), bdi_override: it.bdi_override_percent != null ? String(it.bdi_override_percent) : '' }) }} disabled={busy || isApproved}><Edit3 size={12} /></button>
                        <button className="btn btn-xs btn-outline" title="Linkar SINAPI" onClick={() => setPickerItem(it)} disabled={busy || isApproved}><Database size={12} /></button>
                        <button className="btn btn-xs btn-outline" title="Rejeitar" onClick={() => onAction(it.id, 'REJECT')} disabled={busy || isRejected}><XCircle size={12} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} style={{ textAlign: 'right' }}>Subtotal (sem BDI)</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatBRL(totals.subtotal)}</td>
              <td colSpan={2} />
            </tr>
            {(budget.bdi_percentage != null || hasOverrides) && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'right' }}>
                  BDI aplicado ({totals.bdiEffectivePercent.toFixed(2)}% médio{hasOverrides ? ' — com overrides' : ''})
                </td>
                <td style={{ textAlign: 'right' }}>{formatBRL(totals.bdiAmount)}</td>
                <td colSpan={2} />
              </tr>
            )}
            <tr>
              <td colSpan={5} style={{ textAlign: 'right' }}><strong>Total com BDI</strong></td>
              <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-warm)' }}><strong>{formatBRL(totals.total)}</strong></td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
      {hasOverrides && (
        <p style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
          * item com BDI override (sobrescreve o BDI global do orçamento).
        </p>
      )}

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
