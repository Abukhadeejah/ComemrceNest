import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AdminWrapper } from '@/components/AdminWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Senlysh - Fashion & Lifestyle',
  description: 'Your destination for fashion-forward clothing and accessories. Discover the latest trends in fashion with our curated collection.',
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
