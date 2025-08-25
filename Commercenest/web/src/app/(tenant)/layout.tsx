import type { Metadata } from 'next'
import { headers } from 'next/headers'
import TenantProvider from '@/components/TenantProvider'
import SenlyshHeader from '@/tenants/senlysh/SenlyshHeader'
import SenlyshFooter from '@/tenants/senlysh/SenlyshFooter'

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || '/'
  
  // Determine tenant based on pathname
  const isBluebell = pathname.startsWith('/bluebell')
  const isSenlysh = pathname.startsWith('/senlysh') || (!isBluebell && pathname !== '/')

  return (
    <TenantProvider>
      <div className="min-h-screen flex flex-col">
        {isSenlysh && <SenlyshHeader />}
        {isBluebell && (
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-blue-900">Bluebell Interiors</h1>
                </div>
                <nav className="hidden md:flex space-x-8">
                  <a href="/bluebell" className="text-gray-700 hover:text-blue-900">Home</a>
                  <a href="/bluebell/products" className="text-gray-700 hover:text-blue-900">Products</a>
                  <a href="/bluebell/portfolio" className="text-gray-700 hover:text-blue-900">Portfolio</a>
                </nav>
              </div>
            </div>
          </header>
        )}
        <main className="flex-1">
          {children}
        </main>
        {isSenlysh && <SenlyshFooter />}
        {isBluebell && (
          <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Bluebell Interiors</h3>
                <p className="text-gray-400">Premium fabrics for extraordinary spaces</p>
              </div>
            </div>
          </footer>
        )}
      </div>
    </TenantProvider>
  )
}
