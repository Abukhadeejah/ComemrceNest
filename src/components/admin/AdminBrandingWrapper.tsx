'use client'

import { ReactNode, createContext, useContext } from 'react'
import { usePathname } from 'next/navigation'
import type { TenantKey, AdminBrandingConfig } from '@/registry/types'

interface AdminBrandingWrapperProps {
  children: ReactNode
  tenantKey?: TenantKey
}

// Create context for admin tenant key
const AdminTenantContext = createContext<TenantKey | null>(null)

export default function AdminBrandingWrapper({ children, tenantKey }: AdminBrandingWrapperProps) {
  return (
    <AdminTenantContext.Provider value={tenantKey || null}>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </AdminTenantContext.Provider>
  )
}

// Hook to get branding config based on tenant
export function useAdminBranding(tenantKey?: TenantKey): AdminBrandingConfig | null {
  // Always call useAdminTenantKey to avoid conditional hook calls
  const contextTenant = useAdminTenantKey()
  const currentTenant = tenantKey || contextTenant
  
  if (!currentTenant) {
    return null
  }

  // Tenant-specific branding configurations
  const brandingConfigs: Record<string, AdminBrandingConfig> = {
    bluebell: {
      primaryColor: '#01589D', // Bluebell blue
      secondaryColor: '#4E302E', // Bluebell brown
      accentColor: '#FDCE59', // Bluebell mustard
      brandName: 'Bluebell Interiors',
      brandTagline: 'Timeless Interiors, Beautiful Fabrics',
      brandLogo: '/bluebell-logo.svg',
      sidebarBg: '#01589D',
      headerBg: '#4E302E',
      primaryButtonClass: 'bg-[#01589D] hover:bg-[#014a7a]',
      secondaryButtonClass: 'bg-[#4E302E] hover:bg-[#3d2624]'
    },
    senlysh: {
      primaryColor: '#8B5CF6', // Senlysh purple
      secondaryColor: '#1F2937', // Senlysh dark
      accentColor: '#F59E0B', // Senlysh gold
      brandName: 'Senlysh',
      brandTagline: 'Premium Fashion & Lifestyle',
      brandLogo: '/senlysh-logo.svg',
      sidebarBg: '#8B5CF6',
      headerBg: '#1F2937',
      primaryButtonClass: 'bg-[#8B5CF6] hover:bg-[#7C3AED]',
      secondaryButtonClass: 'bg-[#1F2937] hover:bg-[#111827]'
    }
  }

  return brandingConfigs[currentTenant] || {
    primaryColor: '#3B82F6',
    secondaryColor: '#6B7280',
    accentColor: '#F59E0B',
    brandName: 'CommerceNest Admin',
    brandTagline: 'Multi-tenant E-commerce Platform',
    brandLogo: '/logo.svg',
    sidebarBg: '#1F2937',
    headerBg: '#374151',
    primaryButtonClass: 'bg-blue-600 hover:bg-blue-700',
    secondaryButtonClass: 'bg-gray-600 hover:bg-gray-700'
  }
}

// Hook to get tenant key from context or URL
export function useAdminTenantKey(): string | undefined {
  const context = useContext(AdminTenantContext)
  const pathname = usePathname()
  
  // If context has tenant key, use it
  if (context) {
    return context
  }
  
  // Extract tenant from URL path
  const pathSegments = pathname.split('/')
  const tenantIndex = pathSegments.findIndex(segment => 
    ['bluebell', 'senlysh'].includes(segment)
  )
  
  if (tenantIndex !== -1) {
    return pathSegments[tenantIndex]
  }
  
  return undefined
}
