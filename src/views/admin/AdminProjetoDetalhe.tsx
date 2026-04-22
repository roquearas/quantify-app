'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Upload, FileText, Calculator, Info, Download, Paperclip } from 'lucide-react'
import { formatBRL } from '../../lib/pricingEngine'

type DocumentType = 'FLOOR_PLAN' | 'MEMORIAL' | 'SPREADSHEET' | 'BIM_MODEL' | 'TECHNICAL' | 'OTHER'

interface Project {
  id: string
  name: string
  type: string
  status: string
  description: string | null
  address: string | null
  city: string | null
  state: string | null
  total_area: number | null
  standard: string | null
  client_name: string | null
  company_id: string
  created_at: string
  updated_at: string
}

interface Budget {
  id: string
  name: string
  version: number
  status: string
  type: string
  total_cost: number | null
  created_at: string
}

interface DocumentRow {
  source: 'documents' | 'request_files'
  id: string
  name: string
  type_or_kind: string
  path: string
  size: number | null
  mime: string | null
  created_at: string
}

const docTypeLabel: Record<DocumentType, string> = {
  FLOOR_PLAN: 'Planta baixa',
  MEMORIAL: 'Memorial',
  SPREADSHEET: 'Planilha',
  BIM_MODEL: 'Modelo BIM',
  TECHNICAL: 'Técnico',
  OTHER: 'Outro',
}

const projectStatusLabel: Record<string, string> = {
  STUDY: 'Estudo', PRELIMINARY: 'Preliminar', EXECUTIVE: 'Executivo',
  BIDDING: 'Licitação', IN_PROGRESS: 'Em andamento', COMPLETED: 'Concluído', ARCHIVED: 'Arquivado',
}

const budgetStatusLabel: Record<string, { label: string; cls: string }> = {
  AI_DRAFT: { label: 'Rascunho IA', cls: 'badge-draft' },
  IN_REVIEW: { label: 'Em revisão', cls: 'badge-review' },
  VALIDATED: { label: 'Validado', cls: 'badge-validated' },
  REJECTED: { label: 'Rejeitado', cls: 'badge-rejected' },
}

