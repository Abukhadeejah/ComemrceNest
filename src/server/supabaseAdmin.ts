import { createClient, SupabaseClient } from '../../node_modules/@supabase/supabase-js/dist/index.mjs'
import { Database } from '../types/supabase'

let cachedSupabaseAdmin: SupabaseClient | null = null

function createSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase admin environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (!cachedSupabaseAdmin) {
    cachedSupabaseAdmin = createSupabaseAdminClient()
  }

  return cachedSupabaseAdmin
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseAdminClient() as object, prop, receiver)
  },
}) as SupabaseClient


