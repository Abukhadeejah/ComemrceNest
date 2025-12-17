export type TenantConfig = {
  key: string
  // Brand identity
  brand: {
    name: string
    tagline?: string
    logo?: string
    favicon?: string
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
      whatsapp?: string  // WhatsApp number for product inquiries
    }
  }
  // Feature flags
  features: {
    enabledModules: string[]
    customComponents?: Record<string, React.ComponentType<unknown>>
    // E-COMMERCE FEATURE FLAGS - NEWLY ADDED
    ecommerce?: {
      enabled?: boolean              // Master toggle for e-commerce
      showPrices?: boolean           // Show/hide product prices
      showAddToCart?: boolean        // Show/hide "Add to Cart" buttons
      showBuyNow?: boolean           // Show/hide "Buy Now" buttons
      showCart?: boolean             // Show/hide cart icon in header
      showCartPage?: boolean         // Enable/disable cart page
      showCheckout?: boolean         // Enable/disable checkout
      showWishlist?: boolean         // Show/hide wishlist features
      showStock?: boolean            // Show/hide stock information
      contactMethod?: string         // Contact method (e.g., 'whatsapp', 'email')
    }
  }
  // Pricing and taxation (tenant-specific)
  pricing?: {
    gstRatePercent?: number
  }
  // Payment provider configuration (tenant-specific)
  payments?: {
    provider: 'razorpay' | 'phonepe' | 'juspay'
    config?: {
      // PhonePe specific
      merchantId?: string
      saltKey?: string
      saltIndex?: string
      // Razorpay specific
      keyId?: string
      keySecret?: string
    }
  }
}
