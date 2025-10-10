'use server'

import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { assertTenantAdmin } from '@/server/auth'
import { revalidateTag } from 'next/cache'

interface HeroSlideData {
  id?: string
  title?: string
  subtitle?: string
  description?: string
  cta_text?: string
  cta_link?: string
  badge?: string
  sale_text?: string
  urgency_text?: string
  features?: string[]
  image_url?: string
  countdown?: boolean
  countdown_end?: string
  bg_overlay_class?: string
  position?: number
  is_active?: boolean
}

interface HeroSettingsData {
  auto_play?: boolean
  auto_play_interval_ms?: number
  bg_overlay_class?: string
}

export async function createHeroSlide(data: HeroSlideData) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) throw new Error('Tenant not found')
  
  await assertTenantAdmin(tenantId)

  // Clean up data: convert empty strings to null for timestamp fields
  const cleanedData = {
    ...data,
    countdown_end: data.countdown_end === '' ? null : data.countdown_end
  }

  const { data: slide, error } = await supabaseAdmin
    .from('hero_slides')
    .insert({
      tenant_id: tenantId,
      ...cleanedData
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create hero slide: ${error.message}`)
  }

  revalidateTag('hero-slides')
  return slide
}

export async function updateHeroSlide(id: string, data: HeroSlideData) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) throw new Error('Tenant not found')
  
  await assertTenantAdmin(tenantId)

  // Clean up data: convert empty strings to null for timestamp fields
  const cleanedData = {
    ...data,
    countdown_end: data.countdown_end === '' ? null : data.countdown_end
  }

  const { data: slide, error } = await supabaseAdmin
    .from('hero_slides')
    .update(cleanedData)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update hero slide: ${error.message}`)
  }

  revalidateTag('hero-slides')
  return slide
}

export async function deleteHeroSlide(id: string) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) throw new Error('Tenant not found')
  
  await assertTenantAdmin(tenantId)

  const { error } = await supabaseAdmin
    .from('hero_slides')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) {
    throw new Error(`Failed to delete hero slide: ${error.message}`)
  }

  revalidateTag('hero-slides')
}

export async function reorderHeroSlides(slideIds: string[]) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) throw new Error('Tenant not found')
  
  await assertTenantAdmin(tenantId)

  const updates = slideIds.map((id, index) => 
    supabaseAdmin
      .from('hero_slides')
      .update({ position: index })
      .eq('id', id)
      .eq('tenant_id', tenantId)
  )

  const results = await Promise.all(updates)
  
  for (const result of results) {
    if (result.error) {
      throw new Error(`Failed to reorder slides: ${result.error.message}`)
    }
  }

  revalidateTag('hero-slides')
}

export async function updateHeroSettings(data: HeroSettingsData) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) throw new Error('Tenant not found')
  
  await assertTenantAdmin(tenantId)

  const { data: settings, error } = await supabaseAdmin
    .from('hero_settings')
    .upsert({
      tenant_id: tenantId,
      ...data
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update hero settings: ${error.message}`)
  }

  revalidateTag('hero-settings')
  return settings
}

export async function uploadHeroImage(file: File, slideId?: string) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) throw new Error('Tenant not found')
  
  await assertTenantAdmin(tenantId)

  const fileName = `hero-slides/${tenantId}/${slideId || 'temp'}/${Date.now()}-${file.name}`
  
  const { error } = await supabaseAdmin.storage
    .from('hero-images')
    .upload(fileName, file)

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('hero-images')
    .getPublicUrl(fileName)

  return urlData.publicUrl
}
