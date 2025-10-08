// Utility function to generate correct admin URLs based on tenant and environment
export function getAdminUrl(path: string, tenant?: string): string {
  // If middleware set host-based mode via cookie, prefer clean admin URLs
  if (typeof document !== 'undefined') {
    const cookies = document.cookie || '';
    const mode = /(?:^|; )tenant_mode=([^;]+)/.exec(cookies)?.[1];
    if (mode === 'host') {
      return `/admin${path}`;
    }
  }

  // Path-based fallback (staging/local)
  if (tenant) {
    return `/${tenant}/admin${path}`;
  }
  
  // If no tenant provided, we can't generate a valid URL
  // This should be handled by the calling component
  console.warn('getAdminUrl called without tenant parameter');
  return `/admin${path}`;
}

// Common admin URL patterns
export const ADMIN_URLS = {
  dashboard: (tenant?: string) => getAdminUrl('', tenant),
  products: (tenant?: string) => getAdminUrl('/products', tenant),
  productsNew: (tenant?: string) => getAdminUrl('/products/new', tenant),
  productDetail: (id: string, tenant?: string) => getAdminUrl(`/products/${id}`, tenant),
  productEdit: (id: string, tenant?: string) => getAdminUrl(`/products/${id}/edit`, tenant),
  categories: (tenant?: string) => getAdminUrl('/categories', tenant),
  categoriesNew: (tenant?: string) => getAdminUrl('/categories/new', tenant),
  categoryDetail: (id: string, tenant?: string) => getAdminUrl(`/categories/${id}`, tenant),
  categoryEdit: (id: string, tenant?: string) => getAdminUrl(`/categories/${id}/edit`, tenant),
  taxClasses: (tenant?: string) => getAdminUrl('/tax-classes', tenant),
  orders: (tenant?: string) => getAdminUrl('/orders', tenant),
  customers: (tenant?: string) => getAdminUrl('/customers', tenant),
  analytics: (tenant?: string) => getAdminUrl('/analytics', tenant),
  settings: (tenant?: string) => getAdminUrl('/settings', tenant),
  portfolio: (tenant?: string) => getAdminUrl('/portfolio', tenant),
  hero: (tenant?: string) => getAdminUrl('/hero', tenant),
  tutorial: (tenant?: string) => getAdminUrl('/tutorial', tenant),
}


