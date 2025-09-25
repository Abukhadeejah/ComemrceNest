import { Metadata } from 'next'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { validateCustomerFeatureAccess } from '@/server/customerModules'
import { redirect } from 'next/navigation'
import CustomerProfileForm from './CustomerProfileForm'
import Link from 'next/link'
import { getAuthenticatedUserId } from '@/server/auth'

export const metadata: Metadata = {
  title: 'My Profile - Bluebell',
  description: 'Manage your Bluebell account profile, personal details, and preferences.',
  openGraph: {
    title: 'My Profile - Bluebell',
    description: 'Manage your Bluebell account profile, personal details, and preferences.',
    type: 'website',
  },
}

export default async function BluebellProfilePage() {
  const tenantId = await resolveTenantIdFromRequest()
  
  if (!tenantId) {
    redirect('/bluebell/login')
  }

  // Check if customer registration module is enabled for this tenant
  const validation = await validateCustomerFeatureAccess(tenantId, 'registration', 'Customer Profile')
  
  if (!validation.allowed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-bold text-white">B</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Unavailable</h1>
          <p className="text-gray-600 mb-6">{validation.error}</p>
          {validation.upgradeMessage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">{validation.upgradeMessage}</p>
            </div>
          )}
          <Link 
            href="/bluebell" 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Get authenticated user
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    redirect('/bluebell/login')
  }

  // Get customer profile
  const { data: customer, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single()

  if (error || !customer) {
    redirect('/bluebell/register')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-600">B</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">My Profile</h1>
                  <p className="text-blue-100">Manage your account details and preferences</p>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <div className="p-8">
              <CustomerProfileForm 
                customer={customer}
                tenantId={tenantId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

