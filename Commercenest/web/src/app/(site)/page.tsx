import type { Metadata, Viewport } from 'next'
import BluebellHome from '@/tenants/bluebell/BluebellHome'
import SenlyshHome from '@/tenants/senlysh/SenlyshHome'
import { fetchCompanyProfileByTenantId } from '@/server/settings'
import { resolveTenantIdFromRequest, getPrimaryHostnameForTenant, getRequestHostname, resolveTenantKeyFromId } from '@/server/tenant'

export default async function RootHome() {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">CommerceNest</h1>
        <p className="text-gray-600">Multi-tenant e-commerce platform</p>
      </div>
    </div>
  }
  
  const tenantKey = await resolveTenantKeyFromId(tenantId)
  
  switch (tenantKey) {
    case 'bluebell':
      return <BluebellHome />
    case 'senlysh':
      return <SenlyshHome />
    default:
      return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tenant Not Found</h1>
          <p className="text-gray-600">This tenant is not configured yet.</p>
        </div>
      </div>
  }
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






