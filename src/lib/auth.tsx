import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User as SupaAuthUser } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface AppUser {
  id: string
  auth_id: string | null
  email: string
  name: string
  role: 'ADMIN' | 'MANAGER' | 'ENGINEER' | 'ESTIMATOR' | 'VIEWER' | 'CLIENT'
  company_id: string
  crea: string | null
  cau: string | null
}

interface AuthContextValue {
  session: Session | null
  authUser: SupaAuthUser | null
  user: AppUser | null
  loading: boolean
  signUp: (email: string, password: string, name: string, companyName: string, cnpj?: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  isStaff: boolean
  isAdmin: boolean
  isClient: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function loadAppUser(authId: string): Promise<AppUser | null> {
  const { data } = await supabase.from('users').select('*').eq('auth_id', authId).maybeSingle()
  return (data as AppUser | null) ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [authUser, setAuthUser] = useState<SupaAuthUser | null>(null)
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setAuthUser(data.session?.user ?? null)
      if (data.session?.user) {
        const appUser = await loadAppUser(data.session.user.id)
        if (mounted) setUser(appUser)
      }
      if (mounted) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      setAuthUser(newSession?.user ?? null)
      if (newSession?.user) {
        const appUser = await loadAppUser(newSession.user.id)
        setUser(appUser)
      } else {
        setUser(null)
      }
    })

    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [])

  async function signUp(email: string, password: string, name: string, companyName: string, cnpj?: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }
    if (!data.user) return { error: 'Falha ao criar conta' }

    // Cria empresa
    const { data: company, error: cErr } = await supabase
      .from('companies')
      .insert({ name: companyName, cnpj: cnpj || null, price_base: 'SINAPI' })
      .select()
      .single()
    if (cErr || !company) return { error: cErr?.message || 'Falha ao criar empresa' }

    // Cria registro na tabela users com role CLIENT
    const { error: uErr } = await supabase
      .from('users')
      .insert({
        auth_id: data.user.id,
        email,
        name,
        role: 'CLIENT',
        company_id: company.id,
      })
    if (uErr) return { error: uErr.message }

    return { error: null }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const role = user?.role ?? null
  const isStaff = role !== null && ['ADMIN', 'MANAGER', 'ENGINEER', 'ESTIMATOR'].includes(role)
  const isAdmin = role === 'ADMIN'
  const isClient = role === 'CLIENT'

  return (
    <AuthContext.Provider value={{ session, authUser, user, loading, signUp, signIn, signOut, isStaff, isAdmin, isClient }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
