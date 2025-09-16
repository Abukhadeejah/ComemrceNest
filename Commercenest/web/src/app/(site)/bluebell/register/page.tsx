import { Metadata } from 'next'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { validateCustomerFeatureAccess } from '@/server/customerModules'
import { redirect } from 'next/navigation'
import CustomerRegistrationForm from './CustomerRegistrationForm'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Create Account - Bluebell',
  description: 'Join Bluebell to access exclusive fashion collections, track your orders, and enjoy personalized shopping experiences.',
  openGraph: {
    title: 'Create Account - Bluebell',
    description: 'Join Bluebell to access exclusive fashion collections, track your orders, and enjoy personalized shopping experiences.',
    type: 'website',
  },
}

export default async function BluebellRegisterPage() {
  const tenantId = await resolveTenantIdFromRequest()
  
  if (!tenantId) {
    redirect('/')
  }

  // Check if customer registration module is enabled for this tenant
  const validation = await validateCustomerFeatureAccess(tenantId, 'registration', 'Customer Registration')
  
  if (!validation.allowed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Registration Unavailable</h1>
          <p className="text-gray-600 mb-6">{validation.upgradeMessage}</p>
          <Link 
            href="/bluebell" 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return <CustomerRegistrationForm tenantKey="bluebell" />
}


