import type { TenantConfig } from '../types'

export const bluebellConfig: TenantConfig = {
  key: 'bluebell',
  brand: {
    name: 'Bluebell FABRICS',
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
      phone: '(+91) 98765-43210',
      email: 'hello@bluebellFabrics.com',
    },
  },
  features: {
    enabledModules: ['products','portfolio'],
  },
  pricing: {
    gstRatePercent: 18,
  },
}


