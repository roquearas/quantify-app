import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import {
  Ruler, Calculator, FileSpreadsheet, Package, TrendingUp, Gavel, FileText,
  ChevronLeft, ChevronRight, CheckCircle2, Send,
} from 'lucide-react'

interface Service {
  id: string
  slug: string
  name: string
  short_description: string
  icon: string
  price_unit: string
  display_order: number
}

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  Ruler, Calculator, FileSpreadsheet, Package, TrendingUp, Gavel, FileText,
}

type Step = 1 | 2 | 3 | 4

export default function Solicitar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselected = searchParams.get('servico')

  const [services, setServices] = useState<Service[]>([])
  const [step, setStep] = useState<Step>(1)
  const [serviceId, setServiceId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [typology, setTypology] = useState('Comercial')
  const [area, setArea] = useState('')
  const [location, setLocation] = useState('')
  const [standard, setStandard] = useState('Médio')
  const [deadline, setDeadline] = useState('')
  const [notes, setNotes] = useState('')
  const [accept, setAccept] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('services').select('*').eq('is_active', true).order('display_order')
      .then(({ data }) => {
        const list = (data as Service[]) || []
        setServices(list)
        if (preselected) {
          const found = list.find((s) => s.slug === preselected)
          if (found) setServiceId(found.id)
        }
      })
  }, [preselected])

  const selectedService = services.find((s) => s.id === serviceId)

  function next() {
    setError(null)
    if (step === 1 && !serviceId) { setError('Selecione um serviço.'); return }
    if (step === 2 && (!title || !area)) { setError('Preencha título e área.'); return }
    if (step < 4) setStep((step + 1) as Step)
  }
  function back() { if (step > 1) setStep((step - 1) as Step) }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!accept) { setError('Aceite o contrato para prosseguir.'); return }
    if (!user) { setError('Sessão expirada.'); return }
    setSubmitting(true)

    const contractText = buildContract({
      client: user.name,
      company: 'Sua empresa',
      service: selectedService?.name || '',
      title,
      typology,
      area,
      location,
      standard,
      deadline,
      priceUnit: selectedService?.price_unit || '',
    })

    const { data: req, error: rErr } = await supabase
      .from('service_requests')
      .insert({
        company_id: user.company_id,
        service_id: serviceId,
        requested_by: user.id,
        title,
        typology,
        area_m2: area ? parseFloat(area) : null,
        location: location || null,
        standard,
        deadline: deadline || null,
        notes: notes || null,
        stage: 'RECEIVED',
      })
      .select()
      .single()

    if (rErr || !req) {
      setSubmitting(false)
      setError(rErr?.message || 'Falha ao criar solicitação')
      return
    }

    await supabase.from('contracts').insert({
      request_id: req.id,
      company_id: user.company_id,
      content: contractText,
      accepted_at: new Date().toISOString(),
      accepted_by: user.id,
    })

    await supabase.from('request_stages').insert({
      request_id: req.id,
      stage: 'RECEIVED',
      note: 'Solicitação criada pelo cliente',
    })

    setSubmitting(false)
    navigate(`/app/solicitacoes/${req.id}`, { replace: true })
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Nova solicitação</h2>
          <p>Wizard guiado — 4 passos. Ao final, geramos um contrato básico para aceite.</p>
        </div>
      </div>

      <div className="wizard-steps">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className={`wizard-step ${step >= n ? 'active' : ''} ${step === n ? 'current' : ''}`}>
            <div className="wizard-step-num">{step > n ? <CheckCircle2 size={14} /> : n}</div>
            <div className="wizard-step-label">
              {n === 1 && 'Serviço'}
              {n === 2 && 'Projeto'}
              {n === 3 && 'Detalhes'}
              {n === 4 && 'Contrato'}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="card wizard-card">
        {step === 1 && (
          <>
            <h3>Escolha o serviço</h3>
            <p className="wizard-hint">Selecione o serviço que deseja contratar.</p>
            <div className="services-picker">
              {services.map((s) => {
                const Icon = iconMap[s.icon] || Calculator
                const selected = serviceId === s.id
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setServiceId(s.id)}
                    className={`service-pick ${selected ? 'selected' : ''}`}
                  >
                    <div className="service-pick-icon"><Icon size={20} /></div>
                    <div>
                      <h4>{s.name}</h4>
                      <p>{s.short_description}</p>
                      <span className="service-price">{s.price_unit}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3>Dados do projeto</h3>
            <div className="wizard-grid">
              <label>
                <span>Título da solicitação</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Orçamento — Edifício Comercial Centro" />
              </label>
              <label>
                <span>Tipologia</span>
                <select value={typology} onChange={(e) => setTypology(e.target.value)}>
                  <option>Residencial</option>
                  <option>Comercial</option>
                  <option>Industrial</option>
                  <option>Institucional</option>
                  <option>Infraestrutura</option>
                </select>
              </label>
              <label>
                <span>Área (m²)</span>
                <input type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="1240" />
              </label>
              <label>
                <span>Localização</span>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="São Paulo / SP" />
              </label>
              <label>
                <span>Padrão construtivo</span>
                <select value={standard} onChange={(e) => setStandard(e.target.value)}>
                  <option>Simples</option>
                  <option>Médio</option>
                  <option>Alto</option>
                </select>
              </label>
              <label>
                <span>Prazo desejado</span>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </label>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3>Observações e escopo adicional</h3>
            <label className="wizard-full">
              <span>Descreva o escopo e envie pranchas posteriormente</span>
              <textarea
                rows={8}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalhe o escopo desejado, disciplinas, bases (SINAPI/SICRO/TCPO), etc."
              />
            </label>
          </>
        )}

        {step === 4 && selectedService && (
          <>
            <h3>Contrato básico</h3>
            <p className="wizard-hint">Revise o contrato gerado e aceite para enviar a solicitação à equipe.</p>
            <pre className="contract-preview">
{buildContract({
  client: user?.name || '',
  company: 'Sua empresa',
  service: selectedService.name,
  title,
  typology,
  area,
  location,
  standard,
  deadline,
  priceUnit: selectedService.price_unit,
})}
            </pre>
            <label className="wizard-check">
              <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
              <span>Li e aceito os termos deste contrato básico.</span>
            </label>
          </>
        )}

        {error && <div className="auth-error">{error}</div>}

        <div className="wizard-actions">
          <button type="button" onClick={back} disabled={step === 1} className="btn btn-outline">
            <ChevronLeft size={14} /> Voltar
          </button>
          {step < 4 ? (
            <button type="button" onClick={next} className="btn btn-primary">
              Avançar <ChevronRight size={14} />
            </button>
          ) : (
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Send size={14} /> {submitting ? 'Enviando...' : 'Enviar solicitação'}
            </button>
          )}
        </div>
      </form>
    </>
  )
}

