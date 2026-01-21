import { resolveTenantIdFromRequest } from '@/server/tenant'
import { isModuleEnabled } from '@/server/adminModules'
import { ModuleDisabled } from '@/components/admin/ModuleDisabled'
import { GiftIcon } from '@heroicons/react/24/outline'
import CouponsPageContent from './CouponsPageContent'

export default async function CouponsPage() {
  console.log('🎫 [CouponsPage] Starting coupon page load...')
  
  try {
    const tenantId = await resolveTenantIdFromRequest()
    console.log('🎫 [CouponsPage] Resolved tenant ID:', tenantId)
    
    // Gate route by module
    const allowed = tenantId ? await isModuleEnabled(tenantId, 'coupons') : false
    console.log('🎫 [CouponsPage] Module enabled check:', { tenantId, allowed })
    
    if (!allowed) {
      console.log('🎫 [CouponsPage] ❌ Coupon module not enabled, showing disabled message')
      return (
        <ModuleDisabled
          moduleName="Coupons"
          moduleDescription="Create and manage discount codes for your customers with flexible rules and usage limits."
          moduleIcon={GiftIcon}
        />
      )
    }

    console.log('🎫 [CouponsPage] ✅ Module enabled, rendering coupon content')
    return <CouponsPageContent />
  } catch (error) {
    console.error('🎫 [CouponsPage] ❌ Error in coupon page:', error)
    console.error('🎫 [CouponsPage] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    
    // Return error display
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <h3 className="font-semibold">Error Loading Coupon Page</h3>
          <p className="mt-1">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <p className="text-sm mt-2 text-red-600">
            Check the browser console for detailed error information.
          </p>
        </div>
      </div>
    )
  }
}
