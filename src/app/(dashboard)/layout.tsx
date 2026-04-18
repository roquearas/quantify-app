'use client'
import { RequireAuth } from '@/components/RouteGuards'
import ClientLayout from '@/components/ClientLayout'

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <ClientLayout>{children}</ClientLayout>
    </RequireAuth>
  )
}
