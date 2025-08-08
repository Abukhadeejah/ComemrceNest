import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) redirect('/login')

  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    redirect('/login')
  }
  if (!user) redirect('/login')

  // Use service-role to read membership to avoid self-referential RLS issues
  const { data: member } = await supabaseAdmin
    .from('tenant_members')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member || member.role !== 'tenant_admin') redirect('/login')

  return (
    <>
      <div className="flex items-center justify-between border-b px-6 py-3 text-sm">
        <div>Tenant: <code>{tenantId}</code></div>
        <form action="/api/auth/signout" method="post">
          <button className="rounded bg-neutral-800 px-3 py-1.5 text-white">Sign out</button>
        </form>
      </div>
      {children}
    </>
  )
}


