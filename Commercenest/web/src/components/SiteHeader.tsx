import Image from 'next/image'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { fetchCompanyProfileByTenantId } from '@/server/settings'

export default async function SiteHeader() {
  const tenantId = await resolveTenantIdFromRequest()
  const { data: company } = tenantId ? await fetchCompanyProfileByTenantId(tenantId) : { data: null as any }
  const accent = company?.brand_accent_hex ?? '#1f3a8a'
  const name = company?.name ?? 'Store'
  return (
    <header className="flex items-center gap-3 border-b px-6 py-4">
      {company?.logo_url ? (
        <div className="relative h-8 w-8 overflow-hidden rounded">
          <Image src={company.logo_url} alt={name} fill sizes="32px" className="object-contain" />
        </div>
      ) : null}
      <div className="text-lg font-semibold" style={{ color: accent }}>{name}</div>
    </header>
  )
}


