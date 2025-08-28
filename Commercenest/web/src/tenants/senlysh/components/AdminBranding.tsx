import { ReactNode } from 'react'

export interface AdminBrandingProps {
  children: ReactNode
}

export const adminBrandingConfig = {
  // Brand colors
  primaryColor: '#06b6d4', // Cyan
  secondaryColor: '#f59e0b', // Amber
  accentColor: '#ec4899', // Pink
  
  // Brand information
  brandName: 'Senlysh',
  brandTagline: 'Premium Fashion & Lifestyle',
  brandLogo: '/images/senlysh/logo.png',
  
  // Admin panel customization
  sidebarBg: 'bg-gradient-to-b from-cyan-50 to-cyan-100',
  headerBg: 'bg-white border-b border-cyan-200',
  primaryButtonClass: 'bg-cyan-500 hover:bg-cyan-600 text-white',
  secondaryButtonClass: 'bg-amber-500 hover:bg-amber-600 text-white',
  
  // Module-specific styling
  moduleIcons: {
    products: '🛍️',
    categories: '📂',
    orders: '📦',
    customers: '👥',
    analytics: '📊',
    content: '📝',
    settings: '⚙️',
  },
  
  // Welcome message
  welcomeMessage: 'Welcome to Senlysh Admin - Manage your fashion empire',
  
  // Custom CSS classes
  customClasses: {
    sidebar: 'senlysh-admin-sidebar',
    header: 'senlysh-admin-header',
    dashboard: 'senlysh-admin-dashboard',
  }
}

export default function AdminBranding(props: AdminBrandingProps | null | undefined) {
  const { children } = props || {}
  return (
    <div className="senlysh-admin-wrapper bg-gradient-to-br from-cyan-50 to-cyan-100 min-h-screen">
      {children}
    </div>
  )
}
