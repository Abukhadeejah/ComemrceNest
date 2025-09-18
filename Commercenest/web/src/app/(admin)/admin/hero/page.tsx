import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { HeroManagement } from './HeroManagement'
import { adaptHeroSlides, adaptHeroSettings } from '@/utils/typeAdapters'

export default async function HeroPage() {
  const tenantId = await resolveTenantIdFromRequest()
  
  if (!tenantId) {
    throw new Error('Tenant not found')
  }

  // Fetch hero slides and settings
  const [{ data: heroSlides }, { data: heroSettings }] = await Promise.all([
    supabaseAdmin
      .from('hero_slides')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('position', { ascending: true }),
    supabaseAdmin
      .from('hero_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single()
  ])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hero Carousel Management</h1>
        <p className="text-gray-500">Manage your homepage hero carousel slides and settings</p>
      </div>

      <HeroManagement 
        initialSlides={adaptHeroSlides(heroSlides || [])} 
        initialSettings={heroSettings ? adaptHeroSettings(heroSettings) : null}
        tenantId={tenantId}
      />
    </div>
  )
}















