// Disable static optimization for debugging
export const dynamic = 'force-dynamic'
export const revalidate = 0

import type { Metadata } from 'next'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { getRegistryEntry } from '@/registry/tenantRegistry'
import { fetchCompanyProfileByTenantId } from '@/server/settings'

export async function generateMetadata(): Promise<Metadata> {
  const registryEntry = getRegistryEntry('bluebell')
  const { getPageMetadata } = await registryEntry.metadata()
  return getPageMetadata('About Us', 'Learn about Bluebell Interiors')
}

export default async function AboutPage() {
  const tenantId = await resolveTenantIdFromRequest()
  
  if (!tenantId) {
    return <div>Tenant not found</div>
  }
  
  const { data: companyProfile } = await fetchCompanyProfileByTenantId(tenantId)
  const companyName = companyProfile?.name || 'Bluebell Interiors'
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <a href="/bluebell" className="text-bluebell-brown hover:text-bluebell-blue transition-colors duration-300 font-medium">Home</a>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
            <span className="text-[#01589D] font-semibold">About Us</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tight text-[#01589D] mb-6 leading-tight">
            About Us
          </h1>
          <div className="w-32 h-1 bg-[#FDCE59] mx-auto mb-8 rounded-full shadow-lg"></div>
          <p className="text-xl md:text-2xl text-[#4E302E] max-w-3xl mx-auto font-light leading-relaxed">
            Learn about {companyName} and our commitment to exceptional interior design
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 mb-12">
            <h2 className="text-3xl font-serif font-bold text-bluebell-blue mb-6">Our Story</h2>
            <p className="text-bluebell-brown mb-6 leading-relaxed">
              Founded in 2015, {companyName} has established itself as a premier provider of luxury fabrics and interior design solutions. Our journey began with a simple vision: to bring exceptional quality and timeless elegance to homes across India.
            </p>
            <p className="text-bluebell-brown mb-6 leading-relaxed">
              What sets us apart is our unwavering commitment to quality and our eye for unique designs that transform living spaces. Each fabric in our collection is carefully selected to ensure durability, beauty, and versatility.
            </p>
            
            <h2 className="text-3xl font-serif font-bold text-bluebell-blue mt-12 mb-6">Our Approach</h2>
            <p className="text-bluebell-brown mb-6 leading-relaxed">
              At {companyName}, we believe that great design should be accessible to everyone. Our team of experienced designers works closely with clients to understand their vision and bring it to life through our curated selection of premium fabrics.
            </p>
            <p className="text-bluebell-brown mb-6 leading-relaxed">
              Whether you're looking to refresh a single room or redesign your entire home, we're here to guide you through every step of the process. From initial consultation to final installation, we ensure a seamless experience that exceeds expectations.
            </p>
            
            <div className="mt-12 text-center">
              <a href="/bluebell/contact" className="inline-block bg-bluebell-blue hover:bg-[#01487D] text-white font-medium py-3 px-8 rounded-lg transition-colors duration-300">
                Get in Touch
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
