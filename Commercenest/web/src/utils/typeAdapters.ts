/**
 * Type Adapters for Supabase ↔ Application Type Conversions
 * 
 * This utility handles the conversion between:
 * - Supabase generated types (which use `null`)
 * - Application interfaces (which use `undefined`)
 */

import type { Database, Json } from '@/types/supabase'
import type { HeroSlide, HeroSettings } from '@/types/hero'
import type { ProductListItem } from '@/types/product'

// =============================================================================
// CORE ADAPTER UTILITIES
// =============================================================================

/**
 * Converts null to undefined, preserves other values
 */
export function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value
}

/**
 * Converts undefined to null, preserves other values
 */
export function undefinedToNull<T>(value: T | undefined): T | null {
  return value === undefined ? null : value
}

/**
 * Safely converts a nullable string to string | undefined
 */
export function adaptString(value: string | null): string | undefined {
  return nullToUndefined(value)
}

/**
 * Safely converts a nullable number to number | undefined
 */
export function adaptNumber(value: number | null): number | undefined {
  return nullToUndefined(value)
}

/**
 * Safely converts a nullable boolean to boolean | undefined
 */
export function adaptBoolean(value: boolean | null): boolean | undefined {
  return nullToUndefined(value)
}

/**
 * Converts an array of nullable values to array of undefined values
 */
export function adaptArray<T>(array: (T | null)[]): (T | undefined)[] {
  return array.map(item => nullToUndefined(item))
}

/**
 * Deep converts an object's null values to undefined
 */
export function adaptObject<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = Array.isArray(obj) ? [] as unknown as Record<string, unknown> : {}
  for (const [key, value] of Object.entries(obj)) {
    if (value === null) {
      out[key] = undefined
    } else if (Array.isArray(value)) {
      out[key] = value.map(item => (
        typeof item === 'object' && item !== null ? adaptObject(item as Record<string, unknown>) : nullToUndefined(item as unknown as null | unknown)
      ))
    } else if (typeof value === 'object') {
      out[key] = adaptObject(value as Record<string, unknown>)
    } else {
      out[key] = value
    }
  }
  return out as unknown as T
}

// =============================================================================
// SPECIFIC TYPE ADAPTERS
// =============================================================================

/**
 * Adapts Supabase HeroSlide to Application HeroSlide
 */
export function adaptHeroSlide(
  dbSlide: Database['public']['Tables']['hero_slides']['Row']
): HeroSlide {
  return {
    id: dbSlide.id,
    title: adaptString(dbSlide.title),
    subtitle: adaptString(dbSlide.subtitle),
    description: adaptString(dbSlide.description),
    image_url: adaptString(dbSlide.image_url),
    cta_text: adaptString(dbSlide.cta_text),
    cta_link: adaptString(dbSlide.cta_link),
    badge: adaptString(dbSlide.badge),
    urgency_text: adaptString(dbSlide.urgency_text),
    countdown_end: adaptString(dbSlide.countdown_end),
    bg_overlay_class: adaptString(dbSlide.bg_overlay_class),
    countdown: adaptBoolean(dbSlide.countdown),
    position: dbSlide.position,
    is_active: dbSlide.is_active,
    created_at: dbSlide.created_at,
    updated_at: dbSlide.updated_at
  }
}

/**
 * Adapts Application HeroSlide to Supabase HeroSlide for database operations
 */
export function adaptHeroSlideForDB(
  appSlide: Partial<HeroSlide>
): Partial<Database['public']['Tables']['hero_slides']['Insert']> {
  return {
    title: undefinedToNull(appSlide.title),
    subtitle: undefinedToNull(appSlide.subtitle),
    description: undefinedToNull(appSlide.description),
    image_url: undefinedToNull(appSlide.image_url),
    cta_text: undefinedToNull(appSlide.cta_text),
    cta_link: undefinedToNull(appSlide.cta_link),
    badge: undefinedToNull(appSlide.badge),
    urgency_text: undefinedToNull(appSlide.urgency_text),
    countdown_end: undefinedToNull(appSlide.countdown_end),
    bg_overlay_class: undefinedToNull(appSlide.bg_overlay_class),
    countdown: undefinedToNull(appSlide.countdown),
    position: appSlide.position,
    is_active: appSlide.is_active
  }
}

