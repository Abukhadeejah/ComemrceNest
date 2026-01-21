import { resolveTenantIdFromRequest } from '@/server/tenant'
import { isModuleEnabled } from '@/server/adminModules'
import { ModuleDisabled } from '@/components/admin/ModuleDisabled'
import { GiftIcon } from '@heroicons/react/24/outline'
import CouponManager from './CouponManager'

export default async function CouponsPage() {
  const tenantId = await resolveTenantIdFromRequest()
  
  // Check if coupon module is enabled
  const allowed = tenantId ? await isModuleEnabled(tenantId, 'coupons') : false
  
  if (!allowed) {
    return (
      <ModuleDisabled
        moduleName="Coupons"
        moduleDescription="Create and manage discount codes for your customers"
        moduleIcon={GiftIcon}
      />
    )
  }

  return <CouponManager />
}