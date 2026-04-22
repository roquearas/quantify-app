'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BarChart3 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatBRL } from '../../lib/pricingEngine'
import {
  loadCurvaAbc,
  summarizeCurvaAbc,
  type CurvaAbcRow,
  type CurvaAbcStats,
} from '../../lib/curvaAbc'

type BudgetStatus = 'AI_DRAFT' | 'IN_REVIEW' | 'VALIDATED' | 'REJECTED'

interface BudgetHeader {
  id: string
  name: string
  version: number
  status: BudgetStatus
  project_id: string
  projects: { name: string; client_name: string | null } | null
}

const statusLabel: Record<BudgetStatus, string> = {
  AI_DRAFT: 'Rascunho IA',
  IN_REVIEW: 'Em revisão',
  VALIDATED: 'Validado',
  REJECTED: 'Rejeitado',
}

const classeColor: Record<'A' | 'B' | 'C', { bg: string; fg: string; label: string }> = {
  A: { bg: 'rgba(22,163,74,0.12)', fg: '#16a34a', label: 'A — Críticos (≤80%)' },
  B: { bg: 'rgba(217,119,6,0.12)', fg: '#d97706', label: 'B — Intermediários (80–95%)' },
  C: { bg: 'rgba(100,116,139,0.12)', fg: '#64748b', label: 'C — Cauda longa (95–100%)' },
}

function ClasseBadge({ classe }: { classe: 'A' | 'B' | 'C' | null }) {
  if (!classe) {
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600,
          background: 'rgba(100,116,139,0.12)',
          color: '#64748b',
        }}
      >
        —
      </span>
    )
  }
  const c = classeColor[classe]
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        background: c.bg,
        color: c.fg,
        minWidth: 22,
        textAlign: 'center',
      }}
    >
      {classe}
    </span>
  )
}

