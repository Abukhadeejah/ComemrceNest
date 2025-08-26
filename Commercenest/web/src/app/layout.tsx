import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AdminWrapper } from '@/components/AdminWrapper'

const inter = Inter({ subsets: ['latin'] })

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
    <html lang="en">
      <body className={inter.className}>
        <AdminWrapper>
          {children}
        </AdminWrapper>
      </body>
    </html>
  )
}
