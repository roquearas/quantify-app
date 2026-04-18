'use client'
import Link from 'next/link'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Ruler, Calculator, FileSpreadsheet, Package, TrendingUp, Gavel, FileText,
  ArrowRight, CheckCircle2, BrainCircuit, ShieldCheck, Send, Zap, Building2, Scale,
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

interface ServicePricingRow {
  service_id: string
  from_price_display: string | null
}

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Ruler, Calculator, FileSpreadsheet, Package, TrendingUp, Gavel, FileText,
}

/* ============================
   ANIMATED LOGO COMPONENT
   ============================ */
function AnimatedLogo({ size = 240, className = '' }: { size?: number; className?: string }) {
  const [replay, setReplay] = useState(0)

  // Cube data: each cube is [topFace, leftFace, rightFace] polygons
  const cubes = [
    // Row 1 (top): 1 cube
    { top: '150,40 180,56 150,72 120,56', left: '120,56 150,72 150,100 120,84', right: '150,72 180,56 180,84 150,100', colors: ['#3a6e64','#2d5a7b','#1e3a52'] },
    // Row 2: 2 cubes + center dark
    { top: '120,72 150,88 120,104 90,88', left: '90,88 120,104 120,132 90,116', right: '120,104 150,88 150,116 120,132', colors: ['#5a8a7d','#2d5a7b','#1e3a52'] },
    { top: '180,72 210,88 180,104 150,88', left: '150,88 180,104 180,132 150,116', right: '180,104 210,88 210,116 180,132', colors: ['#3a6e64','#2d5a7b','#1e3a52'] },
    { top: '150,88 180,104 150,120 120,104', left: '120,104 150,120 150,148 120,132', right: '150,120 180,104 180,132 150,148', colors: ['#2a2a3e','#1a1a2e','#111125'] },
    // Row 3: 3 cubes
    { top: '90,104 120,120 90,136 60,120', left: '60,120 90,136 90,164 60,148', right: '90,136 120,120 120,148 90,164', colors: ['#2d5a7b','#1e3a52','#243e5a'] },
    { top: '150,120 180,136 150,152 120,136', left: '120,136 150,152 150,180 120,164', right: '150,152 180,136 180,164 150,180', colors: ['#5a8a7d','#3a6e64','#2a5e54'] },
    { top: '210,104 240,120 210,136 180,120', left: '180,120 210,136 210,164 180,148', right: '210,136 240,120 240,148 210,164', colors: ['#2d5a7b','#1e3a52','#243e5a'] },
    // Row 4 (bottom): 4 cubes
    { top: '60,136 90,152 60,168 30,152', left: '30,152 60,168 60,196 30,180', right: '60,168 90,152 90,180 60,196', colors: ['#5a8a7d','#3a6e64','#2a5e54'] },
    { top: '120,152 150,168 120,184 90,168', left: '90,168 120,184 120,212 90,196', right: '120,184 150,168 150,196 120,212', colors: ['#2d5a7b','#1e3a52','#243e5a'] },
    { top: '180,152 210,168 180,184 150,168', left: '150,168 180,184 180,212 150,196', right: '180,184 210,168 210,196 180,212', colors: ['#3a6e64','#2d5a7b','#1e3a52'] },
    { top: '240,136 270,152 240,168 210,152', left: '210,152 240,168 240,196 210,180', right: '240,168 270,152 270,180 240,196', colors: ['#5a8a7d','#2d5a7b','#1e3a52'] },
  ]

  const offsets = [
    [-40,-80],[60,-40],[-60,-40],[0,-60],
    [-80,0],[20,-60],[80,0],
    [-60,40],[-20,-20],[40,40],[80,20],
  ]

  return (
    <div className={`animated-logo ${className}`} onClick={() => setReplay(r => r + 1)} style={{ width: size, cursor: 'pointer' }}>
      <svg key={replay} viewBox="0 0 300 290" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%' }}>
        <defs>
          <filter id="logo-glow">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <ellipse className="logo-glow-bg" cx="150" cy="130" rx="110" ry="70" fill="#3a6e64" opacity="0"/>
        {cubes.map((cube, i) => (
          <g key={i} className="logo-cube" style={{
            '--delay': `${0.15 + i * 0.12}s`,
            '--sx': `${offsets[i][0]}px`,
            '--sy': `${offsets[i][1]}px`,
          } as React.CSSProperties}>
            <polygon points={cube.top} fill={cube.colors[0]} stroke={cube.colors[0]} strokeWidth="0.5"/>
            <polygon points={cube.left} fill={cube.colors[1]} stroke={cube.colors[1]} strokeWidth="0.5"/>
            <polygon points={cube.right} fill={cube.colors[2]} stroke={cube.colors[2]} strokeWidth="0.5"/>
          </g>
        ))}
        <g className="logo-text-anim">
          <text x="150" y="240" textAnchor="middle" fontFamily="Inter, -apple-system, sans-serif" fontSize="36" fontWeight="900" fill="#F8FAFC" letterSpacing="5">QUANTIFY</text>
          <text x="150" y="262" textAnchor="middle" fontFamily="Inter, -apple-system, sans-serif" fontSize="11.5" fontWeight="400" fill="#94A3B8" letterSpacing="4.5">SERVIÇOS DE ENGENHARIA</text>
        </g>
      </svg>
    </div>
  )
}

