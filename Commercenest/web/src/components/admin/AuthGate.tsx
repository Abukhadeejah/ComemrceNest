"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        // Check both authentication AND tenant authorization
        const res = await fetch('/api/auth/check-tenant-access', { cache: 'no-store', credentials: 'same-origin' })
        if (!isMounted) return
        
        if (res.ok) {
          setChecking(false)
          return
        }
        
        // If unauthorized for this tenant, redirect to login
        if (res.status === 403) {
          router.replace('/login')
          return
        }
        
        // If unauthenticated, redirect to login
        if (res.status === 401) {
          router.replace('/login')
          return
        }
        
        // Fallback to client check for other errors
        const { data: { user } } = await supabase.auth.getUser()
        if (!isMounted) return
        if (!user) router.replace('/login')
        else setChecking(false)
      } catch {
        if (!isMounted) return
        router.replace('/login')
      } finally {
        if (!isMounted) return
        // Ensure we don't get stuck on loader in edge cases
        setChecking(false)
      }
    })()
    return () => { isMounted = false }
  }, [router, supabase])

  if (checking) {
    return (
      <div className="min-h-[40vh] grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-indigo-600" />
          <p className="text-sm text-gray-600">Loading admin…</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}





