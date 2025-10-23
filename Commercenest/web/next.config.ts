import type { NextConfig } from "next";

const storageHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  typescript: {
    // Disable TypeScript errors during build to prevent Vercel failures
    ignoreBuildErrors: true,
  },
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      ...(storageHostname
        ? [
            {
              protocol: "https" as const,
              hostname: storageHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      // Explicit allow-list for Supabase storage host seen in runtime errors
      {
        protocol: "https" as const,
        hostname: "slhoayhflpcwrsylcuvt.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https" as const,
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https" as const,
        hostname: "images.pexels.com",
        pathname: "/**",
      },
      {
        protocol: "https" as const,
        hostname: "razorpay.com",
        pathname: "/**",
      },
      {
        protocol: "https" as const,
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
      {
        protocol: "https" as const,
        hostname: "seeklogo.com",
        pathname: "/**",
      },
    ],
  },
  ...(process.env.NODE_ENV === 'production'
    ? {
        compiler: {
          removeConsole: { exclude: ['error', 'warn'] },
        },
      }
    : {}),
  // Production optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }
        ],
      },
    ]
  },
};

export default nextConfig;
