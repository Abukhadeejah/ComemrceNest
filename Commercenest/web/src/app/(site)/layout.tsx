import type { Metadata } from 'next'
import { headers } from 'next/headers'
import TenantProvider from '@/components/TenantProvider'
import TenantLayoutServer from '@/components/tenant/TenantLayoutServer'
import { CartProvider } from '@/lib/cart'
import { getTenantConfig } from '@/tenants'

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || '/'

  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]?.toLowerCase()
  const isTenant = first === 'bluebell' || first === 'senlysh'
  const tenantKey: string | undefined = isTenant ? first : undefined

  // CRITICAL FIX: generateMetadata should NOT use tenant cookies for root routes
  // This prevents metadata contamination and ensures consistent branding
  // Only tenant-prefixed routes should use cookies

  if (!tenantKey) {
    return {
      title: {
        default: 'CommerceNest - Multi-tenant Platform',
        template: '%s | CommerceNest',
      },
      description: 'Multi-tenant e-commerce platform',
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
  }

  const cfg = getTenantConfig(tenantKey)
  const brand = cfg.brand?.name || tenantKey
  const tagline = cfg.brand?.tagline || 'Premium Fabrics & Design'

  return {
    title: {
      default: `${brand} - ${tagline}`,
      template: `%s | ${brand}`,
    },
    icons: {
      icon: '/icon.svg',
      shortcut: '/icon.svg',
      apple: '/icon.svg'
    },
    description: cfg.brand?.tagline || 'Premium multi-tenant storefront',
    openGraph: {
      title: `${brand} - ${tagline}`,
      description: cfg.brand?.tagline || 'Premium multi-tenant storefront',
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${brand} - ${tagline}`,
      description: cfg.brand?.tagline || 'Premium multi-tenant storefront',
    },
  }
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

  // CRITICAL FIX: Root routes (/) should NEVER use tenant cookies
  // Only tenant-prefixed routes (/bluebell/*, /senlysh/*) should use cookies
  // This prevents cross-tenant contamination on the platform homepage

  return (
    <TenantProvider tenantKey={tenantKey}>
      <CartProvider>
        <TenantLayoutServer tenantKey={tenantKey}>
          {children}
        </TenantLayoutServer>
      </CartProvider>
    </TenantProvider>
  )
}
