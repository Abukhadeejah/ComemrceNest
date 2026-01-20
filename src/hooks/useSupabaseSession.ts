'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface User {
  id: string
  email?: string
}

interface AuthSession {
  user?: User
}

export function useSupabaseSession() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables not configured')
      setLoading(false)
      return
    }

    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          setSession({
            user: {
              id: session.user.id,
              email: session.user.email,
            },
          })
        } else {
          setSession(null)
        }
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error getting session:', error)
        setSession(null)
        setLoading(false)
      })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSession({
          user: {
            id: session.user.id,
            email: session.user.email,
          },
        })
      } else {
        setSession(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { data: session, loading }
}
