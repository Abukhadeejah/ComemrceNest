import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CommerceNest',
    short_name: 'CommerceNest',
    description: 'Multi-tenant e-commerce platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#01589D',
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { src: '/favicon.svg', type: 'image/svg+xml' }
    ]
  }
}




