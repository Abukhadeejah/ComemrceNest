import type { Metadata } from 'next'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { redirect } from 'next/navigation'
import AuthGate from '@/components/admin/AuthGate'
import AdminBrandingWrapper from '@/components/admin/AdminBrandingWrapper'
import type { TenantKey } from '@/registry/types'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'

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
  params,
}: {
  children: React.ReactNode
  params: Promise<any>
}) {
  // Await params (Next.js 15 requirement)
  const { tenant } = await params
  
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
    <AdminBrandingWrapper tenantKey={tenantKey || 'bluebell'}>
      <AuthGate>
        <AdminLayout>
          {children}
        </AdminLayout>
      </AuthGate>
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
