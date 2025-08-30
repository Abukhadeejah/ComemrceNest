import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { AdminWrapper } from '@/components/AdminWrapper'

const inter = Inter({ subsets: ['latin'] })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' })

export const metadata: Metadata = {
  title: 'CommerceNest - Multi-tenant Platform',
  description: 'Multi-tenant e-commerce platform',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={playfair.variable}>
      <body className={`${inter.className} ${playfair.className}`}>
        <AdminWrapper>
          {children}
        </AdminWrapper>
      </body>
    </html>
  )
}
