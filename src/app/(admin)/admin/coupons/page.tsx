import { resolveTenantIdFromRequest } from '@/server/tenant'
import { isModuleEnabled } from '@/server/adminModules'
import { ModuleDisabled } from '@/components/admin/ModuleDisabled'
import { GiftIcon } from '@heroicons/react/24/outline'
import CouponsPageContent from './CouponsPageContent'

export default async function CouponsPage() {
  const tenantId = await resolveTenantIdFromRequest()
  
  // Gate route by module
  const allowed = tenantId ? await isModuleEnabled(tenantId, 'coupons') : false
  if (!allowed) {
    return (
      <ModuleDisabled
        moduleName="Coupons"
        moduleDescription="Create and manage discount codes for your customers with flexible rules and usage limits."
        moduleIcon={GiftIcon}
      />
    )
  }

  return <CouponsPageContent />
}
