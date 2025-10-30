import type { Metadata } from 'next'
import { getRegistryEntry } from '@/registry/tenantRegistry'

export async function generateMetadata(): Promise<Metadata> {
  const registryEntry = getRegistryEntry('senlysh')
  const { getPageMetadata } = await registryEntry.metadata()
  return getPageMetadata('Contact Us', 'Get in touch with Senlysh')
}

export default function SenlyshContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3">Contact Us</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">We’d love to hear from you. Our support team is here to help.</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Send us a message</h2>
              <form className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input className="border rounded-md px-3 py-2" placeholder="Your name" />
                <input className="border rounded-md px-3 py-2" placeholder="Email" type="email" />
                <input className="border rounded-md px-3 py-2 sm:col-span-2" placeholder="Subject" />
                <textarea className="border rounded-md px-3 py-2 sm:col-span-2" placeholder="Message" rows={5} />
                <div className="sm:col-span-2">
                  <button type="button" disabled className="bg-gray-900 text-white px-5 py-2 rounded-md opacity-70 cursor-not-allowed">Submit (coming soon)</button>
                </div>
              </form>
            </div>
          </div>
          <aside className="bg-gray-900 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold text-cyan-400 mb-3">Contact Details</h3>
            <ul className="space-y-3 text-gray-200 text-sm">
              <li>📍 Shop No.1, Narmada Smruti, Cabin Road, Near Sudha Hospital, Near Station, Bhayandar East, 401105.</li>
              <li>📞 (+91) 9029460064, 🗨️ 7977439669</li>
              <li>✉️ helpdesk@senlysh.in, ✉️senlysh.official@gmail.com, ✉️senlysh.in@zohomail.com </li>
            </ul>
          </aside>
        </div>
      </div>
    </div>
  )
}


