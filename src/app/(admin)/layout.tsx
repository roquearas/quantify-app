'use client'
import { RequireStaff } from '@/components/RouteGuards'
import AdminLayout from '@/components/AdminLayout'

export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireStaff>
      <AdminLayout>{children}</AdminLayout>
    </RequireStaff>
  )
}
