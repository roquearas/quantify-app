import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, ListChecks, LogOut } from 'lucide-react'
import { useAuth } from '../lib/auth'

export default function ClientLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Link to="/">
            <img src="/logo-main.png" alt="Quantify" />
          </Link>
          <h1>Quantify<span>.</span></h1>
          <p>Portal do cliente</p>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">Meu painel</div>
          <NavLink to="/app" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard /> Dashboard
          </NavLink>
          <NavLink to="/app/solicitar" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <PlusCircle /> Solicitar serviço
          </NavLink>
          <NavLink to="/app/solicitacoes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <ListChecks /> Minhas solicitações
          </NavLink>
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
        <Outlet />
      </main>
    </div>
  )
}
