'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, PlusCircle, ListChecks, LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '../lib/auth'
import type { ReactNode } from 'react'

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const pathname = usePathname() ?? ""
  const isActive = href === '/app' ? pathname === '/app' : pathname.startsWith(href)
  return (
    <Link href={href} className={`nav-link ${isActive ? 'active' : ''}`}>
      {icon} {label}
    </Link>
  )
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { user, signOut, isStaff } = useAuth()
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
          <p>Portal do cliente</p>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">Meu painel</div>
          <NavItem href="/app" icon={<LayoutDashboard />} label="Dashboard" />
          <NavItem href="/app/solicitar" icon={<PlusCircle />} label="Solicitar serviço" />
          <NavItem href="/app/solicitacoes" icon={<ListChecks />} label="Minhas solicitações" />
          {isStaff && (
            <>
              <div className="nav-section">Staff</div>
              <Link href="/admin" className="nav-link nav-link-admin">
                <ShieldCheck /> Painel admin
              </Link>
            </>
          )}
        </nav>
        <div className="sidebar-user">
          {user && (
            <>
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-email">{user.email}</div>
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
