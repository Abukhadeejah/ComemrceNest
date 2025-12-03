'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// REMOVED: Cookie cleanup that was interfering with valid SSR auth cookies
// The @supabase/ssr package handles cookie management automatically

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
