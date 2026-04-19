'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { FolderKanban, Plus } from 'lucide-react'

const typeLabel: Record<string, string> = {
  RESIDENTIAL: 'Residencial',
  RESIDENTIAL_MULTI: 'Residencial Multi',
  COMMERCIAL: 'Comercial',
  HOSPITAL: 'Hospitalar',
  INDUSTRIAL: 'Industrial',
  EDUCATIONAL: 'Educacional',
  INFRASTRUCTURE: 'Infraestrutura',
  RENOVATION: 'Reforma',
  OTHER: 'Outro',
}

const statusLabel: Record<string, string> = {
  STUDY: 'Estudo',
  PRELIMINARY: 'Preliminar',
  EXECUTIVE: 'Executivo',
  BIDDING: 'Licitação',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  ARCHIVED: 'Arquivado',
}

export default function Projetos() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('projects').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setProjects(data || []); setLoading(false) })
  }, [])

  if (loading) return <div className="loading">Carregando projetos...</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Projetos</h2>
          <p>{projects.length} projeto(s) cadastrados</p>
        </div>
        <button className="btn btn-primary"><Plus size={16} /> Novo projeto</button>
      </div>

      {projects.length === 0 ? (
        <div className="card empty-state">
          <FolderKanban size={48} />
          <h3>Nenhum projeto ainda</h3>
          <p>Crie seu primeiro projeto para começar a orçar.</p>
          <button className="btn btn-primary"><Plus size={16} /> Criar projeto</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipologia</th>
                <th>Cidade / UF</th>
                <th>Área (m²)</th>
                <th>Padrão</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr
                  key={p.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/admin/projetos/${p.id}`)}
                >
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    {p.client_name && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.client_name}</div>}
                  </td>
                  <td><span className="chip chip-mixed">{typeLabel[p.type] || p.type}</span></td>
                  <td>{p.city}{p.state ? ` / ${p.state}` : ''}</td>
                  <td>{p.total_area ? Number(p.total_area).toLocaleString('pt-BR') : '—'}</td>
                  <td>{p.standard || '—'}</td>
                  <td><span className="badge badge-review">{statusLabel[p.status] || p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
