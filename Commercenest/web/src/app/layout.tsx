import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AdminWrapper } from '@/components/AdminWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Commercenest - Multi-tenant E-commerce Platform',
  description: 'A modern multi-tenant e-commerce platform built with Next.js and Supabase',
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