function buildContract(p: {
  client: string; company: string; service: string; title: string;
  typology: string; area: string; location: string; standard: string;
  deadline: string; priceUnit: string
}) {
  const today = new Date().toLocaleDateString('pt-BR')
  return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ENGENHARIA
Data: ${today}

CONTRATADA: Quantify Engenharia Ltda.
CONTRATANTE: ${p.client} — ${p.company}

OBJETO
Prestação do serviço "${p.service}" referente à solicitação "${p.title}".

DADOS DO PROJETO
• Tipologia: ${p.typology}
• Área: ${p.area || '-'} m²
• Localização: ${p.location || '-'}
• Padrão: ${p.standard}
• Prazo desejado: ${p.deadline || 'a combinar'}

EXECUÇÃO
A Quantify utilizará ferramentas de IA para acelerar levantamentos, composições e cotações.
Todo entregável é revisado e assinado por engenheiro responsável (ART/RRT).

PREÇO
${p.priceUnit}. O valor final será confirmado após análise do escopo detalhado.

PRAZOS E ENTREGÁVEIS
Serão acordados na aceitação da proposta final.

CONFIDENCIALIDADE E LGPD
Dados e pranchas fornecidos são tratados conforme política LGPD da Quantify Engenharia.

ACEITE
Ao clicar em "Enviar solicitação", a CONTRATANTE manifesta aceite eletrônico destes termos básicos,
que serão complementados pela proposta final validada pelo engenheiro responsável.`
}
