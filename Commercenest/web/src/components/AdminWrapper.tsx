'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface AdminWrapperProps {
  children: ReactNode
}

export function AdminWrapper({ children }: AdminWrapperProps) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  if (isAdminRoute) {
    return <>{children}</>
  }

  return <>{children}</>
}

