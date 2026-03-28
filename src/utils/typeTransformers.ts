/**
 * Type Transformers - Permanent Solution for Database-to-Component Type Mismatches
 * 
 * This utility provides consistent type transformations between database schemas
 * and component interfaces to prevent TypeScript errors and maintain type safety.
 */

import type { VariantOption, VariantValue } from '@/types/product'

/**
 * Database variant options structure (from Supabase queries)
 */
export interface DbVariantOption {
  variant_options: {
    id: string
    name: string
    display_name: string
    type: string
    variant_option_values: {
      id: string
      value: string
      display_value: string
      color_hex?: string
      image_url?: string
      sort_order: number
      price_adjustment_cents?: number
      cost_adjustment_cents?: number
    }[]
  }
}

/**
 * Transform database variant options to component-expected format
 * 
 * @param dbVariantOptions - Raw variant options from database query
 * @returns Transformed variant options for UI components
 */
export function transformVariantOptions(dbVariantOptions: DbVariantOption[] | null | undefined): VariantOption[] {
  if (!dbVariantOptions || dbVariantOptions.length === 0) {
    return []
  }

  return dbVariantOptions.map(item => {
    const variantOption = item.variant_options
    
    return {
      id: variantOption.id,
      name: variantOption.name,
      displayName: variantOption.display_name,
      type: variantOption.type as 'color' | 'size' | 'material' | 'style',
      required: false, // Default to false; can be overridden by component logic if needed
      values: variantOption.variant_option_values?.map((value): VariantValue => ({
        id: value.id,
        value: value.value,
        displayValue: value.display_value,
        colorHex: value.color_hex
      })) || []
    }
  })
}

/**
 * Transform product data for consistent usage across components
 * 
 * @param dbProduct - Raw product data from database
 * @returns Transformed product data
 */
type DbProductMinimal = { price_cents?: string | number; compare_at_price_cents?: string | number | null } & Record<string, unknown>
export function transformProductData(dbProduct: DbProductMinimal) {
  return {
    ...dbProduct,
    // Add any necessary transformations here
    // For example: ensure price_cents is always a number
    price_cents: typeof dbProduct.price_cents === 'string' 
      ? parseInt(dbProduct.price_cents, 10) 
      : dbProduct.price_cents || 0,
    compare_at_price_cents: typeof dbProduct.compare_at_price_cents === 'string'
      ? parseInt(dbProduct.compare_at_price_cents, 10)
      : dbProduct.compare_at_price_cents || null
  }
}

/**
 * Type guard to check if variant options are in database format
 */
export function isDbVariantOption(item: unknown): item is DbVariantOption {
  if (!item || typeof item !== 'object') return false
  const v = (item as Record<string, unknown>).variant_options as { id?: unknown } | undefined
  return typeof v?.id === 'string'
}

/**
 * Type guard to check if variant options are in component format
 */
export function isComponentVariantOption(item: unknown): item is VariantOption {
  if (!item || typeof item !== 'object') return false
  const o = item as Record<string, unknown>
  return typeof o.id === 'string' && Array.isArray(o.values)
}

/**
 * Universal variant options transformer that handles both formats
 */
export function ensureVariantOptionsFormat(variantOptions: unknown[]): VariantOption[] {
  if (!variantOptions || variantOptions.length === 0) {
    return []
  }

  // If first item is already in component format, return as-is
  if (isComponentVariantOption(variantOptions[0])) {
    return variantOptions as VariantOption[]
  }

  // If first item is in database format, transform it
  if (isDbVariantOption(variantOptions[0])) {
    return transformVariantOptions(variantOptions as DbVariantOption[])
  }

  // Fallback: try to transform anyway
  return transformVariantOptions(variantOptions as DbVariantOption[])
}
