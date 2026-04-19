'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, FolderKanban, Calculator, FileSpreadsheet,
  Users, Package, Settings, BookOpen, KanbanSquare, ShieldCheck, Terminal, LogOut,
  FileSignature, CreditCard, Database,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import type { ReactNode } from 'react'

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const pathname = usePathname() ?? ""
  const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
  return (
    <Link href={href} className={`nav-link ${isActive ? 'active' : ''}`}>
      {icon} {label}
    </Link>
  )
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()
  const router = useRouter()

  async function handleLogout() {
    await signOut()
    router.replace('/')
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Link href="/">
            <img src="/logo-main.png" alt="Quantify" />
          </Link>
          <h1>Quantify<span>.</span></h1>
          <p>Admin — engenharia inteligente</p>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">Principal</div>
          <NavItem href="/admin" icon={<LayoutDashboard />} label="Dashboard" />
          <NavItem href="/admin/kanban" icon={<KanbanSquare />} label="Kanban" />
          <NavItem href="/admin/propostas" icon={<FileSignature />} label="Propostas" />
          <NavItem href="/admin/cobrancas" icon={<CreditCard />} label="Cobranças" />
          <NavItem href="/admin/validacoes" icon={<ShieldCheck />} label="Validações" />
          <NavItem href="/admin/agent-logs" icon={<Terminal />} label="Agent Logs" />

          <div className="nav-section">Catálogo</div>
          <NavItem href="/admin/projetos" icon={<FolderKanban />} label="Projetos" />
          <NavItem href="/admin/orcamentos" icon={<Calculator />} label="Orçamentos" />
          <NavItem href="/admin/composicoes" icon={<FileSpreadsheet />} label="Composições" />
          <NavItem href="/admin/sinapi/import" icon={<Database />} label="SINAPI" />

          <div className="nav-section">Gestão</div>
          <NavItem href="/admin/cotacoes" icon={<Package />} label="Cotações" />
          <NavItem href="/admin/parceiros" icon={<Users />} label="Parceiros" />

          <div className="nav-section">Sistema</div>
          <NavItem href="/admin/documentos" icon={<BookOpen />} label="Documentos" />
          <NavItem href="/admin/config" icon={<Settings />} label="Configurações" />
        </nav>
        <div className="sidebar-user">
          {user && (
            <>
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-email">{user.role}</div>
            </>
          )}
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>
            <LogOut size={14} /> Sair
          </button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
