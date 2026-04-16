import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, Calculator, FileSpreadsheet,
  Users, Package, Settings, BookOpen, KanbanSquare, ShieldCheck, Terminal, LogOut
} from 'lucide-react'
import { useAuth } from '../lib/auth'

export default function Layout() {
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
          <p>Admin — engenharia inteligente</p>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">Principal</div>
          <NavLink to="/admin" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard /> Dashboard
          </NavLink>
          <NavLink to="/admin/kanban" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <KanbanSquare /> Kanban
          </NavLink>
          <NavLink to="/admin/validacoes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <ShieldCheck /> Validações
          </NavLink>
          <NavLink to="/admin/agent-logs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Terminal /> Agent Logs
          </NavLink>

          <div className="nav-section">Catálogo</div>
          <NavLink to="/admin/projetos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <FolderKanban /> Projetos
          </NavLink>
          <NavLink to="/admin/orcamentos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Calculator /> Orçamentos
          </NavLink>
          <NavLink to="/admin/composicoes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <FileSpreadsheet /> Composições
          </NavLink>

          <div className="nav-section">Gestão</div>
          <NavLink to="/admin/cotacoes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Package /> Cotações
          </NavLink>
          <NavLink to="/admin/parceiros" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Users /> Parceiros
          </NavLink>

          <div className="nav-section">Sistema</div>
          <NavLink to="/admin/documentos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <BookOpen /> Documentos
          </NavLink>
          <NavLink to="/admin/config" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Settings /> Configurações
          </NavLink>
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
        <Outlet />
      </main>
    </div>
  )
}
