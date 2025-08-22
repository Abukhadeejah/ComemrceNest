import SiteHeaderCore from '@/components/SiteHeader'
import SiteFooterCore from '@/components/SiteFooter'
import BreadcrumbCore from '@/components/Breadcrumb'
import SenlyshFooter from './senlysh/SenlyshFooter'

// For now, Bluebell uses shared components. This file becomes the single place
// to switch to tenant-specific overrides later without touching pages.

export function getHeaderComponent(_tenantKey: string) {
  // All tenants use the same shared header component
  // Tenant-specific theming is handled via CSS variables and config
  return SiteHeaderCore
}

export function getFooterComponent(tenantKey: string) {
  // Senlysh uses custom footer, others use shared footer
  switch (tenantKey) {
    case 'senlysh':
      return SenlyshFooter
    default:
      return SiteFooterCore
  }
}

export function getBreadcrumbComponent(tenantKey: string) {
  switch (tenantKey) {
    case 'bluebell':
      return BreadcrumbCore
    default:
      return BreadcrumbCore
  }
}

import type { TenantConfig } from './types'
import { bluebellConfig } from './bluebell/config'
import { senlyshConfig } from './senlysh/config'

const defaultConfig: TenantConfig = {
  key: 'default',
  brand: {
    name: 'CommerceNest',
    tagline: 'Multi-tenant e-commerce platform',
  },
  theme: { 
    colors: { 
      primary: '#1f3a8a', 
      accent: '#1f3a8a', 
      white: '#ffffff' 
    } 
  },
  navigation: {
    mainMenu: [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
    ],
  },
  content: {
    homepage: {
      sections: [],
    },
  },
  features: {
    enabledModules: [],
  },
}

export function getTenantConfig(tenantKey: string): TenantConfig {
  switch (tenantKey) {
    case 'bluebell': return bluebellConfig
    case 'senlysh': return senlyshConfig
    default: return defaultConfig
  }
}


