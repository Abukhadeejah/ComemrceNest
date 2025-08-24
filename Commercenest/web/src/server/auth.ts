import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/server/supabaseAdmin'

export async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = createServerComponentClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
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
  if (!member || member.role !== 'tenant_admin') throw new Error('forbidden')
  return userId
}


