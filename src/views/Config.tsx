import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Building2, Users, Mail, IdCard } from 'lucide-react'

interface Company {
  id: string
  name: string
  cnpj: string | null
  state: string | null
  price_base: string | null
  logo: string | null
  stripe_customer_id: string | null
  created_at: string
}

interface User {
  id: string
  email: string
  name: string | null
  role: string | null
  crea: string | null
  cau: string | null
  company_id: string | null
  created_at: string
}

const roleLabel: Record<string, string> = {
  ADMIN: 'Administrador',
  ENGINEER: 'Engenheiro',
  ARCHITECT: 'Arquiteto',
  ASSISTANT: 'Assistente',
  VIEWER: 'Visualizador',
}

export default function Config() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [companiesRes, usersRes] = await Promise.all([
        supabase.from('companies').select('*').order('created_at', { ascending: true }),
        supabase.from('users').select('*').order('created_at', { ascending: true }),
      ])
      setCompanies(companiesRes.data || [])
      setUsers(usersRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="loading">Carregando configurações...</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Configurações</h2>
          <p>Empresa, usuários e preferências</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 12px' }}>
        <Building2 size={18} />
        <h3 style={{ fontSize: 15, fontWeight: 600 }}>Empresa</h3>
      </div>

      {companies.length === 0 ? (
        <div className="card empty-state">
          <Building2 size={48} />
          <h3>Nenhuma empresa</h3>
          <p>Cadastre os dados da sua empresa para emitir orçamentos.</p>
        </div>
      ) : (
        <div className="grid grid-2" style={{ marginBottom: 28 }}>
          {companies.map((c) => (
            <div key={c.id} className="card">
              <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{c.name}</h4>
              <div style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                {c.cnpj && <div><strong style={{ color: 'var(--text)' }}>CNPJ:</strong> {c.cnpj}</div>}
                {c.state && <div><strong style={{ color: 'var(--text)' }}>UF:</strong> {c.state}</div>}
                {c.price_base && (
                  <div>
                    <strong style={{ color: 'var(--text)' }}>Base de preços: </strong>
                    <span className={`chip chip-${c.price_base.toLowerCase()}`}>{c.price_base}</span>
                  </div>
                )}
                {c.stripe_customer_id && (
                  <div><strong style={{ color: 'var(--text)' }}>Stripe:</strong> {c.stripe_customer_id}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 12px' }}>
        <Users size={18} />
        <h3 style={{ fontSize: 15, fontWeight: 600 }}>Usuários ({users.length})</h3>
      </div>

      {users.length === 0 ? (
        <div className="card empty-state">
          <Users size={48} />
          <h3>Nenhum usuário</h3>
          <p>Convide engenheiros e assistentes para colaborar nos orçamentos.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Cargo</th>
                <th>CREA</th>
                <th>CAU</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name || '—'}</td>
                  <td>
                    <a href={`mailto:${u.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Mail size={12} /> {u.email}
                    </a>
                  </td>
                  <td>
                    {u.role && <span className="badge badge-review">{roleLabel[u.role] || u.role}</span>}
                  </td>
                  <td>{u.crea ? <><IdCard size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{u.crea}</> : '—'}</td>
                  <td>{u.cau ? <><IdCard size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{u.cau}</> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
