import { useLocation } from 'react-router-dom'
import { Construction } from 'lucide-react'

const titles: Record<string, string> = {
  '/composicoes': 'Composições (CPU)',
  '/cotacoes': 'Cotações',
  '/parceiros': 'Parceiros / Fornecedores',
  '/documentos': 'Documentos',
  '/config': 'Configurações',
}

export default function Placeholder() {
  const { pathname } = useLocation()
  const title = titles[pathname] || 'Página'

  return (
    <>
      <div className="page-header">
        <div>
          <h2>{title}</h2>
          <p>Em desenvolvimento</p>
        </div>
      </div>
      <div className="card empty-state">
        <Construction size={48} />
        <h3>{title}</h3>
        <p>Esta seção está sendo construída. Em breve estará disponível com funcionalidades completas.</p>
      </div>
    </>
  )
}