function fmtBytes(b: number | null) {
  if (!b) return '—'
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

export default function AdminProjetoDetalhe() {
  const { id } = useParams() as { id: string }
  const [tab, setTab] = useState<'info' | 'budgets' | 'docs'>('info')
  const [project, setProject] = useState<Project | null>(null)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [docs, setDocs] = useState<DocumentRow[]>([])
  const [loading, setLoading] = useState(true)

  // Upload form state
  const [upFile, setUpFile] = useState<File | null>(null)
  const [upType, setUpType] = useState<DocumentType>('FLOOR_PLAN')
  const [upName, setUpName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [upError, setUpError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const [pRes, bRes, dRes, rfRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('budgets').select('id, name, version, status, type, total_cost, created_at').eq('project_id', id).order('created_at', { ascending: false }),
      supabase.from('documents').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      supabase.from('service_requests').select('id').eq('project_id', id),
    ])

    setProject((pRes.data as unknown as Project) || null)
    setBudgets((bRes.data as unknown as Budget[]) || [])

    const requestIds = ((rfRes.data as unknown as Array<{ id: string }>) || []).map(r => r.id)
    let requestFiles: Array<{ id: string; filename: string; kind: string; storage_path: string; mime_type: string | null; size_bytes: number | null; created_at: string }> = []
    if (requestIds.length > 0) {
      const rfList = await supabase
        .from('request_files')
        .select('id, filename, kind, storage_path, mime_type, size_bytes, created_at')
        .in('request_id', requestIds)
        .order('created_at', { ascending: false })
      requestFiles = (rfList.data as unknown as typeof requestFiles) || []
    }

    const docsRaw = (dRes.data as unknown as Array<{ id: string; name: string; type: string; file_url: string; file_size: number | null; mime_type: string | null; created_at: string }>) || []
    const merged: DocumentRow[] = [
      ...docsRaw.map(d => ({ source: 'documents' as const, id: d.id, name: d.name, type_or_kind: docTypeLabel[d.type as DocumentType] || d.type, path: d.file_url, size: d.file_size, mime: d.mime_type, created_at: d.created_at })),
      ...requestFiles.map(r => ({ source: 'request_files' as const, id: r.id, name: r.filename, type_or_kind: r.kind, path: r.storage_path, size: r.size_bytes, mime: r.mime_type, created_at: r.created_at })),
    ].sort((a, b) => b.created_at.localeCompare(a.created_at))

    setDocs(merged)
    setLoading(false)
  }

  useEffect(() => { if (id) load() }, [id])

  async function downloadDoc(row: DocumentRow) {
    const { data, error } = await supabase.storage
      .from('project-documents')
      .createSignedUrl(row.path, 3600)
    if (error) { alert('Erro ao baixar: ' + error.message); return }
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function uploadDoc(e: React.FormEvent) {
    e.preventDefault()
    if (!upFile || !project) return
    setUploading(true)
    setUpError(null)

    const ts = Date.now()
    const safeName = upFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${project.id}/${ts}_${safeName}`

    const { error: upErr } = await supabase.storage
      .from('project-documents')
      .upload(path, upFile, {
        contentType: upFile.type || 'application/octet-stream',
        upsert: false,
      })

    if (upErr) { setUpError(upErr.message); setUploading(false); return }

    const { error: insErr } = await supabase.from('documents').insert({
      project_id: project.id,
      name: upName || upFile.name,
      type: upType,
      file_url: path,
      file_size: upFile.size,
      mime_type: upFile.type || null,
    })

    setUploading(false)
    if (insErr) { setUpError('Upload OK mas falhou registrar: ' + insErr.message); return }

    setUpFile(null)
    setUpName('')
    await load()
  }

  if (loading) return <div className="loading">Carregando...</div>
  if (!project) return <div className="empty-state"><h3>Projeto não encontrado</h3></div>

  return (
    <>
      <div className="page-header">
        <div>
          <Link href="/admin/projetos" className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }}>
            <ArrowLeft size={14} /> Voltar
          </Link>
          <h2>{project.name}</h2>
          <p>{project.client_name || '—'} · {project.city && project.state ? `${project.city} / ${project.state}` : 'Local não informado'}</p>
        </div>
        <span className={`badge badge-review`}>{projectStatusLabel[project.status] || project.status}</span>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        <button className={`btn btn-sm ${tab === 'info' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('info')}>
          <Info size={14} /> Info
        </button>
        <button className={`btn btn-sm ${tab === 'budgets' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('budgets')}>
          <Calculator size={14} /> Orçamentos ({budgets.length})
        </button>
        <button className={`btn btn-sm ${tab === 'docs' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('docs')}>
          <Paperclip size={14} /> Documentos ({docs.length})
        </button>
      </div>

      {tab === 'info' && (
        <div className="card">
          <dl className="detail-list">
            <dt>Nome</dt><dd>{project.name}</dd>
            <dt>Cliente</dt><dd>{project.client_name || '—'}</dd>
            <dt>Tipo</dt><dd>{project.type}</dd>
            <dt>Status</dt><dd>{projectStatusLabel[project.status] || project.status}</dd>
            <dt>Área</dt><dd>{project.total_area ? `${Number(project.total_area).toLocaleString('pt-BR')} m²` : '—'}</dd>
            <dt>Endereço</dt><dd>{project.address || '—'}</dd>
            <dt>Cidade/UF</dt><dd>{project.city ? `${project.city}${project.state ? ' / ' + project.state : ''}` : '—'}</dd>
            <dt>Padrão</dt><dd>{project.standard || '—'}</dd>
            <dt>Criado</dt><dd>{new Date(project.created_at).toLocaleString('pt-BR')}</dd>
            <dt>Atualizado</dt><dd>{new Date(project.updated_at).toLocaleString('pt-BR')}</dd>
          </dl>
          {project.description && (
            <>
              <h4 style={{ marginTop: 12, fontSize: 13 }}>Descrição</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6, whiteSpace: 'pre-wrap' }}>{project.description}</p>
            </>
          )}
        </div>
      )}

      {tab === 'budgets' && (
        budgets.length === 0 ? (
          <div className="card empty-state">
            <Calculator size={32} />
            <h3>Nenhum orçamento</h3>
            <p>Ainda não foi criado um orçamento para este projeto.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Orçamento</th>
                  <th>Versão</th>
                  <th>Tipo</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((b) => {
                  const s = budgetStatusLabel[b.status] || { label: b.status, cls: 'badge-review' }
                  return (
                    <tr key={b.id} style={{ cursor: 'pointer' }}>
                      <td>
                        <Link href={`/admin/orcamentos/${b.id}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>
                          {b.name}
                        </Link>
                      </td>
                      <td>v{b.version}</td>
                      <td>{b.type}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-warm)' }}>
                        {b.total_cost ? formatBRL(Number(b.total_cost)) : '—'}
                      </td>
                      <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'docs' && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><h3><Upload size={14} /> Enviar documento</h3></div>
            <form onSubmit={uploadDoc} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Arquivo</label>
                <input type="file" onChange={(e) => setUpFile(e.target.files?.[0] ?? null)} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Tipo</label>
                <select value={upType} onChange={(e) => setUpType(e.target.value as DocumentType)} style={{ width: '100%' }}>
                  {(Object.keys(docTypeLabel) as DocumentType[]).map(t => (
                    <option key={t} value={t}>{docTypeLabel[t]}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Nome (opcional)</label>
                <input type="text" value={upName} onChange={(e) => setUpName(e.target.value)} placeholder="Auto do arquivo" style={{ width: '100%' }} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={!upFile || uploading}>
                <Upload size={14} /> {uploading ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
            {upError && <div className="auth-error" style={{ marginTop: 8 }}>{upError}</div>}
          </div>

          {docs.length === 0 ? (
            <div className="card empty-state">
              <FileText size={32} />
              <h3>Sem documentos</h3>
              <p>Adicione plantas, memoriais ou outros arquivos técnicos.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Nome</th>
                    <th>Tamanho</th>
                    <th>Enviado</th>
                    <th>Origem</th>
                    <th style={{ width: 100 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map(d => (
                    <tr key={`${d.source}-${d.id}`}>
                      <td><span className="chip chip-mixed">{d.type_or_kind}</span></td>
                      <td style={{ fontWeight: 500 }}>{d.name}</td>
                      <td>{fmtBytes(d.size)}</td>
                      <td style={{ fontSize: 12 }}>{new Date(d.created_at).toLocaleString('pt-BR')}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.source === 'documents' ? 'Técnico' : 'Cliente (wizard)'}</td>
                      <td>
                        <button className="btn btn-xs btn-outline" onClick={() => downloadDoc(d)}>
                          <Download size={12} /> Baixar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  )
}
