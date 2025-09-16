import { supabaseAdmin } from '@/server/supabaseAdmin'
import { isModuleEnabled } from '@/server/adminModules'

/**
 * Customer Module Management
 * Provides granular control over customer-related features
 */

export interface CustomerModuleConfig {
  registration: boolean
  addresses: boolean
  wallet: boolean
  coupons: boolean
  analytics: boolean
}

export interface ModulePricing {
  module_key: string
  tier: 'basic' | 'premium'
  price_monthly: number
  price_yearly: number
  features: string[]
  is_bundle?: boolean
  includes?: string[]
}

export interface ModuleRecommendation {
  module_key: string
  name: string
  description: string
  price: number
  priority: 'high' | 'medium' | 'low'
  reason: string
}

/**
 * Get customer module configuration for a tenant
 */
export async function getCustomerModuleConfig(tenantId: string): Promise<CustomerModuleConfig> {
  // Check all possible module combinations
  const [
    customerRegistration,
    customers,
    customerAddresses,
    customerWallet,
    customerCoupons,
    customerAnalytics,
    customersPremium
  ] = await Promise.all([
    isModuleEnabled(tenantId, 'customer_registration'),
    isModuleEnabled(tenantId, 'customers'),
    isModuleEnabled(tenantId, 'customer_addresses'),
    isModuleEnabled(tenantId, 'customer_wallet'),
    isModuleEnabled(tenantId, 'customer_coupons'),
    isModuleEnabled(tenantId, 'customer_analytics'),
    isModuleEnabled(tenantId, 'customers_premium')
  ])

  return {
    registration: customerRegistration || customers,
    addresses: customerAddresses || customers,
    wallet: customerWallet || customersPremium,
    coupons: customerCoupons || customersPremium,
    analytics: customerAnalytics || customersPremium
  }
}

/**
 * Check if a specific customer feature is enabled
 */
export async function isCustomerFeatureEnabled(
  tenantId: string, 
  feature: keyof CustomerModuleConfig
): Promise<boolean> {
  const config = await getCustomerModuleConfig(tenantId)
  return config[feature]
}

/**
 * Get available customer modules with pricing
 */
export async function getCustomerModulePricing(): Promise<ModulePricing[]> {
  const { data, error } = await supabaseAdmin
    .from('module_registry')
    .select('module_key, metadata')
    .or('module_key.like.customer_%,module_key.eq.customers,module_key.eq.customers_premium')

  if (error) {
    console.error('Error fetching customer module pricing:', error)
    return []
  }

  return data?.map(module => ({
    module_key: module.module_key,
    tier: module.metadata?.tier || 'basic',
    price_monthly: module.metadata?.price_monthly || 0,
    price_yearly: module.metadata?.price_yearly || 0,
    features: module.metadata?.features || [],
    is_bundle: module.metadata?.is_bundle || false,
    includes: module.metadata?.includes || []
  })) || []
}

/**
 * Get tenant's current customer module subscriptions
 */
export async function getTenantCustomerModules(tenantId: string) {
  const { data, error } = await supabaseAdmin
    .from('tenant_modules')
    .select('module_key, enabled, config, trial_started_at, trial_ends_at, active_until, billing_plan, billing_period, last_payment_at')
    .eq('tenant_id', tenantId)
    .or('module_key.like.customer_%,module_key.eq.customers,module_key.eq.customers_premium')

  if (error) {
    console.error('Error fetching tenant customer modules:', error)
    return []
  }

  return data || []
}

/**
 * Validate customer feature access with proper error messages
 */
export async function validateCustomerFeatureAccess(
  tenantId: string,
  feature: keyof CustomerModuleConfig,
  featureName: string
): Promise<{ allowed: boolean; error?: string; upgradeMessage?: string }> {
  const isEnabled = await isCustomerFeatureEnabled(tenantId, feature)
  
  if (isEnabled) {
    return { allowed: true }
  }

  // Dev fallback: if running locally/non-production OR explicit dev flag set, allow features
  // to facilitate development and demos without full module wiring.
  if (process.env.NODE_ENV !== 'production') {
    return { allowed: true }
  }

  // Additional fallback: if no customer modules are registered in the catalog OR explicit dev flag set,
  // allow the feature to facilitate local development and demos.
  // This avoids hard-blocking when the module registry hasn't been populated yet.
  if (process.env.NEXT_PUBLIC_ENABLE_CUSTOMER_FEATURES_DEV === 'true') {
    return { allowed: true }
  }

  const pricing = await getCustomerModulePricing()
  const moduleConfig = pricing.find(m => m.features.includes(featureName))
  
  if (moduleConfig) {
    return {
      allowed: false,
      error: `${featureName} module not enabled`,
      upgradeMessage: `This feature requires the ${moduleConfig.module_key} module (₹${moduleConfig.price_monthly}/month). Please contact support to upgrade your plan.`
    }
  }

  // If there are no customer modules at all in the registry, do not block in dev/staging.
  if (pricing.length === 0) {
    return { allowed: true }
  }

  return {
    allowed: false,
    error: 'Feature not available',
    upgradeMessage: 'This feature is not available. Please contact support for more information.'
  }
}

/**
 * Get customer module upgrade recommendations
 */
export async function getCustomerModuleRecommendations(tenantId: string): Promise<ModuleRecommendation[]> {
  const config = await getCustomerModuleConfig(tenantId)
  const pricing = await getCustomerModulePricing()
  const recommendations: ModuleRecommendation[] = []

  // Basic recommendations
  if (!config.registration) {
    const moduleConfig = pricing.find(m => m.module_key === 'customer_registration')
    if (moduleConfig) {
      recommendations.push({
        module_key: moduleConfig.module_key,
        name: 'Customer Registration',
        description: 'Allow customers to register and manage their accounts',
        price: moduleConfig.price_monthly,
        priority: 'high',
        reason: 'Essential for customer management'
      })
    }
  }

  if (!config.addresses) {
    const moduleConfig = pricing.find(m => m.module_key === 'customer_addresses')
    if (moduleConfig) {
      recommendations.push({
        module_key: moduleConfig.module_key,
        name: 'Address Management',
        description: 'Let customers manage their shipping addresses',
        price: moduleConfig.price_monthly,
        priority: 'medium',
        reason: 'Improves checkout experience'
      })
    }
  }

  // Premium recommendations
  if (!config.wallet) {
    const moduleConfig = pricing.find(m => m.module_key === 'customer_wallet')
    if (moduleConfig) {
      recommendations.push({
        module_key: moduleConfig.module_key,
        name: 'Digital Wallet',
        description: 'Offer cashback and digital wallet features',
        price: moduleConfig.price_monthly,
        priority: 'low',
        reason: 'Increase customer loyalty and retention'
      })
    }
  }

  return recommendations.sort((a, b) => {
    const priorityOrder: Record<'high' | 'medium' | 'low', number> = { 
      high: 3, 
      medium: 2, 
      low: 1 
    }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}
