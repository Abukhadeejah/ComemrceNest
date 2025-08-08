import { resolveTenantIdFromRequest } from '@/server/tenant'
import { fetchCompanyProfileByTenantId } from '@/server/settings'

export default async function BrandProvider({ children }: { children: React.ReactNode }) {
  const tenantId = await resolveTenantIdFromRequest()
  const { data: company } = tenantId ? await fetchCompanyProfileByTenantId(tenantId) : { data: null as any }
  const accent = company?.brand_accent_hex ?? '#1f3a8a'
  return (
    <div style={{ ['--brand-accent' as any]: accent }}>
      {children}
    </div>
  )
}


