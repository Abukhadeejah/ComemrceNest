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
  cost_per_item_cents?: number | null;
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
