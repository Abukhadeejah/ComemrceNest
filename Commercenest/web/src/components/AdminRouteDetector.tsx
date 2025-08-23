'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface AdminRouteDetectorProps {
  children: ReactNode
  adminContent: ReactNode
}

export function AdminRouteDetector({ children, adminContent }: AdminRouteDetectorProps) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  if (isAdminRoute) {
    return <>{adminContent}</>
  }

  return <>{children}</>
}
