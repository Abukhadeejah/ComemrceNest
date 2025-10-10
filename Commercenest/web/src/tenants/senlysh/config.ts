import type { TenantConfig } from '../types'

export const senlyshConfig: TenantConfig = {
  key: 'senlysh',
  brand: {
    name: 'Senlysh',
    tagline: 'Your destination for fashion-forward clothing and accessories',
  },
  theme: {
    colors: {
      primary: '#00BCD4', // Teal (matching Autumn demo)
      accent: '#FF8C42', // Orange accent (Autumn theme)
      white: '#FFFFFF',
      mustard: '#FFD93D', // Golden yellow
      crimson: '#FF4757', // Bright red
      brown: '#2F2E41', // Dark navy
    },
    fonts: {
      heading: 'Playfair Display, serif',
      body: 'Inter, sans-serif',
    },
  },
  navigation: {
    mainMenu: [
      { label: 'Home', href: '/' },
      { label: 'Shop', href: '/products' },
      { label: 'Collection', href: '/categories' },
      { label: 'Blog', href: '/blog' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
    footerLinks: {
      quickLinks: [
        { label: 'Products', href: '/products' },
        { label: 'Categories', href: '/categories' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
      customerService: [
        { label: 'Shipping Info', href: '/shipping' },
        { label: 'Returns', href: '/returns' },
        { label: 'Size Guide', href: '/size-guide' },
        { label: 'FAQ', href: '/faq' },
      ],
      social: [
        { platform: 'Facebook', url: '#', icon: '📘' },
        { platform: 'Instagram', url: '#', icon: '📷' },
        { platform: 'Twitter', url: '#', icon: '🐦' },
      ],
    },
  },
  content: {
    homepage: {
      sections: ['Hero', 'FeaturedCollections', 'MidBanner', 'Testimonials', 'Newsletter'],
      copy: {
        heroHeadline: 'Autumn Collection',
        heroSubcopy: 'Discover the latest trends in fashion with our curated autumn collection.',
        midBannerTitle: 'Autumn Time',
        midBannerSubcopy: 'Embrace the season with our exclusive autumn collection.',
      },
    },
    contact: {
      address: '123 Fashion Street, Mumbai, 400001',
      phone: '+91 98765-43210',
      email: 'hello@senlysh.com',
    },
  },
  features: {
    enabledModules: ['products', 'categories', 'reviews'],
  },
  pricing: {
    gstRatePercent: 12,
  },
}
