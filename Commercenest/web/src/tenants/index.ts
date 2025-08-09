import type { TenantConfig } from './types'
import { bluebellConfig } from './bluebell/config'

const defaultConfig: TenantConfig = {
  key: 'default',
  theme: { colors: { primary: '#1f3a8a', accent: '#1f3a8a', white: '#ffffff' } },
  homepage: { sections: ['Hero','Services','FeaturedProjects','ProductTeaser','Testimonials','ClientLogos','CtaBand'] },
  overrides: {},
  enabledModules: [],
}

export function getTenantConfig(tenantKey: string): TenantConfig {
  switch (tenantKey) {
    case 'bluebell': return bluebellConfig
    default: return defaultConfig
  }
}


