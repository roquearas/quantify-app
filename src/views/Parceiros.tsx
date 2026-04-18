import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Building2, Star, Globe, Lock, Mail, Phone } from 'lucide-react'

interface Partner {
  id: string
  name: string
  cnpj: string | null
  email: string | null
  phone: string | null
  specialties: string[] | null
  is_global: boolean
  rating: number | null
  created_at: string
}

export default function Parceiros() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('partners')
        .select('*')
        .order('rating', { ascending: false })
      setPartners(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="loading">Carregando...</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Parceiros / Fornecedores</h2>
          <p>{partners.length} parceiros cadastrados</p>
        </div>
        <button className="btn btn-primary">
          <Building2 size={16} /> Novo parceiro
        </button>
      </div>

      {partners.length === 0 ? (
        <div className="card empty-state">
          <Building2 size={48} />
          <h3>Nenhum parceiro</h3>
          <p>Cadastre fornecedores e parceiros para receber cotações de materiais e serviços.</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {partners.map((p) => (
            <div key={p.id} className="card partner-card">
              <div className="partner-header">
                <div className="partner-name">
                  <h4>{p.name}</h4>
                  <span className={`partner-scope ${p.is_global ? 'scope-global' : 'scope-private'}`}>
                    {p.is_global ? <><Globe size={12} /> Global</> : <><Lock size={12} /> Privado</>}
                  </span>
                </div>
                {p.rating && (
                  <div className="partner-rating">
                    <Star size={14} fill="var(--accent-warm)" stroke="var(--accent-warm)" />
                    <span>{Number(p.rating).toFixed(1)}</span>
                  </div>
                )}
              </div>

              {p.cnpj && (
                <div className="partner-cnpj">{p.cnpj}</div>
              )}

              <div className="partner-specialties">
                {(p.specialties || []).map((s, i) => (
                  <span key={i} className="chip chip-mixed">{s}</span>
                ))}
              </div>

              <div className="partner-contact">
                {p.email && (
                  <a href={`mailto:${p.email}`} className="partner-contact-item">
                    <Mail size={13} /> {p.email}
                  </a>
                )}
                {p.phone && (
                  <span className="partner-contact-item">
                    <Phone size={13} /> {p.phone}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
