// Single source of truth for all Hero-related types
// This prevents TypeScript conflicts between different files

export interface HeroSlide {
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
  // Database fields (only present in full objects from DB)
  created_at?: string
  updated_at?: string
  // Additional fields for form handling
  cta_badge_filter?: string
  cta_tag_filter?: string
}

export interface HeroSlideFormData {
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
  cta_badge_filter?: string
  cta_tag_filter?: string
}

export interface HeroSettings {
  id?: string
  auto_play?: boolean
  auto_play_interval_ms?: number
  bg_overlay_class?: string
  tenant_id?: string
  created_at?: string
  updated_at?: string
}

export interface HeroSettingsFormData {
  auto_play: boolean
  auto_play_interval_ms: number
  bg_overlay_class: string
}

// Type guards to distinguish between different contexts
export const isFullHeroSlide = (slide: HeroSlide): slide is HeroSlide & { created_at: string; updated_at: string } => {
  return !!(slide.created_at && slide.updated_at)
}

export const isFormHeroSlide = (slide: HeroSlide): slide is HeroSlideFormData => {
  return !!(slide.title !== undefined || slide.subtitle !== undefined)
}







