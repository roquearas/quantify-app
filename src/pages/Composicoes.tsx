import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Layers, Plus, Search } from 'lucide-react'

interface Composition {
  id: string
  code: string
  description: string
  unit: string
  source: string
  unit_cost: number
  labor_cost: number | null
  material_cost: number | null
  equipment_cost: number | null
  state: string | null
  reference_date: string | null
  created_at: string
}

const sourceClass: Record<string, string> = {
  SINAPI: 'chip-sinapi',
  SICRO: 'chip-sicro',
  TCPO: 'chip-tcpo',
  OWN: 'chip-own',
  MIXED: 'chip-mixed',
}

function formatBRL(v: number | null) {
  if (v == null) return '—'
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Composicoes() {
  const [compositions, setCompositions] = useState<Composition[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('compositions')
        .select('*')
        .order('code', { ascending: true })
      setCompositions(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = compositions.filter((c) =>
    c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="loading">Carregando...</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Composições (CPU)</h2>
          <p>{compositions.length} composições de preço unitário</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> Nova composição
        </button>
      </div>

      {compositions.length === 0 ? (
        <div className="card empty-state">
          <Layers size={48} />
          <h3>Nenhuma composição cadastrada</h3>
          <p>
            Composições de Preço Unitário (CPU) detalham os insumos necessários
            para cada serviço: mão de obra, materiais e equipamentos com seus
            respectivos coeficientes e custos.
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Importe da SINAPI, SICRO ou TCPO, ou crie composições próprias.
          </p>
          <button className="btn btn-primary" style={{ marginTop: 12 }}>
            <Plus size={16} /> Criar primeira composição
          </button>
        </div>
      ) : (
        <>
          <div className="search-bar" style={{ marginBottom: 16 }}>
            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar por código ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descrição</th>
                  <th>Unid.</th>
                  <th>Base</th>
                  <th>Mão de obra</th>
                  <th>Material</th>
                  <th>Equip.</th>
                  <th>Custo unit.</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.code}</td>
                    <td>{c.description}</td>
                    <td>{c.unit}</td>
                    <td><span className={`chip ${sourceClass[c.source] || 'chip-own'}`}>{c.source}</span></td>
                    <td style={{ fontSize: 13 }}>{formatBRL(c.labor_cost)}</td>
                    <td style={{ fontSize: 13 }}>{formatBRL(c.material_cost)}</td>
                    <td style={{ fontSize: 13 }}>{formatBRL(c.equipment_cost)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatBRL(c.unit_cost)}</td>
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
