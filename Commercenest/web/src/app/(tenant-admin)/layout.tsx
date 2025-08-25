import type { Metadata } from 'next'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar'

export const metadata: Metadata = {
  title: 'Senlysh Admin - Dashboard',
  description: 'Senlysh admin dashboard for managing products, orders, and customers',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.svg',
  },
}

export default async function TenantAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tenantId = await resolveTenantIdFromRequest()
  
  if (!tenantId) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="lg:pl-64">
        <main className="py-6">
          {children}
        </main>
      </div>
    </div>
  )
}



