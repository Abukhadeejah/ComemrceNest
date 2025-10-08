import { Metadata } from 'next'

export const defaultMetadata: Metadata = {
  title: {
    default: 'Senlysh - Premium Fashion & Lifestyle',
    template: '%s | Senlysh'
  },
  description: 'Your premier destination for fashion and lifestyle. Discover the latest trends in clothing, accessories, and more with exclusive deals and premium quality.',
  keywords: ['fashion', 'clothing', 'accessories', 'shoes', 'lifestyle', 'trends', 'shopping'],
  authors: [{ name: 'Senlysh' }],
  creator: 'Senlysh',
  publisher: 'Senlysh',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://senlysh.commercenest.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://senlysh.commercenest.com',
    title: 'Senlysh - Premium Fashion & Lifestyle',
    description: 'Your premier destination for fashion and lifestyle. Discover the latest trends in clothing, accessories, and more.',
    siteName: 'Senlysh',
    images: [
      {
        url: '/images/senlysh/hero-collection.jpg',
        width: 1200,
        height: 630,
        alt: 'Senlysh Fashion Collection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Senlysh - Premium Fashion & Lifestyle',
    description: 'Your premier destination for fashion and lifestyle.',
    images: ['/images/senlysh/hero-collection.jpg'],
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
      { url: '/favicon-senlysh.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/favicon-senlysh.svg' },
    ],
  },
  manifest: '/manifest.webmanifest',
}

export function getPageMetadata(pageTitle?: string, pageDescription?: string): Metadata {
  return {
    ...defaultMetadata,
    title: pageTitle ? `${pageTitle} | Senlysh` : defaultMetadata.title,
    description: pageDescription || defaultMetadata.description,
    openGraph: {
      ...defaultMetadata.openGraph,
      title: pageTitle ? `${pageTitle} | Senlysh` : defaultMetadata.openGraph?.title,
      description: pageDescription || defaultMetadata.openGraph?.description,
    },
    twitter: {
      ...defaultMetadata.twitter,
      title: pageTitle ? `${pageTitle} | Senlysh` : defaultMetadata.twitter?.title,
      description: pageDescription || defaultMetadata.twitter?.description,
    },
  }
}
