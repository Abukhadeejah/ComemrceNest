import type { Metadata } from 'next'
import TenantProvider from '@/components/TenantProvider'
import SenlyshHeader from '@/tenants/senlysh/SenlyshHeader'
import SenlyshFooter from '@/tenants/senlysh/SenlyshFooter'

export const metadata: Metadata = {
  title: 'Senlysh - Fashion & Lifestyle',
  description: 'Your destination for fashion-forward clothing and accessories. Discover the latest trends in fashion with our curated collection.',
  keywords: 'fashion, clothing, accessories, lifestyle, shopping, online store',
  authors: [{ name: 'Senlysh' }],
  openGraph: {
    title: 'Senlysh - Fashion & Lifestyle',
    description: 'Your destination for fashion-forward clothing and accessories',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Senlysh - Fashion & Lifestyle',
    description: 'Your destination for fashion-forward clothing and accessories',
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
        <SenlyshHeader />
        <main className="flex-1">
          {children}
        </main>
        <SenlyshFooter />
      </div>
    </TenantProvider>
  )
}
