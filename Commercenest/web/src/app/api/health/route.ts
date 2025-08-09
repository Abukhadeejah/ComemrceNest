import { NextResponse } from 'next/server'
import { supabaseAdmin, hasSupabaseEnv } from '@/server/supabaseAdmin'

export async function GET(request: Request) {
  const rawHost = request.headers.get('x-tenant-host') || request.headers.get('host') || ''
  const host = rawHost.split(':')[0] // normalize: strip port
  let tenantResolved = false
  let tenantId: string | null = null
  if (host && hasSupabaseEnv && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from('tenant_domains')
      .select('tenant_id, hostname')
      .eq('hostname', host)
      .maybeSingle()
    if (data?.tenant_id) {
      tenantResolved = true
      tenantId = data.tenant_id
    }
  }
  return NextResponse.json({ ok: true, host, tenantResolved, tenantId })
}


