import { ReactNode } from 'react'

export interface AdminBrandingProps {
  children: ReactNode
}

export const adminBrandingConfig = {
  // Brand colors
  primaryColor: '#1e40af', // Blue
  secondaryColor: '#d97706', // Orange
  accentColor: '#dc2626', // Red
  
  // Brand information
  brandName: 'Bluebell Interiors',
  brandTagline: 'Premium Fabrics & Design',
  brandLogo: '/bluebell-hero.jpg',
  
  // Admin panel customization
  sidebarBg: 'bg-gradient-to-b from-blue-50 to-blue-100',
  headerBg: 'bg-white border-b border-blue-200',
  primaryButtonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondaryButtonClass: 'bg-orange-500 hover:bg-orange-600 text-white',
  
  // Module-specific styling
  moduleIcons: {
    products: '🧵',
    categories: '📂',
    orders: '📦',
    customers: '👥',
    analytics: '📊',
    content: '📝',
    settings: '⚙️',
  },
  
  // Welcome message
  welcomeMessage: 'Welcome to Bluebell Interiors Admin - Manage your design portfolio',
  
  // Custom CSS classes
  customClasses: {
    sidebar: 'bluebell-admin-sidebar',
    header: 'bluebell-admin-header',
    dashboard: 'bluebell-admin-dashboard',
  }
}

export default function AdminBranding({ children }: AdminBrandingProps) {
  return (
    <div className="bluebell-admin-wrapper bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen">
      {children}
    </div>
  )
}
