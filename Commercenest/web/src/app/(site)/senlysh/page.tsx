import { getRegistryEntry } from '@/registry/tenantRegistry'
import { headers } from 'next/headers'
import { Metadata } from 'next'
import type { TenantKey } from '@/registry/types'
import Link from 'next/link'
import { ShoppingBag, Store } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || '/'
  
  // If root path, return CommerceNest metadata
  if (pathname === '/') {
    return {
      title: 'CommerceNest - Multi-Tenant E-Commerce Platform',
      description: 'Choose your store: Bluebell Interiors or Senlysh Fashion',
    }
  }
  
  const tenantKey = (pathname.split('/')[1] as TenantKey) || 'senlysh'
  
  const registryEntry = getRegistryEntry(tenantKey)
  const { defaultMetadata } = await registryEntry.metadata()
  
  return defaultMetadata
}

export default async function RootPage() {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || '/'
  
  // If accessing root path, show CommerceNest landing page
  if (pathname === '/') {
    return <CommerceNestLandingPage />
  }
  
  // Otherwise, load the appropriate tenant
  const tenantKey = (pathname.split('/')[1] as TenantKey) || 'senlysh'
  
  const registryEntry = getRegistryEntry(tenantKey)
  const HomeComponent = (await registryEntry.home()).default
  
  return <HomeComponent />
}

// CommerceNest Landing Page Component
function CommerceNestLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Logo/Branding */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            CommerceNest
          </h1>
          <p className="text-xl md:text-2xl text-purple-100">
            Multi-Tenant E-Commerce Platform
          </p>
          <p className="text-md text-purple-200 mt-2">
            Select your store to continue
          </p>
        </div>

        {/* Tenant Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Bluebell Card */}
          <Link href="/bluebell" className="block">
            <div className="bg-white rounded-2xl shadow-2xl p-8 hover:scale-105 transition-transform duration-300 cursor-pointer group h-full">
              <div className="flex flex-col items-center text-center h-full">
                {/* Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mb-6 group-hover:shadow-xl transition-shadow">
                  <Store className="w-10 h-10 text-white" />
                </div>
                
                {/* Title */}
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Bluebell Interiors
                </h2>
                
                {/* Description */}
                <p className="text-gray-600 mb-6 flex-grow">
                  Premium home interiors and furniture solutions for your dream space
                </p>
                
                {/* Button */}
                <div className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold group-hover:bg-blue-700 transition-colors w-full">
                  Visit Store →
                </div>
              </div>
            </div>
          </Link>

          {/* Senlysh Card */}
          <Link href="/senlysh" className="block">
            <div className="bg-white rounded-2xl shadow-2xl p-8 hover:scale-105 transition-transform duration-300 cursor-pointer group h-full">
              <div className="flex flex-col items-center text-center h-full">
                {/* Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-6 group-hover:shadow-xl transition-shadow">
                  <ShoppingBag className="w-10 h-10 text-white" />
                </div>
                
                {/* Title */}
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Senlysh Fashion
                </h2>
                
                {/* Description */}
                <p className="text-gray-600 mb-6 flex-grow">
                  Trendy fashion and lifestyle products for the modern you
                </p>
                
                {/* Button */}
                <div className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold group-hover:bg-purple-700 transition-colors w-full">
                  Visit Store →
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Admin Link */}
        <div className="text-center mt-8">
          <Link 
            href="/admin" 
            className="text-white hover:text-purple-200 transition-colors text-sm underline"
          >
            Admin Dashboard →
          </Link>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-12 text-white text-sm">
          <p>© 2025 CommerceNest. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
