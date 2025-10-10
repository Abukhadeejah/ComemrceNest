import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CommerceNest',
  description: 'Multi-tenant e-commerce platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
