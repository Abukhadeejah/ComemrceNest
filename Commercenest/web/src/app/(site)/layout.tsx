import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import TenantProvider from '@/components/TenantProvider'
import TenantLayoutServer from '@/components/tenant/TenantLayoutServer'

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
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.svg',
  },
}

/**
 * Extracts tenant key from pathname
 */
function extractTenantKey(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return null
  
  const firstSegment = segments[0]
  // Only return valid tenant keys
  if (['bluebell', 'senlysh'].includes(firstSegment.toLowerCase())) {
    return firstSegment.toLowerCase()
  }
  
  return null
}

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || '/'
  const tenantAdmin = headersList.get('x-tenant-admin')

  // Debug logging
  console.log('SiteLayout - pathname:', pathname, 'tenantAdmin:', tenantAdmin)

  // Extract tenant key from pathname
  const tenantKey = extractTenantKey(pathname)
  const isRoot = pathname === '/'

  console.log('SiteLayout - tenantKey:', tenantKey, 'isRoot:', isRoot)

  return (
    <TenantProvider>
      {tenantKey ? (
        // Use registry-based layout for tenant routes
        <TenantLayoutServer tenantKey={tenantKey}>
          {children}
        </TenantLayoutServer>
      ) : (
        // Simple layout for root platform page
        <div className="min-h-screen flex flex-col">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">CommerceNest Platform</h1>
                </div>
                <nav className="hidden md:flex space-x-8">
                  <Link href="/" className="text-gray-700 hover:text-blue-900">Home</Link>
                  <Link href="/bluebell" className="text-gray-700 hover:text-blue-900">Bluebell</Link>
                  <Link href="/senlysh" className="text-gray-700 hover:text-blue-900">Senlysh</Link>
                </nav>
              </div>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
          <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">CommerceNest Platform</h3>
                <p className="text-gray-300">Multi-tenant e-commerce platform</p>
                <div className="mt-4 space-x-4">
                  <Link href="/bluebell" className="text-gray-300 hover:text-white">Bluebell Interiors</Link>
                  <span className="text-gray-600">|</span>
                  <Link href="/senlysh" className="text-gray-300 hover:text-white">Senlysh Fashion</Link>
                </div>
              </div>
              <div className="border-t border-gray-700 mt-8 pt-8 text-center">
                <p className="text-gray-300">&copy; 2024 CommerceNest. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      )}
    </TenantProvider>
  )
}
