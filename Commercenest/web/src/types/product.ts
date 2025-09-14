export interface Product {
  id: string
  tenant_id: string
  name: string
  slug: string
  description?: string
  short_description?: string
  price_cents: number
  compare_at_price_cents?: number
  cost_per_item_cents?: number
  currency: string
  sku?: string
  barcode?: string
  weight?: number
  status: 'draft' | 'published'
  category_id?: string
  inventory_quantity: number
  stock: number
  low_stock_threshold?: number
  track_inventory: boolean
  allow_backorders: boolean
  is_featured: boolean
  is_bestseller: boolean
  is_new_arrival: boolean
  is_on_sale: boolean
  sale_percentage?: number
  meta_title?: string
  meta_description?: string
  tags?: string[]
  seo_url?: string
  canonical_url?: string
  structured_data?: Record<string, unknown>
  hero_image_url?: string
  created_at: string
  updated_at: string
  
  // Fashion-specific fields
  brand?: string
  color?: string
  size_options?: string[]
  material?: string
  fit_type?: string
  material_composition?: string
  care_instructions?: string
  model_wearing_size?: string
  model_height?: number
  model_measurements?: Record<string, number>
  size_guide_url?: string
  return_policy?: string
  shipping_info?: string
  
  // Relationships
  category?: {
    id: string
    name: string
    slug: string
  }
  images?: {
    id: string
    url: string
    alt: string
    position: number
  }[]
  variants?: {
    id: string
    name: string
    values: string[]
  }[]
  size_guides?: SizeGuide[]
}

// Type for form data used in admin product form
export interface ProductFormData {
  // ID for edit mode
  id?: string
  
  // Basic Information
  name: string
  slug: string
  description: string
  short_description?: string
  
  // Pricing
  price_cents: string | number
  compare_at_price_cents: string | number
  cost_per_item_cents: string | number
  currency: string
  
  // Inventory
  stock: number
  sku: string
  barcode?: string
  weight: string | number
  dimensions?: string
  track_inventory: boolean
  low_stock_threshold: number
  allow_backorders: boolean
  
  // Organization
  category_id: string
  status: 'draft' | 'published'
  tags?: string[]
  
  // SEO
  meta_title: string
  meta_description: string
  seo_url?: string
  
  // Shipping
  requires_shipping: boolean
  taxable: boolean
  hs_code?: string
  
  // Fashion-specific fields
  brand?: string
  color?: string
  material?: string
  fit_type: string
  material_composition: string
  care_instructions: string
  model_height_cm: string | number
  model_weight_kg: string | number
  model_wearing_size: string
  
  // Gift card fields
  is_gift_card: boolean
  gift_card_amount_cents: string | number
  gift_card_expiry_days: string | number
  
  // Variants and size guides
  has_variants: boolean
  variantOptions: unknown[]
  sizeGuides: unknown[]
  sizeGuideId: string
  
  // Media
  images: string[]
  
  // Badge System
  is_featured: boolean
  is_bestseller: boolean
  is_new_arrival: boolean
  is_on_sale: boolean
  is_limited_edition: boolean
  is_sold_out: boolean
  custom_badge_text: string
  badge_color: string
  badge_priority: number
  badge_display_until?: string
  badge_display_from?: string
}

export interface VariantOption {
  id: string
  name: string
  displayName: string
  type: 'color' | 'size' | 'material' | 'style'
  values: VariantValue[]
}

export interface VariantValue {
  id: string
  value: string
  displayValue: string
  colorHex?: string
}

export interface SizeGuide {
  id: string
  name: string
  category: string
  gender: string
  measurements: Record<string, Record<string, string>>
}
