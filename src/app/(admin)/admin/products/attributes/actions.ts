'use server'

import { supabaseAdmin } from '@/server/supabaseAdmin'
import { resolveTenantIdFromRequest } from '@/server/tenant'

export async function getAttributes() {
  try {
    const tenantId = await resolveTenantIdFromRequest()

    const { data, error } = await supabaseAdmin
      .from('attributes')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })

    if (error) {
      console.error('getAttributes error:', error)
      throw new Error(error.message)
    }

    return data || []
  } catch (err) {
    console.error('getAttributes unexpected error:', err)
    return []
  }
}

export async function getAttribute(id: string) {
  try {
    const tenantId = await resolveTenantIdFromRequest()

    const { data, error } = await supabaseAdmin
      .from('attributes')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      console.error('getAttribute error:', error)
      throw new Error(error.message)
    }

    return data
  } catch (err) {
    console.error('getAttribute unexpected error:', err)
    return null
  }
}

export async function getAttributeValues(attributeId: string) {
  try {
    const tenantId = await resolveTenantIdFromRequest()

    const { data, error } = await supabaseAdmin
      .from('attribute_values')
      .select('id, value, created_at, updated_at')
      .eq('attribute_id', attributeId)
      .eq('tenant_id', tenantId)
      .order('value', { ascending: true })

    if (error) {
      console.error('getAttributeValues error:', error)
      throw new Error(error.message)
    }

    return data || []
  } catch (err) {
    console.error('getAttributeValues unexpected error:', err)
    return []
  }
}


export async function getProductAttributes() {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    console.log('🔧 getProductAttributes - tenantId:', tenantId)

    // First, fetch all attributes (without values)
    const { data: attributes, error: attributesError } = await supabaseAdmin
      .from('attributes')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })

    console.log('🔧 getProductAttributes - attributes data:', attributes)
    console.log('🔧 getProductAttributes - attributes error:', attributesError)

    if (attributesError) {
      console.error('getProductAttributes attributes error:', attributesError)
      throw new Error(attributesError.message)
    }

    if (!attributes || attributes.length === 0) {
      console.log('🔧 getProductAttributes - No attributes found for tenant')
      return []
    }

    // Then, fetch values for each attribute
    const formattedAttributes = await Promise.all(
      attributes.map(async (attr) => {
        const { data: values, error: valuesError } = await supabaseAdmin
          .from('attribute_values')
          .select('id, value')
          .eq('attribute_id', attr.id)
          .eq('tenant_id', tenantId)
          .order('value', { ascending: true })

        if (valuesError) {
          console.error(`Error fetching values for attribute ${attr.id}:`, valuesError)
          return {
            id: attr.id,
            name: attr.name,
            values: []
          }
        }

        return {
          id: attr.id,
          name: attr.name,
          values: (values || []).map((val: any) => ({
            id: val.id,
            value: val.value
          }))
        }
      })
    )

    console.log('🔧 getProductAttributes - formatted:', formattedAttributes)
    console.log('🔧 getProductAttributes - count:', formattedAttributes.length)

    return formattedAttributes
  } catch (err) {
    console.error('getProductAttributes unexpected error:', err)
    return []
  }
}
