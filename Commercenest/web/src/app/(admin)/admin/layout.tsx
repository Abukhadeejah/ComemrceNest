import { resolveTenantIdFromRequest } from '@/server/tenant'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar'

export default async function AdminLayout({
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


