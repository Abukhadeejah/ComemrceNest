import { ReactNode } from 'react'

export interface AdminBrandingProps {
  children: ReactNode
}

export const adminBrandingConfig = {
  // Brand colors
  primaryColor: '#6b7280', // Gray
  secondaryColor: '#374151', // Dark gray
  accentColor: '#1f2937', // Very dark gray
  
  // Brand information
  brandName: 'CommerceNest',
  brandTagline: 'Multi-tenant Platform',
  brandLogo: '/favicon.svg',
  
  // Admin panel customization
  sidebarBg: 'bg-gradient-to-b from-gray-50 to-gray-100',
  headerBg: 'bg-white border-b border-gray-200',
  primaryButtonClass: 'bg-gray-600 hover:bg-gray-700 text-white',
  secondaryButtonClass: 'bg-gray-500 hover:bg-gray-600 text-white',
  
  // Module-specific styling
  moduleIcons: {
    products: '📦',
    categories: '📂',
    orders: '📋',
    customers: '👥',
    analytics: '📊',
    content: '📝',
    settings: '⚙️',
  },
  
  // Welcome message
  welcomeMessage: 'Welcome to CommerceNest Admin - Platform Management',
  
  // Custom CSS classes
  customClasses: {
    sidebar: 'default-admin-sidebar',
    header: 'default-admin-header',
    dashboard: 'default-admin-dashboard',
  }
}

export default function AdminBranding({ children }: AdminBrandingProps) {
  return (
    <div className="default-admin-wrapper bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {children}
    </div>
  )
}
