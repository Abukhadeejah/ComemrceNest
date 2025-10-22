import type { TenantConfig } from '../types'

export const bluebellConfig: TenantConfig = {
  key: 'bluebell',
  brand: {
    name: 'Bluebell Interiors Studio LLP',
    tagline: 'Creating beautiful interiors with premium fabrics since 1985',
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
  },
  pricing: {
    gstRatePercent: 18,
  },
}

// Export WhatsApp number with optional chaining and nullish coalescing
// This safely handles if contact or whatsapp is undefined
export const WHATSAPP_NUMBER = bluebellConfig.content.contact?.whatsapp ?? '919876543210'
