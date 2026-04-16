import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, Calculator, FileSpreadsheet,
  Users, Package, Settings, BookOpen
} from 'lucide-react'

export default function Layout() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/logo-main.png" alt="Quantify" />
          <h1>Quantify<span>.</span></h1>
          <p>Engenharia inteligente</p>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">Principal</div>
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard /> Dashboard
          </NavLink>
          <NavLink to="/projetos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <FolderKanban /> Projetos
          </NavLink>
          <NavLink to="/orcamentos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Calculator /> Orçamentos
          </NavLink>
          <NavLink to="/composicoes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <FileSpreadsheet /> Composições
          </NavLink>

          <div className="nav-section">Gestão</div>
          <NavLink to="/cotacoes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Package /> Cotações
          </NavLink>
          <NavLink to="/parceiros" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Users /> Parceiros
          </NavLink>

          <div className="nav-section">Sistema</div>
          <NavLink to="/documentos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <BookOpen /> Documentos
          </NavLink>
          <NavLink to="/config" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Settings /> Configurações
          </NavLink>
        </nav>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>
          Quantify v0.1.0
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
