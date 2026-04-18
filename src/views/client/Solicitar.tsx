'use client'
import { useRouter, useSearchParams } from 'next/navigation'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import {
  Ruler, Calculator, FileSpreadsheet, Package, TrendingUp, Gavel, FileText,
  ChevronLeft, ChevronRight, CheckCircle2, Send, Sparkles, Clock,
  Upload, X as XIcon, File as FileIcon,
} from 'lucide-react'
import {
  estimatePrice, inferPorte, inferTipologia,
  type ServicePricing, type Urgencia,
} from '../../lib/pricingEngine'

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselected = searchParams?.get('servico')

  const [services, setServices] = useState<Service[]>([])
  const [pricings, setPricings] = useState<Record<string, ServicePricing>>({})
  const [step, setStep] = useState<Step>(1)
  const [serviceId, setServiceId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [typology, setTypology] = useState('Comercial')
  const [area, setArea] = useState('')
  const [location, setLocation] = useState('')
  const [standard, setStandard] = useState('Médio')
  const [deadline, setDeadline] = useState('')
  const [urgencia, setUrgencia] = useState<Urgencia>('normal')
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<File[]>([])
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

    supabase.from('service_pricing').select('*')
      .then(({ data }) => {
        const map: Record<string, ServicePricing> = {}
        for (const row of (data ?? []) as ServicePricing[]) map[row.service_id] = row
        setPricings(map)
      })
  }, [preselected])

  const selectedService = services.find((s) => s.id === serviceId)
  const selectedPricing = serviceId ? pricings[serviceId] : undefined

  const estimate = useMemo(() => {
    if (!selectedPricing) return null
    const areaNum = area ? parseFloat(area) : 0
    const porte = inferPorte(areaNum)
    const tipologia = inferTipologia(typology)
    // Quantidade: se a unidade é m², usa a área; senão usa 1 (unidade lote/projeto/proposta)
    const unit = selectedPricing.unit.toLowerCase()
    const quantity = unit.includes('m') && areaNum > 0 ? areaNum : 1
    return estimatePrice({ pricing: selectedPricing, quantity, porte, urgencia, tipologia })
  }, [selectedPricing, area, typology, urgencia])

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
      estimate: estimate?.formatted.range || null,
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

    // Upload de arquivos (pranchas/memoriais) — path: {company_id}/{request_id}/INPUT/{file}
    if (files.length > 0) {
      for (const file of files) {
        const safeName = file.name.replace(/[^\w.-]/g, '_')
        const path = `${user.company_id}/${req.id}/INPUT/${Date.now()}-${safeName}`
        const { error: upErr } = await supabase.storage
          .from('request-files')
          .upload(path, file, { cacheControl: '3600', upsert: false })
        if (upErr) {
          // falha de um arquivo não deve bloquear a solicitação inteira
          // eslint-disable-next-line no-console
          console.warn('upload falhou:', file.name, upErr.message)
          continue
        }
        await supabase.from('request_files').insert({
          request_id: req.id,
          company_id: user.company_id,
          uploaded_by: user.id,
          kind: 'INPUT',
          storage_path: path,
          filename: file.name,
          mime_type: file.type || 'application/octet-stream',
          size_bytes: file.size,
        })
      }
    }

    // Cria uma proposta DRAFT pré-preenchida com a estimativa, para o engenheiro ajustar depois
    if (estimate) {
      await supabase.from('proposals').insert({
        request_id: req.id,
        company_id: user.company_id,
        estimated_price: estimate.central,
        final_price: null,
        breakdown: {
          porte: inferPorte(area ? parseFloat(area) : 0),
          tipologia: inferTipologia(typology),
          urgencia,
          unit: estimate.unit,
          ...estimate.breakdown,
        },
        scope: notes || null,
        status: 'DRAFT',
      })
    }

    setSubmitting(false)
    router.replace(`/app/solicitacoes/${req.id}`)
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
                const fromPrice = pricings[s.id]?.from_price_display
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
                      <span className="service-price">{fromPrice || s.price_unit}</span>
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
            <div className="wizard-grid">
              <label>
                <span>
                  <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Urgência
                </span>
                <select value={urgencia} onChange={(e) => setUrgencia(e.target.value as Urgencia)}>
                  <option value="normal">Normal (prazo padrão)</option>
                  <option value="urgente">Urgente (+35%)</option>
                  <option value="express">Express (+75%)</option>
                </select>
              </label>
            </div>
            <label className="wizard-full">
              <span>Descreva o escopo</span>
              <textarea
                rows={6}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalhe o escopo desejado, disciplinas, bases (SINAPI/SICRO/TCPO), etc."
              />
            </label>

            <div className="wizard-full file-upload-block">
              <span className="file-upload-label">
                <Upload size={12} style={{ display: 'inline', marginRight: 4 }} />
                Anexar pranchas e memoriais (opcional)
              </span>
              <label className="file-drop">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.xls,.xlsx,.dwg,.zip,.csv,.txt"
                  onChange={(e) => {
                    const selected = Array.from(e.target.files ?? [])
                    setFiles((prev) => [...prev, ...selected])
                    e.target.value = ''
                  }}
                />
                <div className="file-drop-inner">
                  <Upload size={16} />
                  <span>Clique para anexar arquivos</span>
                  <small>PDF, PNG, JPG, XLS, DWG, ZIP — até 100 MB cada</small>
                </div>
              </label>
              {files.length > 0 && (
                <ul className="file-list">
                  {files.map((f, i) => (
                    <li key={i}>
                      <FileIcon size={12} />
                      <span className="file-name">{f.name}</span>
                      <span className="file-size">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                      <button
                        type="button"
                        className="file-remove"
                        onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        aria-label="Remover"
                      >
                        <XIcon size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {estimate && selectedService && (
              <div className="estimate-card">
                <div className="estimate-header">
                  <Sparkles size={16} />
                  <strong>Estimativa preliminar</strong>
                </div>
                <div className="estimate-range">{estimate.formatted.range}</div>
                <div className="estimate-detail">
                  <span>Central indicativa:</span>
                  <strong>{estimate.formatted.central}</strong>
                </div>
                <ul className="estimate-breakdown">
                  <li>
                    <span>Serviço</span>
                    <strong>{selectedService.name}</strong>
                  </li>
                  <li>
                    <span>Quantidade</span>
                    <strong>{estimate.quantity.toLocaleString('pt-BR')} {estimate.unit}</strong>
                  </li>
                  <li>
                    <span>Porte</span>
                    <strong>{labelPorte(area)}</strong>
                  </li>
                  <li>
                    <span>Tipologia</span>
                    <strong>{typology}</strong>
                  </li>
                  <li>
                    <span>Urgência</span>
                    <strong>{urgenciaLabel(urgencia)}</strong>
                  </li>
                </ul>
                <p className="estimate-note">
                  Valor preliminar calculado com base em SINAPI/SICRO/TCPO + mercado 2026.
                  O <strong>valor final será confirmado pelo engenheiro responsável</strong> após análise do escopo.
                  Só cobramos após sua aprovação.
                </p>
              </div>
            )}
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
  estimate: estimate?.formatted.range || null,
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

function urgenciaLabel(u: Urgencia): string {
  if (u === 'urgente') return 'Urgente'
  if (u === 'express') return 'Express'
  return 'Normal'
}

function labelPorte(area: string): string {
  const a = parseFloat(area)
  if (!a || Number.isNaN(a)) return 'Médio'
  if (a < 150) return 'Pequeno'
  if (a > 1500) return 'Grande'
  return 'Médio'
}

function buildContract(p: {
  client: string; company: string; service: string; title: string;
  typology: string; area: string; location: string; standard: string;
  deadline: string; priceUnit: string; estimate: string | null
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
${p.priceUnit}.${p.estimate ? ` Estimativa preliminar: ${p.estimate}.` : ''}
O valor final será confirmado pelo engenheiro responsável após análise do escopo detalhado.
A cobrança só ocorre após o aceite do valor final pela CONTRATANTE, ao final do serviço.

FORMA DE PAGAMENTO
100% na entrega do serviço, mediante boleto/PIX/cartão (com opção de parcelamento).
Cartão de crédito é capturado apenas após aceite do valor final; cobrança ocorre na entrega.

PRAZOS E ENTREGÁVEIS
Serão acordados na aceitação da proposta final.

CONFIDENCIALIDADE E LGPD
Dados e pranchas fornecidos são tratados conforme política LGPD da Quantify Engenharia.

ACEITE
Ao clicar em "Enviar solicitação", a CONTRATANTE manifesta aceite eletrônico destes termos básicos,
que serão complementados pela proposta final validada pelo engenheiro responsável.`
}
