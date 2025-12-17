'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabaseClient'

interface CustomerAuthGateProps {
  children: React.ReactNode
  redirectTo?: string
}

export default function CustomerAuthGate({ children, redirectTo = '/login' }: CustomerAuthGateProps) {
  const router = useRouter()
  const supabase = supabaseClient
  const [checking, setChecking] = useState(true)
  const [hasChecked, setHasChecked] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only run auth check once
    if (hasChecked) return

    let isMounted = true
    let timeoutId: NodeJS.Timeout | undefined

    ;(async () => {
      try {
        console.log('[CustomerAuthGate] Starting customer auth check...')

        // Add timeout to prevent hanging
        const controller = new AbortController()
        timeoutId = setTimeout(() => {
          console.log('[CustomerAuthGate] Auth check timed out after 10 seconds')
          controller.abort()
        }, 10000) // 10 second timeout

        // Check if user is authenticated
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (timeoutId) clearTimeout(timeoutId)

        console.log('[CustomerAuthGate] Auth check response:', user ? 'authenticated' : 'not authenticated')
        if (!isMounted) return

        if (userError) {
          console.error('[CustomerAuthGate] Auth error:', userError)
          setError('Authentication error')
          setChecking(false)
          setHasChecked(true)
          return
        }

        if (!user) {
          console.log('[CustomerAuthGate] No user found, redirecting to login')
          router.replace(redirectTo)
          return
        }

        // Check if this is an admin user (should not access customer routes)
        const emailToTenant: Record<string, string> = {
          'admin@bluebell.in': 'bluebell',
          'admin@senlysh.in': 'senlysh',
        }
        
        const tenantKey = emailToTenant[user.email || '']
        if (tenantKey) {
          console.log('[CustomerAuthGate] Admin user detected, redirecting to admin')
          router.replace(`/${tenantKey}/admin`)
          return
        }

        // Success - user is authenticated as a customer
        console.log('[CustomerAuthGate] Customer authentication successful')
        setChecking(false)
        setHasChecked(true)

      } catch (error) {
        console.error('[CustomerAuthGate] Error during auth check:', error)
        if (timeoutId) clearTimeout(timeoutId)
        if (!isMounted) return
        
        setError('Authentication check failed')
        setChecking(false)
        setHasChecked(true)
      }
    })()

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [hasChecked, router, redirectTo, supabase.auth])

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <p className="text-gray-600">Verifying your account...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => router.replace(redirectTo)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-800 text-white font-semibold rounded-lg hover:from-gray-700 hover:to-gray-900 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
