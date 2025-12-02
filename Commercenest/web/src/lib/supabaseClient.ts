'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// One-time cleanup of legacy auth-helpers cookies
if (typeof window !== 'undefined' && !sessionStorage.getItem('auth_migrated_to_ssr')) {
  try {
    // Clear all Supabase auth cookies from old auth-helpers package
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=')
      const cookieName = name.trim()
      if (cookieName.startsWith('sb-')) {
        // Clear cookie for all paths and domains
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      }
    })
    sessionStorage.setItem('auth_migrated_to_ssr', 'true')
    console.log('✅ Migrated from auth-helpers to SSR - old cookies cleared')
  } catch (error) {
    console.warn('Cookie cleanup failed:', error)
  }
}

// Singleton instance to prevent multiple GoTrueClient instances
let client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getSupabaseClient() {
  if (client) return client

  // Use default Supabase SSR cookie handling
  client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

  return client
}

// Export for backward compatibility
export const supabaseClient = getSupabaseClient()
