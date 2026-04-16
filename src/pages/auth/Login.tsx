import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { LogIn } from 'lucide-react'

const STAFF_ROLES = ['ADMIN', 'MANAGER', 'ENGINEER', 'ESTIMATOR']

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: { pathname?: string } } }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) { setLoading(false); setError(error); return }

    // Após o signIn, busca role direto no DB para decidir destino
    // (o contexto Auth pode ainda não ter hidratado o AppUser)
    const { data: authData } = await supabase.auth.getUser()
    let destination = '/app'
    if (authData.user) {
      const { data: appUser } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', authData.user.id)
        .maybeSingle()
      const role = (appUser as { role?: string } | null)?.role
      if (role && STAFF_ROLES.includes(role)) destination = '/admin'
    }

    setLoading(false)
    const from = location.state?.from?.pathname
    navigate(from || destination, { replace: true })
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <img src="/logo-main.png" alt="Quantify" />
          <h1>Quantify<span>.</span></h1>
          <p>Engenharia inteligente</p>
        </div>
        <h2>Entrar</h2>
        <form onSubmit={onSubmit} className="auth-form">
          <label>
            <span>E-mail</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>
          <label>
            <span>Senha</span>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <LogIn size={16} /> {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/signup">Criar conta</Link>
          <Link to="/">Voltar ao site</Link>
        </div>
      </div>
    </div>
  )
}
