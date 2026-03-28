import { Metadata } from 'next'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { validateCustomerFeatureAccess } from '@/server/customerModules'
import { redirect } from 'next/navigation'
import { getAuthenticatedUserId } from '@/server/auth'
import SenlyshAccountDashboard from './SenlyshAccountDashboard'

export const metadata: Metadata = {
  title: 'My Account - Senlysh',
  description: 'Manage your Senlysh account, view order history, and track your cashback earnings.',
  openGraph: {
    title: 'My Account - Senlysh',
    description: 'Manage your Senlysh account, view order history, and track your cashback earnings.',
    type: 'website',
  },
}

export default async function SenlyshMyAccountPage() {
  const tenantId = await resolveTenantIdFromRequest()
  
  if (!tenantId) {
    redirect('/senlysh/login')
  }

  // Check if customer registration module is enabled for this tenant
  const validation = await validateCustomerFeatureAccess(tenantId, 'registration', 'Customer Account')
  
  if (!validation.allowed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-bold text-white">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Account Unavailable</h1>
          <p className="text-gray-600 mb-6">{validation.error}</p>
          {validation.upgradeMessage && (
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-pink-800">{validation.upgradeMessage}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Get authenticated user
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    redirect('/senlysh/login')
  }

  // Get customer profile
  const { data: customer, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single()

  if (error || !customer) {
    redirect('/senlysh/register')
  }

  return <SenlyshAccountDashboard customer={customer} tenantId={tenantId} />
}