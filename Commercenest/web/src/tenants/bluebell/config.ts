import type { TenantConfig } from '../types'

export const bluebellConfig: TenantConfig = {
  key: 'bluebell',
  brand: {
    name: 'Bluebell Interiors Studio LLP',
    tagline: 'Creating beautiful interiors with premium fabrics since 1985',
    favicon: '/favicon-bluebell.svg',
  },
  theme: {
    colors: {
      primary: '#01589D', 
      mustard: '#FDCE59', 
      white: '#FEFEFE', 
      crimson: '#DC2A38', 
      brown: '#4E302E', 
      accent: '#01589D',
    },
  },
  navigation: {
    mainMenu: [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: 'Portfolio', href: '/portfolio' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
    footerLinks: {
      quickLinks: [
        { label: 'Home', href: '/' },
        { label: 'Portfolio', href: '/portfolio' },
        { label: 'Products', href: '/products' },
        { label: 'Contact', href: '/contact' },
      ],
      customerService: [
        { label: 'Shipping Info', href: '/shipping' },
        { label: 'Returns', href: '/returns' },
        { label: 'Size Guide', href: '/size-guide' },
        { label: 'FAQ', href: '/faq' },
      ],
    },
  },
  content: {
    homepage: {
      sections: ['Hero','Services','FeaturedProjects','ProductTeaser','Testimonials','ClientLogos','CtaBand'],
      copy: {
        heroHeadline: 'Bluebell Interiors',
        heroSubcopy: 'Interior design, furnishings, and bespoke décor.',
      },
    },
    contact: {
      address: '123 Design Street New Delhi, 110001',
      phone: '(+91) 83838-58285',
      email: 'hello@bluebellFabrics.com',
      whatsapp: '918383858285',
    },
  },
  features: {
    enabledModules: ['products','portfolio'],
    // E-COMMERCE FEATURE FLAGS - NEW ADDITION
    ecommerce: {
      enabled: false,              // Master toggle - DISABLE all e-commerce
      showPrices: false,           // Hide prices (already working)
      showAddToCart: false,        // Hide "Add to Cart" buttons
      showBuyNow: false,           // Hide "Buy Now" buttons
      showCart: false,             // Hide cart icon in header
      showCartPage: false,         // Disable cart page
      showCheckout: false,         // Disable checkout
      showWishlist: false,         // Hide wishlist
      showStock: false,            // Hide stock info
      contactMethod: 'whatsapp',   // Use WhatsApp instead
    },
  },
  pricing: {
    gstRatePercent: 18,
  },
}

// Export WhatsApp number with optional chaining and nullish coalescing
export const WHATSAPP_NUMBER = bluebellConfig.content.contact?.whatsapp ?? '918383858285'

// Helper function to get WhatsApp link with custom message
export const getWhatsAppLink = (message?: string) => {
  const defaultMessage = message || 'Hi, I\'m interested in your products from Bluebell Interiors.'
  const encodedMessage = encodeURIComponent(defaultMessage)
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`
}

// Helper function to get product inquiry link
export const getProductInquiryLink = (productName: string) => {
  const message = `Hi, I'd like to inquire about: ${productName}`
  return getWhatsAppLink(message)
}

// Feature flag helpers for easy checking in components
export const isEcommerceEnabled = () => bluebellConfig.features.ecommerce?.enabled ?? false
export const shouldShowCart = () => bluebellConfig.features.ecommerce?.showCart ?? false
export const shouldShowPrices = () => bluebellConfig.features.ecommerce?.showPrices ?? false
export const shouldShowAddToCart = () => bluebellConfig.features.ecommerce?.showAddToCart ?? false
export const shouldShowBuyNow = () => bluebellConfig.features.ecommerce?.showBuyNow ?? false
export const shouldShowWishlist = () => bluebellConfig.features.ecommerce?.showWishlist ?? false
export const getContactMethod = () => bluebellConfig.features.ecommerce?.contactMethod ?? 'whatsapp'