/* ============================
   PARTICLES BACKGROUND
   ============================ */
function ParticlesBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = canvas.width = canvas.offsetWidth
    let h = canvas.height = canvas.offsetHeight
    let animId: number

    const particles: { x:number; y:number; vx:number; vy:number; r:number; a:number }[] = []
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random()*w, y: Math.random()*h,
        vx: (Math.random()-0.5)*0.3, vy: (Math.random()-0.5)*0.3,
        r: Math.random()*1.5+0.5, a: Math.random()*0.25+0.05,
      })
    }

    function animate() {
      ctx!.clearRect(0,0,w,h)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x<0||p.x>w||p.y<0||p.y>h) { p.x=Math.random()*w; p.y=Math.random()*h }
        ctx!.beginPath()
        ctx!.arc(p.x,p.y,p.r,0,Math.PI*2)
        ctx!.fillStyle = `rgba(61,214,192,${p.a})`
        ctx!.fill()
      })
      for (let i=0;i<particles.length;i++) {
        for (let j=i+1;j<particles.length;j++) {
          const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y
          const dist=Math.sqrt(dx*dx+dy*dy)
          if (dist<140) {
            ctx!.beginPath()
            ctx!.moveTo(particles[i].x,particles[i].y)
            ctx!.lineTo(particles[j].x,particles[j].y)
            ctx!.strokeStyle=`rgba(61,214,192,${0.05*(1-dist/140)})`
            ctx!.stroke()
          }
        }
      }
      animId = requestAnimationFrame(animate)
    }
    animate()

    const onResize = () => { w=canvas.width=canvas.offsetWidth; h=canvas.height=canvas.offsetHeight }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize) }
  }, [])

  return <canvas ref={canvasRef} className="particles-canvas" />
}

/* ============================
   LANDING PAGE
   ============================ */
