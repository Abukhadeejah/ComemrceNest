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
    
    // Return error display with more details
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <h3 className="font-semibold">Error Loading Coupon Page</h3>
          <p className="mt-1">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium">Show Error Details</summary>
            <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
              {error instanceof Error ? error.stack : String(error)}
            </pre>
          </details>
        </div>
        
        {/* Fallback test content */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold text-blue-800">Fallback Test</h3>
          <p className="text-sm text-blue-600">
            The coupon page had an error, but routing is working.
          </p>
        </div>
      </div>
    )
  }
}
