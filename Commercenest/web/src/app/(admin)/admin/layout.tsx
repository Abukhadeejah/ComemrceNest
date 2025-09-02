import type { Metadata } from 'next'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar'
import AdminBrandingWrapper from '@/components/admin/AdminBrandingWrapper'
import type { TenantKey } from '@/registry/types'
import { getEnabledModules } from '@/server/adminModules'

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers()
  const xTenant = hdrs.get('x-tenant-admin')?.toLowerCase()
  const cookieStore = await cookies()
  const ck = cookieStore.get('tenant')?.value?.toLowerCase()
  const tenant = (xTenant === 'bluebell' || xTenant === 'senlysh') ? xTenant : (ck === 'bluebell' || ck === 'senlysh') ? ck : 'bluebell'
  const brand = tenant === 'senlysh' ? 'Senlysh' : 'Bluebell Interiors'
  return {
    title: `${brand} Admin - Dashboard`,
    description: `${brand} admin dashboard for managing products, orders, and customers`,
    icons: {
      icon: '/icon.svg',
      shortcut: '/icon.svg',
      apple: '/icon.svg',
    },
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tenantId = await resolveTenantIdFromRequest()
  
  if (!tenantId) {
    redirect('/login')
  }

  // Resolve tenant key for admin branding (dev: cookie/header; prod: path/host via middleware)
  const hdrs = await headers()
  let tenantKey: TenantKey | undefined = (hdrs.get('x-tenant-admin') as TenantKey) || undefined
  if (!tenantKey) {
    try {
      const cookieStore = await cookies()
      const ck = cookieStore.get('tenant')?.value?.toLowerCase()
      if (ck === 'bluebell' || ck === 'senlysh') tenantKey = ck as TenantKey
    } catch {}
  }
  if (!tenantKey) tenantKey = 'bluebell'

  // Fetch enabled modules server-side and pass to client via data attribute
  const enabledModules = await getEnabledModules(tenantId)

  return (
    <AdminBrandingWrapper tenantKey={tenantKey}>
      <div className="min-h-screen bg-gray-50" data-enabled-modules={JSON.stringify(Array.from(enabledModules))}>
        <AdminSidebar />
        <div className="lg:pl-64">
          <main className="py-6">
            {children}
          </main>
        </div>
      </div>
    </AdminBrandingWrapper>
  )
}


