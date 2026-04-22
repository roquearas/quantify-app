'use client'
import { useState } from 'react'
import { FileText, Edit3, Save, X, Eye, Code } from 'lucide-react'
import { parseMemorialMd, MEMORIAL_TEMPLATE, type MemorialBlock } from '../lib/memorial'

interface MemorialEditorProps {
  memorialMd: string | null
  onSave: (md: string | null) => Promise<void> | void
  readOnly?: boolean
}

type Tab = 'preview' | 'editor'

export function MemorialEditor({ memorialMd, onSave, readOnly = false }: MemorialEditorProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [value, setValue] = useState<string>(memorialMd ?? '')
  const [tab, setTab] = useState<Tab>('editor')

  const hasContent = memorialMd != null && memorialMd.trim().length > 0

  async function handleSave() {
    setSaving(true)
    try {
      const trimmed = value.trim()
      await onSave(trimmed.length === 0 ? null : value)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  function openEditor() {
    setValue(memorialMd ?? '')
    setTab('editor')
    setEditing(true)
  }

  function insertTemplate() {
    if (value.trim().length > 0) {
      if (!confirm('Substituir o conteúdo atual pelo template padrão?')) return
    }
    setValue(MEMORIAL_TEMPLATE)
  }

  // View mode
  if (!editing) {
    return (
      <div className="card">
        <div className="card-header">
          <h3>
            <FileText size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Memorial descritivo
          </h3>
          {!readOnly && (
            <button className="btn btn-outline btn-sm" onClick={openEditor}>
              <Edit3 size={12} /> {hasContent ? 'Editar' : 'Preencher'}
            </button>
          )}
        </div>
        <div style={{ padding: '8px 0' }}>
          {hasContent ? (
            <MemorialPreview blocks={parseMemorialMd(memorialMd)} />
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Nenhum memorial preenchido. {!readOnly && 'Clique em "Preencher" para descrever materiais, normas e especificações técnicas da obra.'}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Edit mode
  return (
    <div className="card">
      <div className="card-header">
        <h3>
          <FileText size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Editar memorial
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)} disabled={saving}>
            <X size={12} /> Cancelar
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            <Save size={12} /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div style={{ padding: '12px 0' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              className={`btn btn-sm ${tab === 'editor' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTab('editor')}
            >
              <Code size={12} /> Markdown
            </button>
            <button
              type="button"
              className={`btn btn-sm ${tab === 'preview' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTab('preview')}
            >
              <Eye size={12} /> Preview
            </button>
          </div>
          <div style={{ flex: 1 }} />
          {value.trim().length === 0 && (
            <button type="button" className="btn btn-outline btn-sm" onClick={insertTemplate}>
              Inserir template
            </button>
          )}
        </div>

        {tab === 'editor' ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="input"
            style={{
              width: '100%',
              minHeight: 320,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 13,
              lineHeight: 1.5,
            }}
            placeholder={`# Memorial descritivo\n\n## 1. Objeto\nDescreva o escopo da obra.\n\n## 2. Normas técnicas\n- ABNT NBR 6118\n- ABNT NBR 15575\n\n## 3. Materiais\nConcreto fck 25 MPa, aço CA-50...`}
          />
        ) : (
          <div
            style={{
              minHeight: 320,
              padding: 12,
              background: 'var(--bg-subtle, #F8FAFC)',
              borderRadius: 6,
              border: '1px solid var(--border, #E2E8F0)',
            }}
          >
            {value.trim().length > 0 ? (
              <MemorialPreview blocks={parseMemorialMd(value)} />
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Nada a visualizar — escreva o memorial na aba Markdown.
              </p>
            )}
          </div>
        )}

        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
          Suporta markdown básico: <code># título</code>, <code>## subtítulo</code>, <code>- item</code>. Renderizado no PDF do orçamento.
        </p>
      </div>
    </div>
  )
}

function MemorialPreview({ blocks }: { blocks: MemorialBlock[] }) {
  if (blocks.length === 0) {
    return <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Sem conteúdo.</p>
  }
  return (
    <div style={{ fontSize: 13, lineHeight: 1.55 }}>
      {blocks.map((b, i) => {
        if (b.kind === 'h1') return <h2 key={i} style={{ fontSize: 18, marginTop: i === 0 ? 0 : 16, marginBottom: 8 }}>{b.text}</h2>
        if (b.kind === 'h2') return <h3 key={i} style={{ fontSize: 15, marginTop: 12, marginBottom: 6, color: 'var(--accent-teal, #16A085)' }}>{b.text}</h3>
        if (b.kind === 'h3') return <h4 key={i} style={{ fontSize: 13, marginTop: 10, marginBottom: 4, fontWeight: 600 }}>{b.text}</h4>
        if (b.kind === 'p') return <p key={i} style={{ marginBottom: 8 }}>{b.text}</p>
        if (b.kind === 'ul') return (
          <ul key={i} style={{ marginBottom: 8, paddingLeft: 20 }}>
            {b.items.map((it, j) => <li key={j}>{it}</li>)}
          </ul>
        )
        return null
      })}
    </div>
  )
}
