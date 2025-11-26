'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a Supabase client with proper cookie configuration for browser
export const supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
  cookies: {
    getAll() {
      if (typeof document === 'undefined') return []
      const cookies = document.cookie.split(';').map(c => c.trim())
      return cookies
        .filter(c => c)
        .map(c => {
          const [name, ...valueParts] = c.split('=')
          return { name: name.trim(), value: decodeURIComponent(valueParts.join('=').trim()) }
        })
    },
    setAll(cookiesToSet) {
      if (typeof document === 'undefined') return
      cookiesToSet.forEach(({ name, value, options }) => {
        const cookieString = `${name}=${encodeURIComponent(value)}; path=${options?.path ?? '/'}; max-age=${options?.maxAge ?? 3600}`
        document.cookie = cookieString
      })
    },
  },
})
