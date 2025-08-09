import type { Metadata, Viewport } from 'next'
import BluebellHome from '@/tenants/bluebell/BluebellHome'
import { fetchCompanyProfileByTenantId } from '@/server/settings'
import { resolveTenantIdFromRequest, getPrimaryHostnameForTenant, getRequestHostname } from '@/server/tenant'

export default async function RootHome() {
  return <BluebellHome />
}

export async function generateMetadata(): Promise<Metadata> {
  const tenantId = await resolveTenantIdFromRequest()
  const reqHost = await getRequestHostname()
  if (!tenantId) {
    return {
      title: 'CommerceNest',
      metadataBase: reqHost ? new URL(`http://${reqHost}`) : undefined,
      alternates: { canonical: '/' },
    }
  }
  const { data } = await fetchCompanyProfileByTenantId(tenantId)
  const host = await getPrimaryHostnameForTenant(tenantId)
  return {
    title: data?.name ? `${data.name} — Home` : 'Home',
    metadataBase: (host || reqHost) ? new URL(`${host ? 'https' : 'http'}://${host || reqHost}`) : undefined,
    alternates: { canonical: '/' },
  }
}

export async function generateViewport(): Promise<Viewport> {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return { themeColor: '#C9A227' }
  const { data } = await fetchCompanyProfileByTenantId(tenantId)
  return { themeColor: data?.brand_accent_hex ?? '#C9A227' }
}
