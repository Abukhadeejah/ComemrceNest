'use server'

import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { assertTenantAdmin } from '@/server/auth'
import { revalidateTag } from 'next/cache'
import type { TaxClass } from '@/types/product'

export async function getTaxClasses(): Promise<TaxClass[]> {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      throw new Error('Tenant not found')
    }

    const { data: taxClasses, error } = await supabaseAdmin
      .from('tax_classes')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('rate_percent', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch tax classes: ${error.message}`)
    }

    return taxClasses || []
  } catch (error) {
    console.error('Error fetching tax classes:', error)
    throw error
  }
}

export async function createTaxClass(formData: FormData): Promise<TaxClass> {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      throw new Error('Tenant not found')
    }

    await assertTenantAdmin(tenantId)

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const rate_percent = parseFloat(formData.get('rate_percent') as string)
    const is_default = formData.get('is_default') === 'true'

    // If this is being set as default, unset other defaults first
    if (is_default) {
      await supabaseAdmin
        .from('tax_classes')
        .update({ is_default: false })
        .eq('tenant_id', tenantId)
        .eq('is_default', true)
    }

    const { data: taxClass, error } = await supabaseAdmin
      .from('tax_classes')
      .insert({
        tenant_id: tenantId,
        name,
        description: description || null,
        rate_percent,
        is_default,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('A tax class with this name already exists')
      }
      throw new Error(`Failed to create tax class: ${error.message}`)
    }

    revalidateTag(`tax-classes-${tenantId}`, 'default')
    return taxClass
  } catch (error) {
    console.error('Error creating tax class:', error)
    throw error
  }
}

export async function updateTaxClass(id: string, formData: FormData): Promise<TaxClass> {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      throw new Error('Tenant not found')
    }

    await assertTenantAdmin(tenantId)

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const rate_percent = parseFloat(formData.get('rate_percent') as string)
    const is_default = formData.get('is_default') === 'true'

    // If this is being set as default, unset other defaults first
    if (is_default) {
      await supabaseAdmin
        .from('tax_classes')
        .update({ is_default: false })
        .eq('tenant_id', tenantId)
        .eq('is_default', true)
        .neq('id', id) // Don't unset the current record
    }

    const { data: taxClass, error } = await supabaseAdmin
      .from('tax_classes')
      .update({
        name,
        description: description || null,
        rate_percent,
        is_default,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('A tax class with this name already exists')
      }
      throw new Error(`Failed to update tax class: ${error.message}`)
    }

    revalidateTag(`tax-classes-${tenantId}`, 'default')
    return taxClass
  } catch (error) {
    console.error('Error updating tax class:', error)
    throw error
  }
}

export async function deleteTaxClass(id: string): Promise<void> {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      throw new Error('Tenant not found')
    }

    await assertTenantAdmin(tenantId)

    // Check if any products are using this tax class
    const { data: productsUsingClass, error: checkError } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('tax_class_id', id)
      .limit(1)

    if (checkError) {
      throw new Error(`Failed to check tax class usage: ${checkError.message}`)
    }

    if (productsUsingClass && productsUsingClass.length > 0) {
      throw new Error('Cannot delete tax class that is being used by products')
    }

    // Soft delete by setting is_active to false
    const { error } = await supabaseAdmin
      .from('tax_classes')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      throw new Error(`Failed to delete tax class: ${error.message}`)
    }

    revalidateTag(`tax-classes-${tenantId}`, 'default')
  } catch (error) {
    console.error('Error deleting tax class:', error)
    throw error
  }
}

export async function setDefaultTaxClass(id: string): Promise<void> {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      throw new Error('Tenant not found')
    }

    await assertTenantAdmin(tenantId)

    // First, unset all current defaults
    await supabaseAdmin
      .from('tax_classes')
      .update({ is_default: false })
      .eq('tenant_id', tenantId)
      .eq('is_default', true)

    // Then set the new default
    const { error } = await supabaseAdmin
      .from('tax_classes')
      .update({ 
        is_default: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      throw new Error(`Failed to set default tax class: ${error.message}`)
    }

    revalidateTag(`tax-classes-${tenantId}`, 'default')
  } catch (error) {
    console.error('Error setting default tax class:', error)
    throw error
  }
}

