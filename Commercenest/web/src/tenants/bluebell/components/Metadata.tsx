import { Metadata } from 'next'

export const defaultMetadata: Metadata = {
  title: {
    default: 'Bluebell Interiors - Premium Fabrics & Design',
    template: '%s | Bluebell Interiors'
  },
  description: 'Your premier destination for premium fabrics and interior design. Discover timeless elegance with our curated collection of upholstery, drapery, and decorative fabrics.',
  keywords: ['interior design', 'fabrics', 'upholstery', 'curtains', 'drapery', 'home decor', 'premium fabrics'],
  authors: [{ name: 'Bluebell Interiors' }],
  creator: 'Bluebell Interiors',
  publisher: 'Bluebell Interiors',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://bluebell.commercenest.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://bluebell.commercenest.com',
    title: 'Bluebell Interiors - Premium Fabrics & Design',
    description: 'Your premier destination for premium fabrics and interior design. Discover timeless elegance with our curated collection.',
    siteName: 'Bluebell Interiors',
    images: [
      {
        url: '/bluebell-hero.jpg',
        width: 1200,
        height: 630,
        alt: 'Bluebell Interiors Premium Fabrics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bluebell Interiors - Premium Fabrics & Design',
    description: 'Your premier destination for premium fabrics and interior design.',
    images: ['/bluebell-hero.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-bluebell.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/favicon-bluebell.svg' },
    ],
  },
  manifest: '/manifest.webmanifest',
}

export function getPageMetadata(pageTitle?: string, pageDescription?: string): Metadata {
  return {
    ...defaultMetadata,
    title: pageTitle ? `${pageTitle} | Bluebell Interiors` : defaultMetadata.title,
    description: pageDescription || defaultMetadata.description,
    openGraph: {
      ...defaultMetadata.openGraph,
      title: pageTitle ? `${pageTitle} | Bluebell Interiors` : defaultMetadata.openGraph?.title,
      description: pageDescription || defaultMetadata.openGraph?.description,
    },
    twitter: {
      ...defaultMetadata.twitter,
      title: pageTitle ? `${pageTitle} | Bluebell Interiors` : defaultMetadata.twitter?.title,
      description: pageDescription || defaultMetadata.twitter?.description,
    },
  }
}
