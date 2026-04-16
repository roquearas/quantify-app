import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../lib/auth'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="loading">Carregando...</div>
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}

export function RequireStaff({ children }: { children: ReactNode }) {
  const { session, user, loading, isStaff } = useAuth()
  const location = useLocation()
  if (loading) return <div className="loading">Carregando...</div>
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />
  if (!user) return <div className="loading">Carregando perfil...</div>
  if (!isStaff) return <Navigate to="/app" replace />
  return <>{children}</>
}

export function RequireClient({ children }: { children: ReactNode }) {
  const { session, user, loading, isStaff } = useAuth()
  const location = useLocation()
  if (loading) return <div className="loading">Carregando...</div>
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />
  if (!user) return <div className="loading">Carregando perfil...</div>
  // Staff também pode navegar o portal do cliente (para suporte)
  if (!isStaff && user.role !== 'CLIENT') return <Navigate to="/" replace />
  return <>{children}</>
}
