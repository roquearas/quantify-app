import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { FileText, FileSpreadsheet, Image, Box, File, Upload } from 'lucide-react'

interface Document {
  id: string
  name: string
  type: string
  file_url: string
  file_size: number | null
  mime_type: string | null
  project_id: string
  processed_at: string | null
  ai_result: any
  created_at: string
  projects: { name: string } | null
}

const typeLabel: Record<string, string> = {
  FLOOR_PLAN: 'Planta',
  MEMORIAL: 'Memorial',
  SPREADSHEET: 'Planilha',
  BIM_MODEL: 'Modelo BIM',
  TECHNICAL: 'Técnico',
  OTHER: 'Outro',
}

const typeIcons: Record<string, React.ReactNode> = {
  FLOOR_PLAN: <Image size={18} />,
  MEMORIAL: <FileText size={18} />,
  SPREADSHEET: <FileSpreadsheet size={18} />,
  BIM_MODEL: <Box size={18} />,
  TECHNICAL: <File size={18} />,
  OTHER: <File size={18} />,
}

function formatSize(bytes: number | null) {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

export default function Documentos() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('documents')
        .select('*, projects(name)')
        .order('created_at', { ascending: false })
      setDocuments((data as Document[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="loading">Carregando...</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Documentos</h2>
          <p>{documents.length} documentos armazenados</p>
        </div>
        <button className="btn btn-primary">
          <Upload size={16} /> Upload
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="card empty-state">
          <FileText size={48} />
          <h3>Nenhum documento</h3>
          <p>Faça upload de plantas, memoriais e planilhas para seus projetos.</p>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Tipo</th>
                <th>Projeto</th>
                <th>Tamanho</th>
                <th>Processado IA</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="doc-icon">{typeIcons[d.type] || <File size={18} />}</span>
                      <span style={{ fontWeight: 600 }}>{d.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="chip chip-mixed">{typeLabel[d.type] || d.type}</span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {d.projects?.name || '—'}
                  </td>
                  <td style={{ fontSize: 13 }}>{formatSize(d.file_size)}</td>
                  <td style={{ textAlign: 'center' }}>
                    {d.processed_at ? (
                      <span className="badge badge-validated" style={{ fontSize: 10 }}>Sim</span>
                    ) : (
                      <span className="badge badge-draft" style={{ fontSize: 10 }}>Pendente</span>
                    )}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formatDate(d.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
