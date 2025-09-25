export type TenantConfig = {
  key: string
  // Brand identity
  brand: {
    name: string
    tagline?: string
    logo?: string
  }
  // Theme configuration
  theme: {
    colors: {
      primary: string
      mustard?: string
      white?: string
      crimson?: string
      brown?: string
      accent?: string
    }
    fonts?: { heading?: string; body?: string }
  }
  // Navigation configuration
  navigation: {
    mainMenu: Array<{
      label: string
      href: string
      external?: boolean
    }>
    footerLinks?: {
      quickLinks?: Array<{ label: string; href: string }>
      customerService?: Array<{ label: string; href: string }>
      social?: Array<{ platform: string; url: string; icon?: string }>
    }
  }
  // Content configuration
  content: {
    homepage: {
      sections: string[]
      copy?: Record<string, unknown>
    }
    contact?: {
      address?: string
      phone?: string
      email?: string
    }
  }
  // Feature flags
  features: {
    enabledModules: string[]
    customComponents?: Record<string, React.ComponentType<unknown>>
  }
  // Pricing and taxation (tenant-specific)
  pricing?: {
    gstRatePercent?: number
  }
}


