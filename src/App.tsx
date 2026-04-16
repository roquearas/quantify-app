import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Projetos from './pages/Projetos'
import Orcamentos from './pages/Orcamentos'
import Composicoes from './pages/Composicoes'
import Cotacoes from './pages/Cotacoes'
import Parceiros from './pages/Parceiros'
import Documentos from './pages/Documentos'
import Config from './pages/Config'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projetos" element={<Projetos />} />
        <Route path="/orcamentos" element={<Orcamentos />} />
        <Route path="/composicoes" element={<Composicoes />} />
        <Route path="/cotacoes" element={<Cotacoes />} />
        <Route path="/parceiros" element={<Parceiros />} />
        <Route path="/documentos" element={<Documentos />} />
        <Route path="/config" element={<Config />} />
      </Route>
    </Routes>
  )
}
