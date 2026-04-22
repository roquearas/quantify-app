'use client'
import { useMemo, useState } from 'react'
import { Calculator, Edit3, Save, X } from 'lucide-react'
import {
  BDI_DEFAULTS,
  BDI_RANGES,
  computeBdiFromBreakdown,
  parseBdiBreakdown,
  type BdiBreakdown,
} from '../lib/bdi'

interface BdiEditorProps {
  /** BDI atual do orçamento (%). Usado se breakdown for null. */
  bdiPercent: number | null
  /** Breakdown JSONB atual (pode ser null). */
  breakdown: unknown
  /** Chamada ao salvar — passa o BDI aplicado e (se aplicável) o breakdown. */
  onSave: (bdi: { bdiPercent: number | null; breakdown: BdiBreakdown | null }) => Promise<void> | void
  /** Bloqueia edição (ex: budget validado). */
  readOnly?: boolean
}

type Mode = 'simples' | 'tcu'

export function BdiEditor({ bdiPercent, breakdown, onSave, readOnly = false }: BdiEditorProps) {
  const parsed = useMemo(() => parseBdiBreakdown(breakdown), [breakdown])
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<Mode>(parsed ? 'tcu' : 'simples')
  const [simple, setSimple] = useState<string>(
    bdiPercent != null ? Number(bdiPercent).toFixed(2) : '',
  )
  const [form, setForm] = useState<BdiBreakdown>(parsed ?? { ...BDI_DEFAULTS })

  const computed = useMemo(() => computeBdiFromBreakdown(form), [form])
  const computedValid = Number.isFinite(computed)
  const currentBdi = parsed ? computeBdiFromBreakdown(parsed) : Number(bdiPercent ?? 0)
  const outOfRange = computedValid && (computed < BDI_RANGES.total.min || computed > BDI_RANGES.total.max)

  function resetForm() {
    setMode(parsed ? 'tcu' : 'simples')
    setSimple(bdiPercent != null ? Number(bdiPercent).toFixed(2) : '')
    setForm(parsed ?? { ...BDI_DEFAULTS })
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (mode === 'simples') {
        const pct = parseFloat(simple)
        const v = Number.isFinite(pct) ? Math.max(0, pct) : null
        await onSave({ bdiPercent: v, breakdown: null })
      } else {
        if (!computedValid) {
          alert('Composição inválida: impostos ≥ 100% torna a fórmula inviável.')
          return
        }
        await onSave({ bdiPercent: computed, breakdown: form })
      }
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  // View mode
  if (!editing) {
    return (
      <div className="card">
        <div className="card-header">
          <h3><Calculator size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />BDI</h3>
          {!readOnly && (
            <button className="btn btn-outline btn-sm" onClick={() => { resetForm(); setEditing(true) }}>
              <Edit3 size={12} /> Editar
            </button>
          )}
        </div>
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <div className="kpi-value" style={{ color: 'var(--accent-warm)' }}>
              {bdiPercent != null ? `${Number(bdiPercent).toFixed(2)}%` : '—'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {parsed ? 'composição TCU 2622/2013' : 'modo simples'}
            </div>
          </div>
          {parsed && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 12, fontSize: 12 }}>
              <BreakdownStat label="Lucro" value={parsed.lucro} />
              <BreakdownStat label="Impostos" value={parsed.impostos} />
              <BreakdownStat label="Desp. indiretas" value={parsed.despesas_indiretas} />
              <BreakdownStat label="Risco" value={parsed.risco} />
            </div>
          )}
          {parsed && Math.abs((bdiPercent ?? 0) - currentBdi) > 0.05 && (
            <div style={{ fontSize: 11, color: '#d97706', marginTop: 8 }}>
              ⚠️ BDI salvo ({Number(bdiPercent ?? 0).toFixed(2)}%) divergente do recalculo TCU ({currentBdi.toFixed(2)}%). Reabra e salve para sincronizar.
            </div>
          )}
        </div>
      </div>
    )
  }

  // Edit mode
  return (
    <div className="card">
      <div className="card-header">
        <h3><Calculator size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Editar BDI</h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)} disabled={saving}>
            <X size={12} /> Cancelar
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={saving || (mode === 'tcu' && !computedValid)}
          >
            <Save size={12} /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div style={{ padding: '12px 0' }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <input type="radio" checked={mode === 'simples'} onChange={() => setMode('simples')} />
            Modo simples (%)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <input type="radio" checked={mode === 'tcu'} onChange={() => setMode('tcu')} />
            Composição TCU 2622/2013
          </label>
        </div>

        {mode === 'simples' ? (
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              BDI aplicado ao orçamento (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={simple}
              onChange={(e) => setSimple(e.target.value)}
              className="input"
              style={{ width: 160 }}
              placeholder="Ex: 24.00"
            />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              Faixa TCU típica para edificações: {BDI_RANGES.total.min}% – {BDI_RANGES.total.max}%.
            </p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <BreakdownInput
                label="Lucro (%)"
                value={form.lucro}
                range={BDI_RANGES.lucro}
                onChange={(v) => setForm({ ...form, lucro: v })}
              />
              <BreakdownInput
                label="Impostos (%)"
                value={form.impostos}
                range={BDI_RANGES.impostos}
                hint="ISS + PIS + COFINS + CPRB"
                onChange={(v) => setForm({ ...form, impostos: v })}
              />
              <BreakdownInput
                label="Despesas indiretas (%)"
                value={form.despesas_indiretas}
                range={BDI_RANGES.despesas_indiretas}
                hint="Admin central + seguros + garantia"
                onChange={(v) => setForm({ ...form, despesas_indiretas: v })}
              />
              <BreakdownInput
                label="Risco (%)"
                value={form.risco}
                range={BDI_RANGES.risco}
                onChange={(v) => setForm({ ...form, risco: v })}
              />
            </div>
            <div style={{ marginTop: 16, padding: 12, background: 'rgba(230,126,34,0.08)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>BDI calculado (TCU)</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: computedValid ? 'var(--accent-warm)' : '#c0392b' }}>
                  {computedValid ? `${computed.toFixed(2)}%` : 'N/A'}
                </div>
              </div>
              {computedValid && outOfRange && (
                <div style={{ fontSize: 11, color: '#d97706', textAlign: 'right' }}>
                  ⚠️ Fora da faixa típica ({BDI_RANGES.total.min}%–{BDI_RANGES.total.max}%)
                </div>
              )}
              {!computedValid && (
                <div style={{ fontSize: 11, color: '#c0392b' }}>
                  Impostos ≥ 100% torna a fórmula inviável.
                </div>
              )}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
              BDI = [(1 + desp. indir. + risco) × (1 + lucro)] / (1 − impostos) − 1
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function BreakdownStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{Number(value).toFixed(2)}%</div>
    </div>
  )
}

function BreakdownInput({
  label,
  value,
  onChange,
  range,
  hint,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  range: { min: number; max: number }
  hint?: string
}) {
  const outOfRange = value > 0 && (value < range.min || value > range.max)
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => {
          const n = parseFloat(e.target.value)
          onChange(Number.isFinite(n) ? n : 0)
        }}
        className="input"
        style={{ width: '100%', borderColor: outOfRange ? '#d97706' : undefined }}
      />
      <div style={{ fontSize: 10, color: outOfRange ? '#d97706' : 'var(--text-muted)', marginTop: 2 }}>
        {outOfRange
          ? `⚠️ fora da faixa típica ${range.min}–${range.max}%`
          : hint || `Faixa típica: ${range.min}–${range.max}%`}
      </div>
    </div>
  )
}
