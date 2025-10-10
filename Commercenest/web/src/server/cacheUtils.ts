import { revalidateTag } from 'next/cache'
import { tenantProductsTag } from './cacheTags'

/**
 * Comprehensive cache invalidation for product-related operations
 * Ensures admins see immediate updates after product mutations
 */
export async function invalidateProductCaches(tenantId: string) {
  try {
    // Invalidate all product-related caches
    revalidateTag(tenantProductsTag(tenantId))
    revalidateTag('products')
    revalidateTag(`admin-products-${tenantId}`)
    revalidateTag(`tenant-${tenantId}`)
    
    console.log(`Cache invalidated for tenant ${tenantId}`)
  } catch (error) {
    console.error('Failed to invalidate product caches:', error)
    // Don't throw error as cache invalidation failure shouldn't break the operation
  }
}

/**
 * Force immediate cache invalidation with retry mechanism
 * Used for critical operations where cache must be cleared immediately
 */
export async function forceInvalidateProductCaches(tenantId: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await invalidateProductCaches(tenantId)
      console.log(`Cache invalidation successful on attempt ${i + 1}`)
      return
    } catch (error) {
      console.warn(`Cache invalidation attempt ${i + 1} failed:`, error)
      if (i === retries - 1) {
        console.error('All cache invalidation attempts failed')
      }
    }
  }
}
