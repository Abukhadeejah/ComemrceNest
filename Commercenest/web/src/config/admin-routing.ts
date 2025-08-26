// Admin routing configuration based on environment
export const ADMIN_ROUTING_CONFIG = {
  // Development environment - use simple /admin route
  development: {
    adminBasePath: '/admin',
    useTenantRoutes: false,
  },
  // Production environment - use tenant-specific routes
  production: {
    adminBasePath: '/[tenant]/admin',
    useTenantRoutes: true,
  }
}

// Get current environment
export function getCurrentEnvironment(): 'development' | 'production' {
  if (process.env.NODE_ENV === 'production') {
    return 'production'
  }
  return 'development'
}

// Get admin routing config for current environment
export function getAdminRoutingConfig() {
  const env = getCurrentEnvironment()
  return ADMIN_ROUTING_CONFIG[env]
}

// Generate admin URL based on environment and tenant
export function getAdminUrl(tenant?: string, path: string = ''): string {
  const config = getAdminRoutingConfig()
  
  if (config.useTenantRoutes && tenant) {
    return `/${tenant}/admin${path}`
  }
  
  return `/admin${path}`
}

// Check if current route is a tenant admin route
export function isTenantAdminRoute(pathname: string): boolean {
  return pathname.match(/\/[^\/]+\/admin/) !== null
}

// Extract tenant from admin route
export function extractTenantFromAdminRoute(pathname: string): string | null {
  const match = pathname.match(/^\/([^\/]+)\/admin/)
  return match ? match[1] : null
}











