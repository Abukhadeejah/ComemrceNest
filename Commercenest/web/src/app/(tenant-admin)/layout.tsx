import type { Metadata } from 'next'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar'
import AdminBrandingWrapper from '@/components/admin/AdminBrandingWrapper'
import type { TenantKey } from '@/registry/types'
import { supabaseAdmin } from '@/server/supabaseAdmin'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Admin dashboard for managing products, orders, and customers',
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

  // Get tenant key from tenant ID
  const tenantKey = await getTenantKeyFromId(tenantId)
  if (!tenantKey) {
    redirect('/login')
  }

  return (
    <AdminBrandingWrapper tenantKey={tenantKey as TenantKey}>
      <div className="min-h-screen bg-gray-50">
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

async function getTenantKeyFromId(tenantId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('tenants')
    .select('name')
    .eq('id', tenantId)
    .maybeSingle()
  
  if (!data?.name) return null
  
  // Map tenant names to keys
  const nameToKey: Record<string, string> = {
    'Bluebell Interiors': 'bluebell',
    'Senlysh Fashion': 'senlysh',
  }
  
  return nameToKey[data.name] || null
}



