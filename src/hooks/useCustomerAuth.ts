'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

interface CustomerAuthState {
  user: User | null
  isLoading: boolean
  isCustomer: boolean
}

export function useCustomerAuth(): CustomerAuthState {
  const [authState, setAuthState] = useState<CustomerAuthState>({
    user: null,
    isLoading: true,
    isCustomer: false
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabaseClient.auth.getUser()
        
        if (error) {
          // Suppress "Auth session missing" errors - this is expected when not logged in
          if (!error.message?.includes('Auth session missing')) {
            console.error('[useCustomerAuth] Error:', error)
          }
          setAuthState({ user: null, isLoading: false, isCustomer: false })
          return
        }

        // Check if this is an admin user (should not be treated as customer)
        const emailToTenant: Record<string, string> = {
          'admin@bluebell.in': 'bluebell',
          'admin@senlysh.in': 'senlysh',
        }
        
        const isAdmin = user?.email && emailToTenant[user.email]
        const isCustomer = user && !isAdmin

        setAuthState({
          user,
          isLoading: false,
          isCustomer: Boolean(isCustomer)
        })
      } catch (error: any) {
        // Suppress "Auth session missing" errors - this is expected when not logged in
        if (!error?.message?.includes('Auth session missing')) {
          console.error('[useCustomerAuth] Auth check failed:', error)
        }
        setAuthState({ user: null, isLoading: false, isCustomer: false })
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        checkAuth()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return authState
}
