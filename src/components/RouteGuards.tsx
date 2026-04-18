'use client'

import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useAuth } from '../lib/auth'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login')
    }
  }, [loading, session, router])

  if (loading) return <div className="loading">Carregando...</div>
  if (!session) return null
  return <>{children}</>
}

export function RequireStaff({ children }: { children: ReactNode }) {
  const { session, user, loading, isStaff } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.replace('/login')
      } else if (user && !isStaff) {
        router.replace('/app')
      }
    }
  }, [loading, session, user, isStaff, router])

  if (loading) return <div className="loading">Carregando...</div>
  if (!session) return null
  if (!user) return <div className="loading">Carregando perfil...</div>
  if (!isStaff) return null
  return <>{children}</>
}

export function RequireClient({ children }: { children: ReactNode }) {
  const { session, user, loading, isStaff } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.replace('/login')
      } else if (user && !isStaff && user.role !== 'CLIENT') {
        router.replace('/')
      }
    }
  }, [loading, session, user, isStaff, router])

  if (loading) return <div className="loading">Carregando...</div>
  if (!session) return null
  if (!user) return <div className="loading">Carregando perfil...</div>
  return <>{children}</>
}
