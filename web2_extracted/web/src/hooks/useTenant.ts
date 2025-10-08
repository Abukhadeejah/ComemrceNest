'use client'

import { useContext, createContext } from 'react'
import type { TenantConfig } from '@/tenants/types'

const TenantContext = createContext<TenantConfig | null>(null)

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}

export { TenantContext }
