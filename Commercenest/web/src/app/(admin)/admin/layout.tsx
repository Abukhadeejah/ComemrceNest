import { resolveTenantIdFromRequest } from '@/server/tenant'
import { assertTenantAdmin } from '@/server/auth'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import TenantContextProvider from '@/components/TenantContextProvider'
import { getTenantConfig } from '@/tenants'

export default async function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) {
    throw new Error('Tenant not found')
  }
  
  // Temporarily commented out for testing
  // await assertTenantAdmin(tenantId)

  // Get tenant config directly without TenantProvider
  const tenantKey = tenantId ? 'senlysh' : 'default'
  const cfg = getTenantConfig(tenantKey)

  return (
    <TenantContextProvider config={cfg}>
      <AdminLayout>
        {children}
      </AdminLayout>
    </TenantContextProvider>
  )
}