/**
 * Adapts Supabase HeroSettings to Application HeroSettings
 */
export function adaptHeroSettings(
  dbSettings: Database['public']['Tables']['hero_settings']['Row']
): HeroSettings {
  return {
    id: dbSettings.id,
    auto_play: dbSettings.auto_play,
    auto_play_interval_ms: dbSettings.auto_play_interval_ms,
    bg_overlay_class: adaptString(dbSettings.bg_overlay_class),
    created_at: dbSettings.created_at,
    updated_at: dbSettings.updated_at
  }
}

/**
 * Adapts Application HeroSettings to Supabase HeroSettings for database operations
 */
export function adaptHeroSettingsForDB(
  appSettings: Partial<HeroSettings>
): Partial<Database['public']['Tables']['hero_settings']['Insert']> {
  return {
    auto_play: appSettings.auto_play,
    auto_play_interval_ms: appSettings.auto_play_interval_ms,
    bg_overlay_class: undefinedToNull(appSettings.bg_overlay_class)
  }
}

/**
 * Adapts Supabase Product to Application ProductListItem
 */
export function adaptProductListItem(
  dbProduct: Pick<Database['public']['Tables']['products']['Row'], 'id' | 'name' | 'slug' | 'description' | 'price_cents' | 'compare_at_price_cents' | 'stock' | 'currency' | 'hero_image_url' | 'is_featured' | 'badge_color' | 'badge_display_from' | 'badge_display_until' | 'status'>,
  variantOptions?: Database['public']['Tables']['product_variant_options']['Row'][]
): ProductListItem {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    slug: dbProduct.slug,
    description: adaptString(dbProduct.description),
    price_cents: dbProduct.price_cents,
    compare_at_price_cents: adaptNumber(dbProduct.compare_at_price_cents),
    stock: dbProduct.stock,
    currency: dbProduct.currency,
    hero_image_url: adaptString(dbProduct.hero_image_url),
    is_featured: adaptBoolean(dbProduct.is_featured),
    badge_color: adaptString(dbProduct.badge_color),
    badge_display_from: adaptString(dbProduct.badge_display_from),
    badge_display_until: adaptString(dbProduct.badge_display_until),
    status: dbProduct.status,
    // Include variant options for storefront components
    product_variant_options: variantOptions?.map(option => ({
      variant_options: {
        id: option.option_id || option.id,
        name: 'Size', // Default name since product_variant_options doesn't have name
        display_name: 'Size', // Default display name
        type: 'text', // Default type
        sort_order: option.sort_order || 0,
        variant_option_values: [] // Will be populated by separate query if needed
      }
    }))
  }
}

/**
 * Adapts Supabase Category to Application Category
 */
export function adaptCategory(
  dbCategory: Pick<Database['public']['Tables']['categories']['Row'], 'id' | 'name' | 'slug' | 'parent_id' | 'image_url' | 'image_alt'>
) {
  return {
    id: dbCategory.id,
    name: dbCategory.name,
    slug: dbCategory.slug,
    parent_id: adaptString(dbCategory.parent_id),
    image_url: adaptString(dbCategory.image_url),
    image_alt: adaptString(dbCategory.image_alt)
  }
}

/**
 * Adapts company profile data to Application Settings interface
 */
export function adaptSettings(
  companyProfile: unknown
): { name: string; logo_url: string | null; address: string | null; phone: string | null; email: string | null; gstin: string | null; brand_accent_hex: string | null; gst_rate_percent?: number | string } {
  if (!companyProfile) {
    return {
      name: '',
      logo_url: null,
      address: null,
      phone: null,
      email: null,
      gstin: null,
      brand_accent_hex: null,
      gst_rate_percent: 0
    }
  }
  const cp = typeof companyProfile === 'object' && companyProfile !== null ? (companyProfile as Record<string, unknown>) : {}
  return {
    name: typeof cp.name === 'string' ? cp.name : '',
    logo_url: typeof cp.logo_url === 'string' ? cp.logo_url : null,
    address: typeof cp.address === 'string' ? cp.address : null,
    phone: typeof cp.phone === 'string' ? cp.phone : null,
    email: typeof cp.email === 'string' ? cp.email : null,
    gstin: typeof cp.gstin === 'string' ? cp.gstin : null,
    brand_accent_hex: typeof cp.brand_accent_hex === 'string' ? cp.brand_accent_hex : null,
    gst_rate_percent: typeof cp.gst_rate_percent === 'number' ? cp.gst_rate_percent : 0
  }
}

