import type { Metadata } from 'next'
import TenantProvider from '@/components/TenantProvider'

export const metadata: Metadata = {
  title: 'CommerceNest - Multi-tenant Platform',
  description: 'Multi-tenant e-commerce platform',
  keywords: 'e-commerce, multi-tenant, platform',
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

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TenantProvider>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </TenantProvider>
  )
}
