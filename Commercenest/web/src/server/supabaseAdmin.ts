import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

export const hasSupabaseEnv = Boolean(url && key)

export const supabaseAdmin: SupabaseClient | null = hasSupabaseEnv
  ? createClient(url as string, key as string, { auth: { persistSession: false } })
  : null


