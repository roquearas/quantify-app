import { Routes, Route, Navigate } from 'react-router-dom'

// Public
import Landing from './pages/public/Landing'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'

// Client portal
import ClientLayout from './components/ClientLayout'
import ClientDashboard from './pages/client/ClientDashboard'
import Solicitar from './pages/client/Solicitar'
import MinhasSolicitacoes from './pages/client/MinhasSolicitacoes'
import SolicitacaoDetalhe from './pages/client/SolicitacaoDetalhe'

// Admin
import Layout from './components/Layout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminKanban from './pages/admin/AdminKanban'
import AdminValidacoes from './pages/admin/AdminValidacoes'
import AdminAgentLogs from './pages/admin/AdminAgentLogs'
import Projetos from './pages/Projetos'
import Orcamentos from './pages/Orcamentos'
import Composicoes from './pages/Composicoes'
import Cotacoes from './pages/Cotacoes'
import Parceiros from './pages/Parceiros'
import Documentos from './pages/Documentos'
import Config from './pages/Config'

// Guards
import { RequireAuth, RequireStaff } from './components/RouteGuards'

export default function App() {
  return (
    <Routes>
      {/* Público */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Portal do cliente */}
      <Route
        path="/app"
        element={
          <RequireAuth>
            <ClientLayout />
          </RequireAuth>
        }
      >
        <Route index element={<ClientDashboard />} />
        <Route path="solicitar" element={<Solicitar />} />
        <Route path="solicitacoes" element={<MinhasSolicitacoes />} />
        <Route path="solicitacoes/:id" element={<SolicitacaoDetalhe />} />
      </Route>

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <RequireStaff>
            <Layout />
          </RequireStaff>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="kanban" element={<AdminKanban />} />
        <Route path="validacoes" element={<AdminValidacoes />} />
        <Route path="agent-logs" element={<AdminAgentLogs />} />
        <Route path="solicitacoes/:id" element={<SolicitacaoDetalhe />} />
        <Route path="projetos" element={<Projetos />} />
        <Route path="orcamentos" element={<Orcamentos />} />
        <Route path="composicoes" element={<Composicoes />} />
        <Route path="cotacoes" element={<Cotacoes />} />
        <Route path="parceiros" element={<Parceiros />} />
        <Route path="documentos" element={<Documentos />} />
        <Route path="config" element={<Config />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
