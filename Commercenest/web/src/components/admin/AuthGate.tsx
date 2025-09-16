"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [checking, setChecking] = useState(true)
  const [hasChecked, setHasChecked] = useState(false)
  const [_error, _setError] = useState<string | null>(null)

  useEffect(() => {
    // Only run auth check once
    if (hasChecked) return

    let isMounted = true
    let timeoutId: NodeJS.Timeout | undefined

    ;(async () => {
      try {
        console.log('[AuthGate] Starting auth check...')

        // Add timeout to prevent hanging
        const controller = new AbortController()
        timeoutId = setTimeout(() => {
          console.log('[AuthGate] Auth check timed out after 10 seconds')
          controller.abort()
        }, 10000) // 10 second timeout

        // HOLY_GRAIL:AUTHGATE_CHECK_START
        // Check both authentication AND tenant authorization
        const res = await fetch('/api/auth/check-tenant-access', {
          cache: 'no-store',
          credentials: 'include',
          signal: controller.signal
        })

        if (timeoutId) clearTimeout(timeoutId)

        console.log('[AuthGate] Auth check response:', res.status, res.ok)
        if (!isMounted) return

        // Success - user is authenticated and authorized
        if (res.ok) {
          console.log('[AuthGate] Authentication successful')
          setChecking(false)
          setHasChecked(true)
          return
        }

        // Handle specific error codes
        if (res.status === 403) {
          console.log('[AuthGate] Unauthorized for this tenant, redirecting to login')
          router.replace('/login')
          return
        }

        if (res.status === 401) {
          console.log('[AuthGate] Unauthenticated, redirecting to login')
          router.replace('/login')
          return
        }
        // HOLY_GRAIL:AUTHGATE_CHECK_END

        // For any other status, try client-side check
        console.log('[AuthGate] Server check failed, trying client-side check...')
        const { data: { user } } = await supabase.auth.getUser()
        if (!isMounted) return

        if (!user) {
          console.log('[AuthGate] No client user found, redirecting to login')
          router.replace('/login')
        } else {
          console.log('[AuthGate] Client user found, authentication successful')
          setChecking(false)
          setHasChecked(true)
        }

      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId)
        if (!isMounted) return

        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('[AuthGate] Auth check failed:', errorMessage)

        // Don't redirect on timeout or network errors - try client check first
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('[AuthGate] Request timed out, trying client check...')

          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!isMounted) return

            if (!user) {
              console.log('[AuthGate] No client user after timeout, redirecting to login')
              router.replace('/login')
            } else {
              console.log('[AuthGate] Client user found after timeout')
              setChecking(false)
              setHasChecked(true)
            }
          } catch (clientError) {
            console.error('[AuthGate] Client check also failed:', clientError)
            router.replace('/login')
          }
        } else {
          router.replace('/login')
        }
      } finally {
        if (!isMounted) return
        // Always ensure we don't get stuck on loader
        console.log('[AuthGate] Ensuring checking is set to false')
        setChecking(false)
      }
    })()

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [router, supabase, hasChecked]) // Include dependencies for proper cleanup

  if (checking) {
    console.log('[AuthGate] Still checking, rendering loading state')
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





