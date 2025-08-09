import SiteHeaderCore from '@/components/SiteHeader'
import SiteFooterCore from '@/components/SiteFooter'
import BreadcrumbCore from '@/components/Breadcrumb'

// For now, Bluebell uses shared components. This file becomes the single place
// to switch to tenant-specific overrides later without touching pages.

export function getHeaderComponent(tenantKey: string) {
  switch (tenantKey) {
    case 'bluebell':
      return SiteHeaderCore
    default:
      return SiteHeaderCore
  }
}

export function getFooterComponent(tenantKey: string) {
  switch (tenantKey) {
    case 'bluebell':
      return SiteFooterCore
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

const defaultConfig: TenantConfig = {
  key: 'default',
  theme: { colors: { primary: '#1f3a8a', accent: '#1f3a8a', white: '#ffffff' } },
  homepage: { sections: [] },
  overrides: {},
  enabledModules: [],
}

export function getTenantConfig(tenantKey: string): TenantConfig {
  switch (tenantKey) {
    case 'bluebell': return bluebellConfig
    default: return defaultConfig
  }
}


