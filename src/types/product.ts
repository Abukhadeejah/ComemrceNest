// Product Draft for auto-save functionality
export interface ProductDraft {
  // Database metadata
  id: string;
  tenant_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  
  // Optional product fields (nullable for partial drafts)
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  short_description?: string | null;
  price_cents?: number | null;
  compare_at_price_cents?: number | null;
  cost_price_cents?: number | null;
  currency?: string | null;
  sku?: string | null;
  barcode?: string | null;
  weight?: number | null;
  stock?: number | null;
  low_stock_threshold?: number | null;
  track_inventory?: boolean | null;
  allow_backorders?: boolean | null;
  status?: 'draft' | 'published' | null;
  category_id?: string | null;
  category_ids?: string[] | null;
  tags?: string[] | null;
  
  // SEO fields
  meta_title?: string | null;
  meta_description?: string | null;
  seo_url?: string | null;
  
  // Fashion-specific
  brand?: string | null;
  color?: string | null;
  material?: string | null;
  fit_type?: string | null;
  material_composition?: string | null;
  care_instructions?: string | null;
  model_height_cm?: number | null;
  model_weight_kg?: number | null;
  model_wearing_size?: string | null;
  
  // Gender selection
  for_men?: boolean | null;
  for_women?: boolean | null;
  unisex?: boolean | null;
  
  // Badge system
  is_featured?: boolean | null;
  is_bestseller?: boolean | null;
  is_new_arrival?: boolean | null;
  is_on_sale?: boolean | null;
  is_limited_edition?: boolean | null;
  is_sold_out?: boolean | null;
  custom_badge_text?: string | null;
  badge_color?: string | null;
  badge_priority?: number | null;
  badge_display_from?: string | null;
  badge_display_until?: string | null;
  
  // Media
  images?: string[] | null;
  hero_image_url?: string | null;
  
  // Shipping & Tax
  requires_shipping?: boolean | null;
  taxable?: boolean | null;
  tax_class_id?: string | null;
  hs_code?: string | null;
  
  // Gift card
  is_gift_card?: boolean | null;
  gift_card_amount_cents?: number | null;
  gift_card_expiry_days?: number | null;
  
  // Variants
  has_variants?: boolean | null;
  
  // JSONB fallback for any additional form state
  draft_data?: Record<string, unknown> | null;
}

// UI Option and Combination types for variants and form state
export interface UIOptionValue {
  id: string
  value: string
  displayValue: string
  colorHex?: string
  imageUrl?: string
}

export interface UIOption {
  id: string
  name: string
  displayName: string
  // Widen type union to include all variant types that may come from UI or DB
  type: 'text' | 'color' | 'image' | 'select' | 'size' | 'material' | 'style' | string
  required: boolean
  values: UIOptionValue[]
}

export interface UICombination {
  id: string
  options: Record<string, string>
  priceCents: number
  stock: number
  sku: string
  imageUrl?: string
}

// Full form state type for ProductForm using RHF
export interface ProductFormData {
  id?: string
  name: string
  slug: string
  description: string
  short_description: string
  price_cents: number | null
  compare_at_price_cents: number | null
  cost_price_cents: number | null
  currency: string
  sku: string
  barcode: string
  weight: number | null
  dimensions: string | null
  stock: number
  low_stock_threshold: number
  track_inventory: boolean
  allow_backorders: boolean
  status: 'draft' | 'published'
  category_id?: string | null
  category_ids: string[]
  tags: string[]

  meta_title: string
  meta_description: string
  seo_url: string

  brand: string
  color: string
  material: string
  fit_type: string
  material_composition: string
  care_instructions: string
  model_height_cm: number | null
  model_weight_kg: number | null
  model_wearing_size: string

  is_featured: boolean
  is_bestseller: boolean
  is_new_arrival: boolean
  is_on_sale: boolean
  is_limited_edition: boolean
  is_sold_out: boolean
  custom_badge_text: string
  badge_color: string
  badge_priority: number
  badge_display_from: string
  badge_display_until: string
  badge_text: string | null
  badge_start_date: string | null
  badge_end_date: string | null

  requires_shipping: boolean
  taxable: boolean
  tax_class_id: string
  hs_code: string

  is_gift_card: boolean
  gift_card_amount_cents: number | null
  gift_card_expiry_days: number | null

  has_variants: boolean

  images: string[]

  variantOptions: VariantOption[]
  variantCombinations: UICombination[]

  sizeGuides: unknown[]
  sizeGuideId: string

  attributes: AttributeSelection[]
}

// Props for ProductForm component
export interface CategoryTreeNode {
  id: string
  name: string
  slug: string
  parent_id: string | null
  image_url?: string | null
  image_alt?: string | null
  created_at: string
  children?: CategoryTreeNode[]
}

export interface ProductFormProps {
  mode: 'create' | 'edit'
  initialData?: Partial<ProductFormData>
  categories: CategoryTreeNode[]
  tenantId: string
}

export interface TaxClass {
  id: string
  name: string
  rate_percent: number
  is_default?: boolean | null
  is_active?: boolean | null
  description?: string | null
  tenant_id: string
  created_at?: string | null
  updated_at?: string | null
}

// Variant aliases for compatibility
export type VariantValue = UIOptionValue
export type VariantOption = UIOption

// Attributes feature types
export interface AttributeValue {
  id: string
  value: string
}

export interface ProductAttributeDefinition {
  id: string
  name: string
  values: AttributeValue[]
}

export interface AttributeSelection {
  attributeId: string
  valueIds: string[] | null
}

// Product list item used across UI (kept compatible with server/service.ts)
export type ProductListItem = {
  id: string
  name: string
  slug: string
  description: string | null | undefined
  price_cents: number
  compare_at_price_cents?: number | null
  currency: string
  hero_image_url: string | null | undefined
  stock: number
  status: 'draft' | 'published'
  low_stock_threshold?: number | null
  // Badge System (optional until migration is applied)
  is_featured?: boolean
  is_bestseller?: boolean
  is_new_arrival?: boolean
  is_on_sale?: boolean
  is_limited_edition?: boolean
  is_sold_out?: boolean
  custom_badge_text?: string | null
  badge_color?: string | undefined
  badge_priority?: number | null
  badge_display_until?: string | undefined
  badge_display_from?: string | undefined
  // Variant options for PLP cards
  product_variant_options?: {
    variant_options: {
      id: string
      name: string
      display_name: string
      type: string
      sort_order?: number | null | undefined
      variant_option_values: {
        id: string
        value: string
        display_value: string
        color_hex?: string | null | undefined
        image_url?: string | null | undefined
        sort_order?: number | null | undefined
        price_adjustment_cents?: number | null | undefined
        cost_adjustment_cents?: number | null | undefined
      }[]
    }
  }[]
}

// Generic Product type for pages that expect broader server responses
export type Product = ProductListItem & Record<string, unknown>
