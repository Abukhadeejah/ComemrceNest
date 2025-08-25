import { supabaseAdmin } from '@/server/supabaseAdmin'

export async function fetchPublishedProjects(tenantId: string) {
  return supabaseAdmin
    .from('portfolio_projects')
    .select('id, title, slug, hero_image_url, featured, description, location')
    .eq('tenant_id', tenantId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
}

export async function fetchProjectBySlug(tenantId: string, slug: string) {
  return supabaseAdmin
    .from('portfolio_projects')
    .select('id, title, slug, hero_image_url, featured')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .maybeSingle()
}


