import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  Ruler, Calculator, FileSpreadsheet, Package, TrendingUp, Gavel, FileText,
  ArrowRight, CheckCircle2, BrainCircuit, ShieldCheck, Send,
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

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Ruler, Calculator, FileSpreadsheet, Package, TrendingUp, Gavel, FileText,
}

export default function Landing() {
  const [services, setServices] = useState<Service[]>([])

  useEffect(() => {
    supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data }) => setServices((data as Service[]) || []))
  }, [])

  return (
    <div className="public-shell">
      <header className="public-nav">
        <Link to="/" className="public-nav-logo">
          <img src="/logo-main.png" alt="Quantify" />
          <h1>Quantify<span>.</span></h1>
        </Link>
        <nav className="public-nav-links">
          <a href="#servicos">Serviços</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#contato">Contato</a>
        </nav>
        <div className="public-nav-cta">
          <Link to="/login" className="btn-ghost">Entrar</Link>
          <Link to="/signup" className="btn btn-primary">Começar</Link>
        </div>
      </header>

      <section className="hero">
        <div>
          <div className="hero-badge">
            <BrainCircuit size={14} /> Engenharia + IA auditável
          </div>
          <h2>Orçamentos de obra <span>precisos</span>, acelerados por IA e validados por engenheiros.</h2>
          <p className="hero-sub">
            Levantamento, orçamento paramétrico, composição CPU, cotação eletrônica e BDI —
            tudo sob responsabilidade técnica (ART/RRT) e rastreável.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary btn-lg">
              Solicitar serviço <ArrowRight size={16} />
            </Link>
            <a href="#servicos" className="btn-ghost btn-lg">Ver serviços</a>
          </div>
          <ul className="hero-bullets">
            <li><CheckCircle2 size={14} /> SINAPI, SICRO, TCPO</li>
            <li><CheckCircle2 size={14} /> LGPD compliant</li>
            <li><CheckCircle2 size={14} /> Entrega em dias, não semanas</li>
          </ul>
        </div>
        <div className="hero-mock">
          <h4>Composição CPU — Concreto estrutural fck 30 MPa</h4>
          <div className="hero-mock-rows">
            <div className="hero-mock-row"><span>Material (cimento + agreg.)</span><strong>R$ 412,80/m³</strong></div>
            <div className="hero-mock-row"><span>Mão-de-obra</span><strong>R$ 186,40/m³</strong></div>
            <div className="hero-mock-row"><span>Equipamento</span><strong>R$ 52,10/m³</strong></div>
            <div className="hero-mock-row"><span>BDI aplicado</span><strong>28,5%</strong></div>
            <div className="hero-mock-row" style={{ borderTop: '1px dashed var(--border)', paddingTop: 12 }}>
              <span style={{ fontWeight: 700 }}>Preço unitário final</span>
              <strong>R$ 836,14/m³</strong>
            </div>
          </div>
        </div>
      </section>

      <section id="servicos" className="section">
        <h3 className="section-title">Nossos serviços</h3>
        <p className="section-sub">
          Cada entregável é gerado com apoio de IA e revisado por engenheiro responsável.
          Você contrata por serviço — sem mensalidade.
        </p>
        <div className="services-grid">
          {services.map((s) => {
            const Icon = iconMap[s.icon] || Calculator
            return (
              <div key={s.id} className="service-card">
                <div className="service-card-icon"><Icon size={22} /></div>
                <h4>{s.name}</h4>
                <p>{s.short_description}</p>
                <div className="service-price">{s.price_unit}</div>
                <Link to={`/signup?servico=${s.slug}`} className="service-card-cta">
                  Solicitar <ArrowRight size={14} />
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      <section id="como-funciona" className="section">
        <h3 className="section-title">Como funciona</h3>
        <p className="section-sub">
          Três passos simples. Transparência em cada etapa — você acompanha no seu dashboard.
        </p>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">1</div>
            <h4>Você envia</h4>
            <p>Cadastra-se, descreve o projeto (tipologia, área, localização) e aceita o contrato básico.</p>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <h4>IA acelera</h4>
            <p>Nossos agentes geram composições, cotam insumos e calculam BDI — tudo rastreado.</p>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <h4>Engenheiro valida</h4>
            <p>Engenheiro responsável revisa, ajusta e assina (ART/RRT). Você recebe o entregável final.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="cta-banner">
          <ShieldCheck size={40} style={{ color: '#fff', marginBottom: 12 }} />
          <h3>Pronto para orçar sua obra com precisão?</h3>
          <p>Crie sua conta gratuita e solicite o primeiro serviço em minutos.</p>
          <Link to="/signup" className="btn btn-primary btn-lg">
            <Send size={16} /> Criar conta e solicitar
          </Link>
        </div>
      </section>

      <footer className="public-footer" id="contato">
        <div>© {new Date().getFullYear()} Quantify Engenharia — Engenharia inteligente.</div>
        <div>
          <a href="mailto:contato@quantify.eng.br">contato@quantify.eng.br</a>
          <Link to="/login">Entrar</Link>
          <Link to="/signup">Cadastrar</Link>
        </div>
      </footer>
    </div>
  )
}
