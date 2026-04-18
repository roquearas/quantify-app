'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { UserPlus } from 'lucide-react'

export default function Signup() {
  const { signUp } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError('Senha deve ter no mínimo 8 caracteres'); return }
    setLoading(true)
    const { error } = await signUp(email, password, name, companyName, cnpj || undefined)
    setLoading(false)
    if (error) { setError(error); return }
    router.replace('/app')
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <img src="/logo-main.png" alt="Quantify" />
          <h1>Quantify<span>.</span></h1>
          <p>Crie sua conta</p>
        </div>
        <h2>Cadastro</h2>
        <form onSubmit={onSubmit} className="auth-form">
          <label><span>Seu nome</span><input required value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label><span>Empresa</span><input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></label>
          <label><span>CNPJ (opcional)</span><input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" /></label>
          <label><span>E-mail</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
          <label><span>Senha (mín. 8)</span><input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></label>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <UserPlus size={16} /> {loading ? 'Criando...' : 'Criar conta'}
          </button>
        </form>
        <div className="auth-links">
          <Link href="/login">Já tenho conta</Link>
          <Link href="/">Voltar ao site</Link>
        </div>
      </div>
    </div>
  )
}