/** Barra horizontal empilhada mostrando a distribuição A/B/C por custo. */
function DistributionBar({ stats }: { stats: CurvaAbcStats }) {
  const total = stats.totalCusto
  if (total <= 0) {
    return (
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        Orçamento sem custo registrado — sem curva para exibir.
      </div>
    )
  }
  const aPct = stats.classeA.percent
  const bPct = stats.classeB.percent
  const cPct = stats.classeC.percent
  return (
    <div>
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: 24,
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid var(--line)',
        }}
      >
        {aPct > 0 && (
          <div
            style={{ width: `${aPct}%`, background: classeColor.A.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}
            title={`Classe A: ${aPct.toFixed(1)}% do custo`}
          >
            {aPct >= 8 ? `A · ${aPct.toFixed(1)}%` : ''}
          </div>
        )}
        {bPct > 0 && (
          <div
            style={{ width: `${bPct}%`, background: classeColor.B.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}
            title={`Classe B: ${bPct.toFixed(1)}% do custo`}
          >
            {bPct >= 8 ? `B · ${bPct.toFixed(1)}%` : ''}
          </div>
        )}
        {cPct > 0 && (
          <div
            style={{ width: `${cPct}%`, background: classeColor.C.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}
            title={`Classe C: ${cPct.toFixed(1)}% do custo`}
          >
            {cPct >= 8 ? `C · ${cPct.toFixed(1)}%` : ''}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
        {(['A', 'B', 'C'] as const).map((k) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: classeColor[k].fg }} />
            <span>{classeColor[k].label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Pareto chart: barras (custo por item) + linha cumulativa. */
function ParetoChart({ rows }: { rows: CurvaAbcRow[] }) {
  const visible = rows.filter((r) => Number(r.total_cost ?? 0) > 0)
  if (visible.length === 0) return null

  const width = 640
  const height = 180
  const padding = { top: 8, right: 8, bottom: 8, left: 8 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const maxCost = Math.max(...visible.map((r) => Number(r.total_cost ?? 0)))
  const barGap = 2
  const barWidth = Math.max(2, (innerW - barGap * (visible.length - 1)) / visible.length)

  const line: string = visible
    .map((r, i) => {
      const x = padding.left + i * (barWidth + barGap) + barWidth / 2
      const pct = Number(r.cumulative_percent ?? 0) / 100
      const y = padding.top + innerH - pct * innerH
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  // Linha 80%
  const y80 = padding.top + innerH - 0.8 * innerH
  const y95 = padding.top + innerH - 0.95 * innerH

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: '100%', height: 'auto' }}>
      {/* Linhas de referência 80% e 95% */}
      <line x1={padding.left} y1={y80} x2={width - padding.right} y2={y80} stroke="var(--line)" strokeDasharray="4 3" />
      <text x={width - padding.right - 4} y={y80 - 3} textAnchor="end" fontSize="10" fill="var(--text-muted)">80%</text>
      <line x1={padding.left} y1={y95} x2={width - padding.right} y2={y95} stroke="var(--line)" strokeDasharray="4 3" />
      <text x={width - padding.right - 4} y={y95 - 3} textAnchor="end" fontSize="10" fill="var(--text-muted)">95%</text>

      {/* Barras */}
      {visible.map((r, i) => {
        const h = (Number(r.total_cost ?? 0) / maxCost) * innerH
        const x = padding.left + i * (barWidth + barGap)
        const y = padding.top + innerH - h
        const classe = (r.classe_abc as 'A' | 'B' | 'C' | null) ?? null
        const color = classe ? classeColor[classe].fg : '#94a3b8'
        return <rect key={r.id ?? i} x={x} y={y} width={barWidth} height={h} fill={color} opacity={0.55} />
      })}

      {/* Linha cumulativa */}
      <path d={line} fill="none" stroke="var(--accent-warm, #e67e22)" strokeWidth="2" />
    </svg>
  )
}

export default function AdminBudgetCurvaAbc() {
  const { id } = useParams() as { id: string }
  const [budget, setBudget] = useState<BudgetHeader | null>(null)
  const [rows, setRows] = useState<CurvaAbcRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const [bRes, rows] = await Promise.all([
          supabase
            .from('budgets')
            .select('id, name, version, status, project_id, projects!inner(name, client_name)')
            .eq('id', id)
            .single(),
          loadCurvaAbc(supabase, id),
        ])
        if (cancelled) return
        if (bRes.error) throw new Error(bRes.error.message)
        setBudget((bRes.data as unknown as BudgetHeader) || null)
        setRows(rows)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Falha ao carregar curva ABC')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const stats = useMemo(() => summarizeCurvaAbc(rows), [rows])

  if (loading) return <div className="loading">Carregando curva ABC...</div>
  if (error)
    return (
      <div className="empty-state">
        <h3>Erro</h3>
        <p>{error}</p>
      </div>
    )
  if (!budget) return <div className="empty-state"><h3>Orçamento não encontrado</h3></div>

  return (
    <>
      <div className="page-header">
        <div>
          <Link href={`/admin/orcamentos/${budget.id}`} className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }}>
            <ArrowLeft size={14} /> Voltar ao orçamento
          </Link>
          <h2><BarChart3 size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />Curva ABC — {budget.name}</h2>
          <p>{budget.projects?.name} · {budget.projects?.client_name || '—'} · v{budget.version} · {statusLabel[budget.status]}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="empty-state">
          <h3>Sem itens no orçamento</h3>
          <p>Adicione itens ao orçamento para visualizar a curva ABC.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-3" style={{ marginBottom: 20 }}>
            <div className="card">
              <div className="card-header"><h3>Classe A</h3><ClasseBadge classe="A" /></div>
              <div className="kpi-value" style={{ color: classeColor.A.fg }}>{stats.classeA.items}</div>
              <div className="kpi-label">itens · {formatBRL(stats.classeA.custo)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {stats.classeA.percent.toFixed(1)}% do custo total
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3>Classe B</h3><ClasseBadge classe="B" /></div>
              <div className="kpi-value" style={{ color: classeColor.B.fg }}>{stats.classeB.items}</div>
              <div className="kpi-label">itens · {formatBRL(stats.classeB.custo)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {stats.classeB.percent.toFixed(1)}% do custo total
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3>Classe C</h3><ClasseBadge classe="C" /></div>
              <div className="kpi-value" style={{ color: classeColor.C.fg }}>{stats.classeC.items}</div>
              <div className="kpi-label">itens · {formatBRL(stats.classeC.custo)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {stats.classeC.percent.toFixed(1)}% do custo total
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h3>Distribuição por classe</h3></div>
            <div style={{ padding: '8px 0' }}>
              <DistributionBar stats={stats} />
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)', fontSize: 13 }}>
              <div><span className="kpi-label">Total de itens</span><div style={{ fontWeight: 600 }}>{stats.totalItens}</div></div>
              <div><span className="kpi-label">Custo total</span><div style={{ fontWeight: 600, color: 'var(--accent-warm)' }}>{formatBRL(stats.totalCusto)}</div></div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h3>Pareto (custo por item + acumulado)</h3></div>
            <div style={{ padding: '8px 0' }}>
              <ParetoChart rows={rows} />
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: 16 }}>
              <h3>Itens ranqueados ({rows.length})</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'right' }}>#</th>
                  <th>Descrição</th>
                  <th>Unid.</th>
                  <th style={{ textAlign: 'right' }}>Qtde</th>
                  <th style={{ textAlign: 'right' }}>Custo unit.</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>% item</th>
                  <th style={{ textAlign: 'right' }}>% acum.</th>
                  <th style={{ textAlign: 'center' }}>Classe</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id ?? `${r.rank_position}`}>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                      {r.rank_position ?? '—'}
                    </td>
                    <td>
                      <div>{r.description || '—'}</div>
                      {r.category && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.category}</div>
                      )}
                    </td>
                    <td>{r.unit || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      {r.quantity != null ? Number(r.quantity).toLocaleString('pt-BR') : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {r.unit_cost != null ? formatBRL(Number(r.unit_cost)) : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {r.total_cost != null ? formatBRL(Number(r.total_cost)) : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {r.item_percent != null ? `${Number(r.item_percent).toFixed(2)}%` : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {r.cumulative_percent != null ? `${Number(r.cumulative_percent).toFixed(2)}%` : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <ClasseBadge classe={(r.classe_abc as 'A' | 'B' | 'C' | null) ?? null} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}
