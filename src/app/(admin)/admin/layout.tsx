import type { Metadata } from 'next'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'
import AdminBrandingWrapper from '@/components/admin/AdminBrandingWrapper'
import type { TenantKey } from '@/registry/types'
import { getEnabledModules } from '@/server/adminModules'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'

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

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tenantId = await resolveTenantIdFromRequest()

  // DEBUG: Add fallback tenant resolution for localhost development
  let resolvedTenantId = tenantId
  let tenantKey: TenantKey | undefined

  if (!resolvedTenantId) {
    // Try to get tenant from pathname for localhost development
    const hdrs = await headers()
    const pathname = hdrs.get('x-pathname') || ''
    const pathSegments = pathname.split('/').filter(Boolean)

    if (pathSegments.length > 0) {
      const firstSegment = pathSegments[0].toLowerCase()
      if (firstSegment === 'bluebell') {
        resolvedTenantId = '11111111-1111-4111-8111-11111111bb01' // Bluebell Interiors
        tenantKey = 'bluebell'
      } else if (firstSegment === 'senlysh') {
        resolvedTenantId = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c' // Senlysh Fashion
        tenantKey = 'senlysh'
      }
    }

    // Fallback to cookie if still no tenant
    if (!resolvedTenantId) {
      try {
        const cookieStore = await cookies()
        const ck = cookieStore.get('tenant')?.value?.toLowerCase()
        if (ck === 'bluebell') {
          resolvedTenantId = '11111111-1111-4111-8111-11111111bb01'
          tenantKey = 'bluebell'
        } else if (ck === 'senlysh') {
          resolvedTenantId = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c'
          tenantKey = 'senlysh'
        }
      } catch {}
    }
  }

  // If still no tenant, redirect to login
  if (!resolvedTenantId) {
    redirect('/login')
  }

  // Resolve tenant key for admin branding (dev: cookie/header; prod: path/host via middleware)
  if (!tenantKey) {
    const hdrs = await headers()
    tenantKey = (hdrs.get('x-tenant-admin') as TenantKey) || undefined
    if (!tenantKey) {
      try {
        const cookieStore = await cookies()
        const ck = cookieStore.get('tenant')?.value?.toLowerCase()
        if (ck === 'bluebell' || ck === 'senlysh') tenantKey = ck as TenantKey
      } catch {}
    }
  }

  // Fetch enabled modules server-side
  const enabledModules = await getEnabledModules(resolvedTenantId)

  return (
    <AdminBrandingWrapper tenantKey={tenantKey || 'bluebell'}>
      <div className="min-h-screen bg-gray-50" data-enabled-modules={JSON.stringify(Array.from(enabledModules))}>
        <AdminLayout>
          {children}
        </AdminLayout>
      </div>
    </AdminBrandingWrapper>
  )
}
