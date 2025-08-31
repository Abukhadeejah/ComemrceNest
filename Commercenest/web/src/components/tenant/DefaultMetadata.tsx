import { Metadata } from 'next'

export const defaultMetadata: Metadata = {
  title: {
    default: 'CommerceNest - Multi-tenant Platform',
    template: '%s | CommerceNest'
  },
  description: 'Multi-tenant e-commerce platform serving multiple brands and businesses.',
  keywords: ['e-commerce', 'multi-tenant', 'platform', 'shopping'],
  authors: [{ name: 'CommerceNest' }],
  creator: 'CommerceNest',
  publisher: 'CommerceNest',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://commercenest.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://commercenest.com',
    title: 'CommerceNest - Multi-tenant Platform',
    description: 'Multi-tenant e-commerce platform serving multiple brands and businesses.',
    siteName: 'CommerceNest',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CommerceNest - Multi-tenant Platform',
    description: 'Multi-tenant e-commerce platform serving multiple brands and businesses.',
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
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.svg' },
    ],
  },
  manifest: '/manifest.webmanifest',
}

export function getPageMetadata(pageTitle?: string, pageDescription?: string): Metadata {
  return {
    ...defaultMetadata,
    title: pageTitle ? `${pageTitle} | CommerceNest` : defaultMetadata.title,
    description: pageDescription || defaultMetadata.description,
    openGraph: {
      ...defaultMetadata.openGraph,
      title: pageTitle ? `${pageTitle} | CommerceNest` : defaultMetadata.openGraph?.title,
      description: pageDescription || defaultMetadata.openGraph?.description,
    },
    twitter: {
      ...defaultMetadata.twitter,
      title: pageTitle ? `${pageTitle} | CommerceNest` : defaultMetadata.twitter?.title,
      description: pageDescription || defaultMetadata.twitter?.description,
    },
  }
}




























