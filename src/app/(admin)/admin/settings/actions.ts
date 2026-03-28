import { resolveTenantIdFromRequest } from '@/server/tenant'
import { assertTenantAdmin } from '@/server/auth'
import { supabaseAdmin } from '@/server/supabaseAdmin'

export async function getSettings() {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return {
        name: '',
        logo_url: '',
        address: '',
        phone: '',
        email: '',
        gstin: '',
        social: {},
        brand_accent_hex: '#C9A227',
        brand_neutrals: []
      }
    }
    try {
      await assertTenantAdmin(tenantId)
    } catch {
      // Graceful empty settings when not authenticated as tenant admin
      return {
        name: '',
        logo_url: '',
        address: '',
        phone: '',
        email: '',
        gstin: '',
        social: {},
        brand_accent_hex: '#C9A227',
        brand_neutrals: []
      }
    }

    const { data: settings, error } = await supabaseAdmin
      .from('settings_company_profile')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (error) {
      // Return safe defaults on database error to avoid crashing the page
      return {
        name: '',
        logo_url: '',
        address: '',
        phone: '',
        email: '',
        gstin: '',
        social: {},
        brand_accent_hex: '#C9A227',
        brand_neutrals: []
      }
    }

    return settings || {
      name: '',
      logo_url: '',
      address: '',
      phone: '',
      email: '',
      gstin: '',
      social: {},
      brand_accent_hex: '#C9A227',
      brand_neutrals: []
    }
  } catch (error) {
    console.error('getSettings error:', error)
    // Final safety: return defaults rather than throwing to keep UI functional
    return {
      name: '',
      logo_url: '',
      address: '',
      phone: '',
      email: '',
      gstin: '',
      social: {},
      brand_accent_hex: '#C9A227',
      brand_neutrals: []
    }
  }
}

export async function updateSettings(formData: FormData) {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) { throw new Error('Tenant not found') }
    await assertTenantAdmin(tenantId)

    const settings = {
      name: formData.get('name') as string,
      logo_url: formData.get('logo_url') as string,
      address: formData.get('address') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      gstin: formData.get('gstin') as string,
      brand_accent_hex: formData.get('brand_accent_hex') as string || '#C9A227'
    }

    const { error } = await supabaseAdmin
      .from('settings_company_profile')
      .upsert({
        tenant_id: tenantId,
        ...settings
      })

    if (error) {
      throw new Error(`Failed to update settings: ${error.message}`)
    }

    return { success: true }
  } catch (error) {
    console.error('updateSettings error:', error)
    throw error
  }
}







































