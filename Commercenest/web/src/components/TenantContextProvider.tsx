'use client'

import { TenantContext } from '@/hooks/useTenant'
import type { TenantConfig } from '@/tenants/types'

interface TenantContextProviderProps {
  config: TenantConfig
  children: React.ReactNode
}

export default function TenantContextProvider({ config, children }: TenantContextProviderProps) {
  return (
    <TenantContext.Provider value={config}>
      {children}
    </TenantContext.Provider>
  )
}
