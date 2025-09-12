import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { HeroManagement } from './HeroManagement'

export default async function HeroPage() {
  const tenantId = await resolveTenantIdFromRequest()
  
  if (!tenantId) {
    throw new Error('Tenant not found')
  }

  // Fetch hero slides, settings, and available tags
  const [{ data: heroSlides }, { data: heroSettings }, { data: products }] = await Promise.all([
    supabaseAdmin
      .from('hero_slides')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('position', { ascending: true }),
    supabaseAdmin
      .from('hero_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single(),
    supabaseAdmin
      .from('products')
      .select('tags')
      .eq('tenant_id', tenantId)
      .not('tags', 'is', null)
  ])

  // Extract unique tags from products
  const availableTags = Array.from(
    new Set(
      products?.flatMap(product => product.tags || []) || []
    )
  ).sort()

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hero Carousel Management</h1>
        <p className="text-gray-500">Manage your homepage hero carousel slides and settings</p>
      </div>

      <HeroManagement 
        initialSlides={heroSlides || []} 
        initialSettings={heroSettings || null}
        tenantId={tenantId}
        availableTags={availableTags}
      />
    </div>
  )
}
