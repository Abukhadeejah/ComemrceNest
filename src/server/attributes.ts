import { supabaseAdmin } from '@/server/supabaseAdmin'

export interface AvailableAttributeFilter {
  id: string
  name: string
  values: {
    id: string
    value: string
  }[]
}

/**
 * Fetch available attribute filters for a tenant's products.
 * Returns only attributes and values that are actually used by published products.
 * Optionally filtered by category.
 */
export async function fetchAvailableAttributeFilters(
  tenantId: string,
  categoryId?: string
): Promise<AvailableAttributeFilter[]> {
  try {
    // Get product IDs of published products in this tenant (optionally filtered by category)
    let productQuery = supabaseAdmin
      .from('products')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('status', 'published')

    if (categoryId) {
      // When filtering by category, ensure we inner-join product_categories
      // so that the filter on product_categories.category_id works as expected.
      productQuery = supabaseAdmin
        .from('products')
        .select('id, product_categories!inner(category_id)')
        .eq('tenant_id', tenantId)
        .eq('status', 'published')
        .eq('product_categories.category_id', categoryId)
    }

    const { data: productIds, error: productError } = await productQuery

    if (productError || !productIds || productIds.length === 0) {
      console.log('[fetchAvailableAttributeFilters] No published products found for tenant:', tenantId)
      return []
    }

    const publishedProductIds = productIds.map((p: any) => p.id)

    console.log('[fetchAvailableAttributeFilters] Found products:', publishedProductIds.length, 'sample:', publishedProductIds.slice(0,5))

    // Fetch attribute values that are actually used by these published products.
    // Use attribute_values as the primary table and inner-join product_attribute_values
    // to ensure we only pick values that are attached to available products.
    // Select the parent attribute via the relationship 'attributes'.

    // First try: query product_attribute_values and select nested attribute_values -> attributes
    // This is the most direct mapping of which values are used by which products.
    const { data: pavData, error: pavError } = await supabaseAdmin
      .from('product_attribute_values')
      .select('attribute_values(id, value, attribute_id, attributes(id, name))')
      .eq('tenant_id', tenantId)
      .in('product_id', publishedProductIds)

    console.log('[fetchAvailableAttributeFilters] product_attribute_values query result:', {
      tenantId,
      publishedProductCount: publishedProductIds.length,
      returnedRows: pavData?.length ?? 0,
      error: pavError ?? null,
    })

    let rowsToProcess: any[] = []

    if (pavError) {
      console.error('[fetchAvailableAttributeFilters] Error querying product_attribute_values:', pavError)
    }

    if (pavData && pavData.length > 0) {
      rowsToProcess = pavData
    } else {
      // Fallback: query attribute_values joined to product_attribute_values
      const { data: avData, error: avError } = await supabaseAdmin
        .from('attribute_values')
        .select('id, value, attribute_id, attributes(id, name), product_attribute_values!inner(product_id)')
        .eq('tenant_id', tenantId)
        .in('product_attribute_values.product_id', publishedProductIds)

      console.log('[fetchAvailableAttributeFilters] attribute_values fallback query result:', {
        tenantId,
        publishedProductCount: publishedProductIds.length,
        returnedRows: avData?.length ?? 0,
        error: avError ?? null,
      })

      if (avError) {
        console.error('[fetchAvailableAttributeFilters] Error fetching attribute filters (attribute_values fallback):', avError)
      }

      if (avData && avData.length > 0) {
        // Normalize to same shape as pavData rows (attribute_values nested)
        rowsToProcess = avData.map((r: any) => ({ attribute_values: { id: r.id, value: r.value, attribute_id: r.attribute_id, attributes: r.attributes } }))
      }
    }

    // Group by attribute and collect unique values
    const attributeMap = new Map<string, { name: string; values: Map<string, string> }>()

    // rowsToProcess expected to be array of rows with `attribute_values` property
    for (const row of rowsToProcess) {
      const attrValue = row.attribute_values
      if (!attrValue || !attrValue.attributes) {
        // log sample row for debugging
        console.log('[fetchAvailableAttributeFilters] Skipping row (missing relationships):', row)
        continue
      }

      const attrId = String(attrValue.attributes.id)
      const attrName = String(attrValue.attributes.name)
      const valueId = String(attrValue.id)
      const valueName = String(attrValue.value)

      if (!attributeMap.has(attrId)) {
        attributeMap.set(attrId, { name: attrName, values: new Map() })
      }

      const attrEntry = attributeMap.get(attrId)!
      attrEntry.values.set(valueId, valueName)
    }

    console.log('[fetchAvailableAttributeFilters] Processed attributes count:', attributeMap.size)

    // Convert to the expected format and sort
    const result: AvailableAttributeFilter[] = Array.from(attributeMap.entries())
      .map(([id, attr]) => ({
        id,
        name: attr.name,
        values: Array.from(attr.values.entries())
          .map(([valueId, value]) => ({ id: valueId, value }))
          .sort((a, b) => a.value.localeCompare(b.value)), // Sort values alphabetically
      }))
      .sort((a, b) => a.name.localeCompare(b.name)) // Sort attributes alphabetically
    // If we found nothing from product_attribute_values / attribute_values join,
    // fall back to returning all attributes+values for this tenant so filters
    // are shown even when no product currently uses them (admin-managed attributes).
    if (result.length === 0) {
      console.log('[fetchAvailableAttributeFilters] No used attribute values found; falling back to tenant attributes')
      const { data: attrs, error: attrsError } = await supabaseAdmin
        .from('attributes')
        .select('id, name, attribute_values(id, value)')
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true })

      if (attrsError) {
        console.error('[fetchAvailableAttributeFilters] Error fetching tenant attributes fallback:', attrsError)
        return []
      }

      const fallback = (attrs || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        values: Array.isArray(a.attribute_values)
          ? a.attribute_values.map((v: any) => ({ id: v.id, value: v.value })).sort((x: any, y: any) => x.value.localeCompare(y.value))
          : [],
      }))

      return fallback
    }

    return result
  } catch (err) {
    console.error('[fetchAvailableAttributeFilters] Unexpected error:', err)
    return []
  }
}
