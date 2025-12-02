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
        try {
          const cookies = document.cookie.split(';')
          return cookies
            .filter(c => c.trim())
            .map(c => {
              const [name, ...valueParts] = c.split('=')
              const value = valueParts.join('=')
              return { name: name.trim(), value: value.trim() }
            })
            .filter(c => {
              // Filter out corrupted cookies that start with invalid patterns
              if (c.value.startsWith('base64-')) {
                console.warn(`Removing corrupted cookie: ${c.name}`)
                // Delete the corrupted cookie
                document.cookie = `${c.name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
                return false
              }
              return true
            })
        } catch (error) {
          console.error('Error parsing cookies:', error)
          return []
        }
      },
      setAll(cookiesToSet) {
        if (typeof document === 'undefined') return
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieString = `${name}=${value}; path=${options?.path ?? '/'}; max-age=${options?.maxAge ?? 3600}; SameSite=Lax`
            document.cookie = cookieString
          })
        } catch (error) {
          console.error('Error setting cookies:', error)
        }
      },
    },
  })

  return client
}

// Export for backward compatibility
export const supabaseClient = getSupabaseClient()

// Utility to clear corrupted cookies
export function clearCorruptedCookies() {
  if (typeof document === 'undefined') return
  
  const cookies = document.cookie.split(';')
  cookies.forEach(cookie => {
    const [name, ...valueParts] = cookie.split('=')
    const value = valueParts.join('=').trim()
    
    // Clear cookies with corrupted patterns
    if (value.startsWith('base64-') || value.includes('\\x')) {
      const cookieName = name.trim()
      console.log(`Clearing corrupted cookie: ${cookieName}`)
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }
  })
}

// Auto-clear corrupted cookies on load
if (typeof window !== 'undefined') {
  clearCorruptedCookies()
}
