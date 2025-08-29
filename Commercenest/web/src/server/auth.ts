import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/server/supabaseAdmin'

function decodeJwtSubject(token: string): string | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8')) as { sub?: string }
    return payload.sub ?? null
  } catch {
    return null
  }
}

function extractAccessTokenFromCookie(rawValue: string): string | null {
  let candidate = rawValue
  try { candidate = decodeURIComponent(candidate) } catch {}

  // Strip wrapping quotes if present
  if (candidate.length > 1 && candidate.startsWith('"') && candidate.endsWith('"')) {
    candidate = candidate.slice(1, -1)
  }
  // Unescape any embedded quotes
  candidate = candidate.replace(/\\"/g, '"')

  // Try JSON first
  try {
    const parsed: any = JSON.parse(candidate)
    const token: string | undefined = parsed?.access_token || parsed?.currentSession?.access_token
    if (token) return token
  } catch {}

  // Try base64 -> JSON
  try {
    const b64 = candidate.replace(/^\s*"?|"?\s*$/g, '')
    const jsonStr = Buffer.from(b64, 'base64').toString('utf8')
    const parsed: any = JSON.parse(jsonStr)
    const token: string | undefined = parsed?.access_token || parsed?.currentSession?.access_token
    if (token) return token
  } catch {}

  // Fallback: regex extract from stringified JSON
  const match = candidate.match(/"access_token"\s*:\s*"([^"]+)"/)
  if (match && match[1]) return match[1]

  // Fallback: find any JWT-like substring
  const jwtMatch = candidate.match(/([A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+)/)
  if (jwtMatch && jwtMatch[1]) return jwtMatch[1]

  // If value itself looks like a JWT, accept it
  if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(candidate)) {
    return candidate
  }

  return null
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  // Fast-path: derive user id from Supabase auth cookie if present
  try {
    const authCookies = cookieStore.getAll().filter(c => /sb-.*-auth-token/.test(c.name))
    if (authCookies.length > 0) {
      // Combine chunked cookies if present (e.g., sb-...-auth-token.0, .1)
      const combined = authCookies
        .map(c => ({
          name: c.name,
          value: c.value,
          index: (() => { const m = c.name.match(/\.([0-9]+)$/); return m ? parseInt(m[1], 10) : 0 })()
        }))
        .sort((a, b) => a.index - b.index)
        .map(c => c.value)
        .join('')

      try {
        const raw = combined
        const accessToken = extractAccessTokenFromCookie(raw) || undefined
        const derivedUserId = accessToken ? decodeJwtSubject(accessToken) : undefined
        if (derivedUserId) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[AUTH] derived user from cookie')
          }
          return derivedUserId
        }
      } catch {
        // Not JSON or unexpected shape; fall through to Supabase client
      }
    }
  } catch {}
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (!url || !anon) return null

  const supabase = createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set() {},
      remove() {},
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.NODE_ENV !== 'production') {
    try {
      const cookieNames = cookieStore.getAll().map(c => c.name)
      console.log('[AUTH] cookies:', cookieNames)
      console.log('[AUTH] user present:', !!user)
    } catch {}
  }
  return user?.id ?? null
}

export async function hasAuthCookie(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    return cookieStore.getAll().some(c => /sb-.*-auth-token/.test(c.name))
  } catch {
    return false
  }
}

export async function assertTenantAdmin(tenantId: string): Promise<string> {
  const userId = await getAuthenticatedUserId()
  if (!userId) throw new Error('unauthenticated')
  const { data: member } = await supabaseAdmin
    .from('tenant_members')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .maybeSingle()
  if (process.env.NODE_ENV !== 'production') {
    console.log('[AUTH] assertTenantAdmin user:', userId, 'tenant:', tenantId, 'member:', member)
  }
  if (!member || member.role !== 'tenant_admin') throw new Error('forbidden')
  return userId
}


