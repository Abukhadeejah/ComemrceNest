'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton instance to prevent multiple GoTrueClient instances
let client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getSupabaseClient() {
  if (client) return client

  client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        if (typeof document === 'undefined') return []
        const cookies = document.cookie.split(';')
        return cookies
          .filter(c => c.trim())
          .map(c => {
            const [name, ...valueParts] = c.split('=')
            const value = valueParts.join('=')
            // Don't decode here - Supabase will handle it
            return { name: name.trim(), value: value.trim() }
          })
      },
      setAll(cookiesToSet) {
        if (typeof document === 'undefined') return
        cookiesToSet.forEach(({ name, value, options }) => {
          // Don't encode here - Supabase already encodes it
          const cookieString = `${name}=${value}; path=${options?.path ?? '/'}; max-age=${options?.maxAge ?? 3600}; SameSite=Lax`
          document.cookie = cookieString
        })
      },
    },
  })

  return client
}

// Export for backward compatibility
export const supabaseClient = getSupabaseClient()
