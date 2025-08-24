// Utility function to generate correct admin URLs based on tenant and environment
export function getAdminUrl(path: string, tenant?: string): string {
  // In development, use the old /admin route
  if (process.env.NODE_ENV === 'development') {
    return `/admin${path}`
  }
  
  // In production, use tenant-specific routes
  if (tenant) {
    return `/${tenant}/admin${path}`
  }
  
  // Fallback to senlysh for production
  return `/senlysh/admin${path}`
}

// Common admin URL patterns
export const ADMIN_URLS = {
  products: (tenant?: string) => getAdminUrl('/products', tenant),
  productsNew: (tenant?: string) => getAdminUrl('/products/new', tenant),
  productDetail: (id: string, tenant?: string) => getAdminUrl(`/products/${id}`, tenant),
  productEdit: (id: string, tenant?: string) => getAdminUrl(`/products/${id}/edit`, tenant),
  orders: (tenant?: string) => getAdminUrl('/orders', tenant),
  customers: (tenant?: string) => getAdminUrl('/customers', tenant),
  settings: (tenant?: string) => getAdminUrl('/settings', tenant),
}