/**
 * Adapts Supabase Portfolio Project to Application Project
 */
export function adaptProject(
  dbProject: Pick<Database['public']['Tables']['portfolio_projects']['Row'], 'id' | 'title' | 'slug' | 'hero_image_url' | 'featured' | 'description' | 'location'>
) {
  return {
    id: dbProject.id,
    title: dbProject.title,
    slug: dbProject.slug,
    hero_image_url: adaptString(dbProject.hero_image_url),
    featured: dbProject.featured,
    description: adaptString(dbProject.description),
    location: adaptString(dbProject.location)
  }
}

// =============================================================================
// JSON TYPE ADAPTERS
// =============================================================================

/**
 * Safely converts Record<string, unknown> to Supabase Json type
 */
export function adaptToSupabaseJson(value: Record<string, unknown>): Json {
  return value as Json
}

/**
 * Safely converts Supabase Json to Record<string, unknown>
 */
export function adaptFromSupabaseJson(value: Json | null): Record<string, unknown> {
  if (value === null) return {}
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

// =============================================================================
// ENUM TYPE ADAPTERS
// =============================================================================

/**
 * Validates and adapts product status
 */
export function adaptProductStatus(status: string): Database['public']['Enums']['product_status'] {
  if (status === 'draft' || status === 'published') {
    return status
  }
  return 'draft' // Default fallback
}

/**
 * Validates and adapts tenant status
 */
export function adaptTenantStatus(status: string): Database['public']['Enums']['tenant_status'] {
  if (status === 'active' || status === 'suspended' || status === 'maintenance') {
    return status
  }
  return 'active' // Default fallback
}

// =============================================================================
// BATCH ADAPTERS
// =============================================================================

/**
 * Adapts an array of Supabase HeroSlides to Application HeroSlides
 */
export function adaptHeroSlides(
  dbSlides: Database['public']['Tables']['hero_slides']['Row'][]
): HeroSlide[] {
  return dbSlides.map(adaptHeroSlide)
}

/**
 * Adapts an array of Supabase Products to Application ProductListItems
 */
export function adaptProductListItems(
  dbProducts: Pick<Database['public']['Tables']['products']['Row'], 'id' | 'name' | 'slug' | 'description' | 'price_cents' | 'compare_at_price_cents' | 'stock' | 'currency' | 'hero_image_url' | 'is_featured' | 'badge_color' | 'badge_display_from' | 'badge_display_until' | 'status'>[],
  variantOptionsMap?: Map<string, Database['public']['Tables']['product_variant_options']['Row'][]>
): ProductListItem[] {
  return dbProducts.map(product => 
    adaptProductListItem(product, variantOptionsMap?.get(product.id))
  )
}

/**
 * Adapts an array of Supabase Categories to Application Categories
 */
export function adaptCategories(
  dbCategories: Pick<Database['public']['Tables']['categories']['Row'], 'id' | 'name' | 'slug' | 'parent_id' | 'image_url' | 'image_alt'>[]
) {
  return dbCategories.map(adaptCategory)
}

/**
 * Adapts an array of Supabase Projects to Application Projects
 */
export function adaptProjects(
  dbProjects: Pick<Database['public']['Tables']['portfolio_projects']['Row'], 'id' | 'title' | 'slug' | 'hero_image_url' | 'featured' | 'description' | 'location'>[]
) {
  return dbProjects.map(adaptProject)
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Type guard to check if a value is not null or undefined
 */
export function isNotNullOrUndefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Filters out null and undefined values from an array
 */
export function filterNullUndefined<T>(array: (T | null | undefined)[]): T[] {
  return array.filter(isNotNullOrUndefined)
}

/**
 * Safe property access with null/undefined handling
 */
export function safeGet<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  return obj?.[key]
}
