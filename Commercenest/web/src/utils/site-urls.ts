// Tenant-aware site URL helpers for public routes

function readTenantMode(): 'host' | 'path' | undefined {
  if (typeof document === 'undefined') return undefined;
  const cookies = document.cookie || '';
  const mode = /(?:^|; )tenant_mode=([^;]+)/.exec(cookies)?.[1];
  return (mode === 'host' || mode === 'path') ? (mode as 'host' | 'path') : undefined;
}

export function getSiteUrl(path: string, tenant?: string): string {
  const mode = readTenantMode();
  if (mode === 'host') {
    return path.startsWith('/') ? path : `/${path}`;
  }
  if (tenant) {
    const p = path.startsWith('/') ? path : `/${path}`;
    return `/${tenant}${p}`;
  }
  return path.startsWith('/') ? path : `/${path}`;
}

export const SITE_URLS = {
  home: (tenant?: string) => getSiteUrl('/', tenant),
  products: (tenant?: string) => getSiteUrl('/products', tenant),
  productDetail: (slug: string, tenant?: string) => getSiteUrl(`/products/${slug}`, tenant),
  cart: (tenant?: string) => getSiteUrl('/cart', tenant),
  checkout: (tenant?: string) => getSiteUrl('/checkout', tenant),
  about: (tenant?: string) => getSiteUrl('/about', tenant),
  contact: (tenant?: string) => getSiteUrl('/contact', tenant),
};


