 
import { supabaseAdmin } from '@/server/supabaseAdmin'

export async function fetchPublishedProducts(tenantId: string) {
  return supabaseAdmin
    .from('products')
    .select('id, name, slug, price_cents, currency, hero_image_url')
    .eq('tenant_id', tenantId)
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
}


