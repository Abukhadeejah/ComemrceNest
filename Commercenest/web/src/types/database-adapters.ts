import { Database, Tables } from './supabase'

// Type adapter to convert Supabase null types to undefined types
export type NullToUndefined<T> = {
  [K in keyof T]: T[K] extends null ? undefined : T[K] extends null | infer U ? U | undefined : T[K]
}

// Adapted database types that convert null to undefined
export type AdaptedTables = {
  [K in keyof Database['public']['Tables']]: {
    Row: NullToUndefined<Database['public']['Tables'][K]['Row']>
    Insert: NullToUndefined<Database['public']['Tables'][K]['Insert']>
    Update: NullToUndefined<Database['public']['Tables'][K]['Update']>
    Relationships: Database['public']['Tables'][K]['Relationships']
  }
}

// Specific adapted types for common use cases
export type AdaptedProduct = NullToUndefined<Tables<'products'>>
export type AdaptedHeroSlide = NullToUndefined<Tables<'hero_slides'>>
export type AdaptedHeroSettings = NullToUndefined<Tables<'hero_settings'>>
export type AdaptedCategory = NullToUndefined<Tables<'categories'>>
export type AdaptedPortfolioProject = NullToUndefined<Tables<'portfolio_projects'>>
export type AdaptedProductImage = NullToUndefined<Tables<'product_images'>>
export type AdaptedSettings = NullToUndefined<Tables<'settings_company_profile'>>
export type AdaptedWalletLedger = NullToUndefined<Tables<'wallet_ledger'>>

// Enum adapters
export type ProductStatus = Database['public']['Enums']['product_status']
export type OrderStatus = Database['public']['Enums']['order_status']
export type TenantStatus = Database['public']['Enums']['tenant_status']

// Helper function to convert null to undefined
export function nullToUndefined<T>(obj: T): NullToUndefined<T> {
  if (obj === null) return undefined as unknown as NullToUndefined<T>
  if (obj === undefined || typeof obj !== 'object') return obj as unknown as NullToUndefined<T>

  if (Array.isArray(obj)) {
    return (obj.map(item => nullToUndefined(item)) as unknown) as NullToUndefined<T>
  }

  const result: Record<string, unknown> = {}
  for (const key in obj as Record<string, unknown>) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as Record<string, unknown>)[key]
      result[key] = nullToUndefined(value as unknown)
    }
  }
  return result as unknown as NullToUndefined<T>
}

// Type-safe adapter functions
export function adaptProduct(product: Tables<'products'>): AdaptedProduct {
  return nullToUndefined(product)
}

export function adaptProducts(products: Tables<'products'>[]): AdaptedProduct[] {
  return products.map(adaptProduct)
}

export function adaptHeroSlide(slide: Tables<'hero_slides'>): AdaptedHeroSlide {
  return nullToUndefined(slide)
}

export function adaptHeroSlides(slides: Tables<'hero_slides'>[]): AdaptedHeroSlide[] {
  return slides.map(adaptHeroSlide)
}

export function adaptHeroSettings(settings: Tables<'hero_settings'>): AdaptedHeroSettings {
  return nullToUndefined(settings)
}

export function adaptCategory(category: Tables<'categories'>): AdaptedCategory {
  return nullToUndefined(category)
}

export function adaptCategories(categories: Tables<'categories'>[]): AdaptedCategory[] {
  return categories.map(adaptCategory)
}

export function adaptPortfolioProject(project: Tables<'portfolio_projects'>): AdaptedPortfolioProject {
  return nullToUndefined(project)
}

export function adaptPortfolioProjects(projects: Tables<'portfolio_projects'>[]): AdaptedPortfolioProject[] {
  return projects.map(adaptPortfolioProject)
}

export function adaptProductImages(images: Tables<'product_images'>[]): AdaptedProductImage[] {
  return images.map(image => nullToUndefined(image))
}

export function adaptSettings(settings: Tables<'settings_company_profile'>): AdaptedSettings {
  return nullToUndefined(settings)
}


