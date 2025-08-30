import { getRegistryEntry } from '@/registry/tenantRegistry'
import type { TenantKey } from '@/registry/types'

interface TenantWelcomeBannerServerProps {
  tenantKey?: TenantKey
}

export default async function TenantWelcomeBannerServer({ tenantKey }: TenantWelcomeBannerServerProps) {
  try {
    const registryEntry = getRegistryEntry(tenantKey || 'default')
    const WelcomeBannerComponent = (await registryEntry.welcomeBanner()).default
    
    return <WelcomeBannerComponent />
  } catch (error) {
    console.error('[TenantWelcomeBannerServer] Failed to load welcome banner:', error)
    
    // Fallback to default
    try {
      const registryEntry = getRegistryEntry('default')
      const DefaultWelcomeBannerComponent = (await registryEntry.welcomeBanner()).default
      
      return <DefaultWelcomeBannerComponent />
    } catch (fallbackError) {
      console.error('[TenantWelcomeBannerServer] Failed to load default welcome banner:', fallbackError)
      return null
    }
  }
}



























