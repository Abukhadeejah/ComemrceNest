import type { Metadata } from 'next'
import { getRegistryEntry } from '@/registry/tenantRegistry'

export async function generateMetadata(): Promise<Metadata> {
  const registryEntry = getRegistryEntry('senlysh')
  const { getPageMetadata } = await registryEntry.metadata()
  return getPageMetadata('About Us', 'Learn more about Senlysh')
}

export default function SenlyshAboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">About Senlysh</h1>
      <p className="text-gray-700 leading-7">
        Senlysh is your premier destination for fashion and lifestyle. We bring the latest trends,
        premium quality, and a delightful shopping experience for everyone.
      </p>
    </div>
  )
}


