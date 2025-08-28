import type { Metadata } from 'next'
import { headers } from 'next/headers'
import TenantProvider from '@/components/TenantProvider'
import TenantLayoutServer from '@/components/tenant/TenantLayoutServer'
import { CartProvider } from '@/lib/cart'

export const metadata: Metadata = {
  title: 'CommerceNest - Multi-tenant Platform',
  description: 'Multi-tenant e-commerce platform',
  keywords: 'e-commerce, multi-tenant, platform, SaaS',
  authors: [{ name: 'CommerceNest' }],
  openGraph: {
    title: 'CommerceNest - Multi-tenant Platform',
    description: 'Multi-tenant e-commerce platform',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CommerceNest - Multi-tenant Platform',
    description: 'Multi-tenant e-commerce platform',
  },
}

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || '/'
  
  // Extract tenant key from pathname, but only for tenant-specific routes
  // Root routes (/, /products, etc.) should not have a tenant key
  const pathSegments = pathname.split('/').filter(Boolean)
  let tenantKey: string | undefined = undefined
  
  // Only set tenant key if the first segment is a known tenant
  if (pathSegments.length > 0) {
    const firstSegment = pathSegments[0].toLowerCase()
    if (firstSegment === 'bluebell' || firstSegment === 'senlysh') {
      tenantKey = firstSegment
    }
  }

  return (
    <CartProvider>
      <TenantProvider tenantKey={tenantKey}>
        <TenantLayoutServer tenantKey={tenantKey}>
          {children}
        </TenantLayoutServer>
      </TenantProvider>
    </CartProvider>
  )
}
