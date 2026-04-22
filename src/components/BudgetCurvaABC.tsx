'use client'
import { useMemo } from 'react'
import { formatBRL } from '../lib/pricingEngine'
import type { CurvaAbcClasse } from '../lib/curvaAbc'

interface ClassifiedItem {
  id: string
  total_cost: number | null
  classe_abc: CurvaAbcClasse | null
}

interface Props {
  classified: readonly ClassifiedItem[]
  filtro: CurvaAbcClasse | null
  onFiltroChange: (f: CurvaAbcClasse | null) => void
}

export const CURVA_ABC_COLOR: Record<CurvaAbcClasse, string> = {
  A: '#C0392B', // vermelho — onde está o dinheiro, maior risco
  B: '#E67E22', // laranja — intermediário
  C: '#16A085', // verde — cauda longa
}

/**
 * Curva ABC compacta + controle de filtro por classe.
 * Thresholds seguem a convenção Pareto definida em migration 012 (80/95/100).
 */
export function BudgetCurvaABC({ classified, filtro, onFiltroChange }: Props) {
  const summary = useMemo(() => {
    const s = {
      A: { count: 0, sum: 0 },
      B: { count: 0, sum: 0 },
      C: { count: 0, sum: 0 },
      total: 0,
      ignorados: 0,
    }
    for (const it of classified) {
      const custo = Number(it.total_cost ?? 0)
      if (!it.classe_abc || custo <= 0) {
        s.ignorados += 1
        continue
      }
      s.total += custo
      s[it.classe_abc].count += 1
      s[it.classe_abc].sum += custo
    }
    return s
  }, [classified])

  if (summary.total <= 0) {
    return (
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Curva ABC indisponível — nenhum item com custo valorado ainda.
        </div>
      </div>
    )
  }

  const pct = (sum: number) => (summary.total > 0 ? (sum / summary.total) * 100 : 0)

  return (
    <div className="card" style={{ padding: 16, marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 12,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 14 }}>Curva ABC</h3>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Total {formatBRL(summary.total)} · {classified.length - summary.ignorados} itens valorados
          {summary.ignorados > 0 && ` (${summary.ignorados} sem custo)`}
        </span>
      </div>

      {(['A', 'B', 'C'] as const).map((classe) => {
        const row = summary[classe]
        const percent = pct(row.sum)
        return (
          <div key={classe} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span
              style={{ width: 18, fontWeight: 700, color: CURVA_ABC_COLOR[classe] }}
              aria-hidden
            >
              {classe}
            </span>
            <span style={{ width: 55, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
              {percent.toFixed(1)}%
            </span>
            <span style={{ width: 80, fontSize: 11, color: 'var(--text-muted)' }}>
              {row.count} {row.count === 1 ? 'item' : 'itens'}
            </span>
            <div
              role="progressbar"
              aria-valuenow={Math.round(percent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Classe ${classe}: ${percent.toFixed(1)} por cento do custo`}
              style={{
                flex: 1,
                height: 8,
                background: 'var(--bg-muted, #E2E8F0)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${percent}%`,
                  height: '100%',
                  background: CURVA_ABC_COLOR[classe],
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
            <span style={{ width: 120, fontSize: 12, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {formatBRL(row.sum)}
            </span>
          </div>
        )
      })}

      <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
        {(['A', 'B', 'C'] as const).map((classe) => {
          const active = filtro === classe
          return (
            <button
              key={classe}
              type="button"
              className={`btn btn-xs ${active ? 'btn-primary' : 'btn-outline'}`}
              aria-pressed={active}
              onClick={() => onFiltroChange(active ? null : classe)}
              style={active ? { borderColor: CURVA_ABC_COLOR[classe], background: CURVA_ABC_COLOR[classe] } : { borderColor: CURVA_ABC_COLOR[classe], color: CURVA_ABC_COLOR[classe] }}
            >
              Filtrar {classe}
            </button>
          )
        })}
        <button
          type="button"
          className="btn btn-xs btn-ghost"
          onClick={() => onFiltroChange(null)}
          disabled={filtro === null}
        >
          Limpar filtro
        </button>
      </div>
    </div>
  )
}
