import type { Metadata } from 'next'
import { getRegistryEntry } from '@/registry/tenantRegistry'

export async function generateMetadata(): Promise<Metadata> {
  const registryEntry = getRegistryEntry('senlysh')
  const { getPageMetadata } = await registryEntry.metadata()
  return getPageMetadata('About Us', 'Learn more about Senlysh')
}

export default function SenlyshAboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3">About Senlysh</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">Premium fashion and lifestyle, crafted for modern India.</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Our Story</h2>
            <p className="text-gray-700 leading-7">
              Senlysh is your premier destination for fashion and lifestyle. We bring the latest trends,
              premium quality, and a delightful shopping experience for everyone.
            </p>
            <p className="text-gray-700 leading-7">
              From everyday essentials to statement pieces, we curate collections that balance comfort,
              style, and value with a focus on Indian tastes and seasons.
            </p>
          </div>
          <aside className="bg-gray-900 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold text-cyan-400 mb-3">Why Senlysh</h3>
            <ul className="space-y-2 text-gray-200 text-sm">
              <li>✓ Curated collections and premium quality</li>
              <li>✓ India-first fits, sizes, and styles</li>
              <li>✓ Easy returns, fast deliveries</li>
              <li>✓ Secure checkout and support</li>
            </ul>
          </aside>
        </div>
      </div>
    </div>
  )
}


