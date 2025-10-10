import { supabaseAdmin } from '@/server/supabaseAdmin'

export type CompanyProfile = {
  id: string
  tenant_id: string
  name: string
  logo_url: string | null
  brand_accent_hex: string | null
}

export async function fetchCompanyProfileByTenantId(tenantId: string) {
  return supabaseAdmin
    .from('settings_company_profile')
    .select('id, tenant_id, name, logo_url, brand_accent_hex')
    .eq('tenant_id', tenantId)
    .maybeSingle()
}


