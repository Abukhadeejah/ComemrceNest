import type { Metadata } from 'next'
import { getRegistryEntry } from '@/registry/tenantRegistry'

export async function generateMetadata(): Promise<Metadata> {
  const registryEntry = getRegistryEntry('senlysh')
  const { getPageMetadata } = await registryEntry.metadata()
  return getPageMetadata('Contact Us', 'Get in touch with Senlysh')
}

export default function SenlyshContactPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
      <p className="text-gray-700 leading-7 mb-6">We would love to hear from you. Reach us at support@senlysh.in</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Address</h2>
          <p>123 Fashion Street, Mumbai, 400001</p>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Phone</h2>
          <p>(+91) 98765-43210</p>
        </div>
      </div>
    </div>
  )
}


