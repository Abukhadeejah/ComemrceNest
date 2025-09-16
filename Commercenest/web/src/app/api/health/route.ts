import { NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'

export async function GET(request: Request) {
  const rawHost = request.headers.get('x-tenant-host') || request.headers.get('host') || ''
  const host = rawHost.split(':')[0] // normalize: strip port
  
  // Use the same tenant resolution logic as the rest of the application
  const tenantId = await resolveTenantIdFromRequest()
  const tenantResolved = Boolean(tenantId)
  
  return NextResponse.json({ ok: true, host, tenantResolved, tenantId })
}


