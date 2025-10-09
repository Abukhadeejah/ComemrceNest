'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface AdminWrapperProps {
  children: ReactNode
  tenantContent?: ReactNode
}

export function AdminWrapper({ children, tenantContent }: AdminWrapperProps) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  if (isAdminRoute) {
    return <>{children}</>
  }

  return <>{tenantContent || children}</>
}

