// Disable static optimization for debugging
export const dynamic = 'force-dynamic'
export const revalidate = 0

import type { Metadata } from 'next'
import Link from 'next/link'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { getRegistryEntry } from '@/registry/tenantRegistry'
import { fetchCompanyProfileByTenantId } from '@/server/settings'

export async function generateMetadata(): Promise<Metadata> {
  const registryEntry = getRegistryEntry('bluebell')
  const { getPageMetadata } = await registryEntry.metadata()
  return getPageMetadata('Contact', 'Contact Bluebell Interiors')
}

export default async function ContactPage() {
  const tenantId = await resolveTenantIdFromRequest()
  
  if (!tenantId) {
    return <div>Tenant not found</div>
  }
  
  const { data: companyProfile } = await fetchCompanyProfileByTenantId(tenantId)
  const companyName = companyProfile?.name || 'Bluebell Interiors'
  // Static fallback e-mail until settings include a contact address
  const companyEmail = 'info@bluebellinteriors.com'
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/bluebell" className="text-bluebell-brown hover:text-bluebell-blue transition-colors duration-300 font-medium">Home</Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
            <span className="text-[#01589D] font-semibold">Contact</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tight text-[#01589D] mb-6 leading-tight">
            Contact Us
          </h1>
          <div className="w-32 h-1 bg-[#FDCE59] mx-auto mb-8 rounded-full shadow-lg"></div>
          <p className="text-xl md:text-2xl text-[#4E302E] max-w-3xl mx-auto font-light leading-relaxed">
            Get in touch with {companyName} for any inquiries or consultations
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 mb-12">
            <h2 className="text-3xl font-serif font-bold text-bluebell-blue mb-6">Reach Out to Us</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-medium text-bluebell-blue mb-4">Contact Information</h3>
                <p className="text-bluebell-brown mb-2">
                  <strong>Company:</strong> {companyName}
                </p>
                <p className="text-bluebell-brown mb-2">
                  <strong>Address:</strong> 123 Fabric Lane, Design District, Mumbai
                </p>
                <p className="text-bluebell-brown mb-2">
                  <strong>Phone:</strong> +91 98765 43210
                </p>
                <p className="text-bluebell-brown mb-2">
                  <strong>Email:</strong> <a href={`mailto:${companyEmail}`} className="text-bluebell-blue hover:underline">{companyEmail}</a>
                </p>
                <p className="text-bluebell-brown mb-2">
                  <strong>Hours:</strong> Monday-Saturday: 10am - 7pm
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-medium text-bluebell-blue mb-4">Send a Message</h3>
                <p className="text-bluebell-brown mb-6">
                  Fill out the form below and we&apos;ll get back to you as soon as possible.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-bluebell-brown mb-1">Name</label>
                    <input 
                      type="text" 
                      id="name" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bluebell-blue focus:border-transparent" 
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-bluebell-brown mb-1">Email</label>
                    <input 
                      type="email" 
                      id="email" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bluebell-blue focus:border-transparent" 
                      placeholder="Your email"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-bluebell-brown mb-1">Message</label>
                    <textarea 
                      id="message" 
                      rows={4} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bluebell-blue focus:border-transparent" 
                      placeholder="How can we help you?"
                    ></textarea>
                  </div>
                  
                  <div className="pt-2">
                    <a 
                      href={`mailto:${companyEmail}`} 
                      className="inline-block bg-bluebell-blue hover:bg-[#01487D] text-white font-medium py-3 px-8 rounded-lg transition-colors duration-300"
                    >
                      Send Message
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