export default function Landing() {
  const [services, setServices] = useState<Service[]>([])
  const [pricingBySlug, setPricingBySlug] = useState<Record<string, string>>({})
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    // Scroll reveal
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed') })
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    document.querySelectorAll('.reveal-on-scroll').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [services])

  useEffect(() => {
    supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data }) => {
        const list = (data as Service[]) || []
        setServices(list)
        supabase.from('service_pricing').select('service_id, from_price_display')
          .then(({ data: pr }) => {
            const rows = (pr as ServicePricingRow[]) || []
            const map: Record<string, string> = {}
            for (const row of rows) {
              const svc = list.find((s) => s.id === row.service_id)
              if (svc && row.from_price_display) map[svc.slug] = row.from_price_display
            }
            setPricingBySlug(map)
          })
      })
  }, [])

  return (
    <div className="public-shell">
      <ParticlesBg />

      <header className={`public-nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <Link href="/" className="public-nav-logo">
          <img src="/logo-quantify.jpg" alt="Quantify" />
          <div>
            <h1>Quantify<span>.</span></h1>
            <span className="nav-tagline">Serviços de Engenharia</span>
          </div>
        </Link>
        <nav className="public-nav-links">
          <a href="#servicos">Serviços</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#diferenciais">Diferenciais</a>
          <a href="#contato">Contato</a>
        </nav>
        <div className="public-nav-cta">
          <Link href="/login" className="btn-ghost">Entrar</Link>
          <Link href="/signup" className="btn btn-primary">Começar</Link>
        </div>
      </header>

      <section className="hero hero-enhanced">
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
            <Link href="/signup" className="btn btn-primary btn-lg">
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
        <div className="hero-logo-side">
          <AnimatedLogo size={320} />
        </div>
      </section>

      {/* Stats bar */}
      <div className="stats-bar">
        <div className="stat-item"><div className="stat-num">280+</div><div className="stat-label">Perguntas mapeadas</div></div>
        <div className="stat-item"><div className="stat-num">6</div><div className="stat-label">Estágios do ciclo</div></div>
        <div className="stat-item"><div className="stat-num">25</div><div className="stat-label">Agentes IA</div></div>
        <div className="stat-item"><div className="stat-num">6+</div><div className="stat-label">Tipologias cobertas</div></div>
      </div>

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
              <div key={s.id} className="service-card reveal-on-scroll">
                <div className="service-card-icon"><Icon size={22} /></div>
                <h4>{s.name}</h4>
                <p>{s.short_description}</p>
                <div className="service-price">
                  {pricingBySlug[s.slug] || s.price_unit}
                </div>
                <Link href={`/signup?servico=${s.slug}`} className="service-card-cta">
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
          <div className="step-card reveal-on-scroll">
            <div className="step-num">1</div>
            <h4>Você envia</h4>
            <p>Cadastra-se, descreve o projeto (tipologia, área, localização) e aceita o contrato básico.</p>
          </div>
          <div className="step-card reveal-on-scroll">
            <div className="step-num">2</div>
            <h4>IA acelera</h4>
            <p>Nossos agentes geram composiç\u00F5es, cotam insumos e calculam BDI — tudo rastreado.</p>
          </div>
          <div className="step-card reveal-on-scroll">
            <div className="step-num">3</div>
            <h4>Engenheiro valida</h4>
            <p>Engenheiro responsável revisa, ajusta e assina (ART/RRT). Você recebe o entregável final.</p>
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section id="diferenciais" className="section">
        <h3 className="section-title">Por que a Quantify?</h3>
        <p className="section-sub">
          Combinamos inteligência artificial com engenharia séria — sem atalhos, com responsabilidade técnica.
        </p>
        <div className="diff-grid">
          <div className="diff-card reveal-on-scroll">
            <Zap size={28} className="diff-icon" />
            <h4>25 Agentes IA especializados</h4>
            <p>Do SoilReader ao CurvaABC, cada agente segue o fluxo Draft → Review → Validated. Co-autoria humano-IA.</p>
          </div>
          <div className="diff-card reveal-on-scroll">
            <Building2 size={28} className="diff-icon" />
            <h4>BIM Nativo + SINAPI/SICRO</h4>
            <p>Parser IFC, bases de preços integradas e regionalizadas. Quantitativos extraídos direto do modelo 3D.</p>
          </div>
          <div className="diff-card reveal-on-scroll">
            <Scale size={28} className="diff-icon" />
            <h4>Conformidade e Rastreabilidade</h4>
            <p>Lei 14.133, RDC 50, NBR 15575. Rastreabilidade ICP-Brasil para assinatura de ART. Pronto para obra pública.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="cta-banner">
          <ShieldCheck size={40} style={{ color: '#fff', marginBottom: 12 }} />
          <h3>Pronto para orçar sua obra com precisão?</h3>
          <p>Crie sua conta gratuita e solicite o primeiro serviço em minutos.</p>
          <Link href="/signup" className="btn btn-primary btn-lg">
            <Send size={16} /> Criar conta e solicitar
          </Link>
        </div>
      </section>

      <footer className="public-footer" id="contato">
        <div className="footer-brand">
          <img src="/logo-quantify.jpg" alt="Quantify" className="footer-logo" />
          <span>Quantify Engenharia</span>
        </div>
        <div>
          <a href="mailto:contato@quantify.eng.br">contato@quantify.eng.br</a>
          <Link href="/login">Entrar</Link>
          <Link href="/signup">Cadastrar</Link>
        </div>
        <div className="footer-copy">© {new Date().getFullYear()} Quantify Serviços de Engenharia — Engenharia inteligente.</div>
      </footer>
    </div>
  )
}