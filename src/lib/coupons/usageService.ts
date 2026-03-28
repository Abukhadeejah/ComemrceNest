import { supabaseAdmin } from '@/server/supabaseAdmin'

export interface CouponUsageData {
  coupon_id: string
  order_id: string
  customer_id: string
  discount_amount_cents: number
  order_total_cents: number
  tenant_id: string
}

/**
 * Records coupon usage after successful payment
 */
export async function recordCouponUsage(data: CouponUsageData) {
  try {
    // Insert into coupon_usage table
    const { error: usageError } = await supabaseAdmin
      .from('coupon_usage')
      .insert({
        tenant_id: data.tenant_id,
        coupon_id: data.coupon_id,
        order_id: data.order_id,
        customer_id: data.customer_id,
        discount_amount_cents: data.discount_amount_cents,
        order_total_cents: data.order_total_cents,
        used_at: new Date().toISOString()
      })

    if (usageError) {
      console.error('Failed to record coupon usage:', usageError)
      throw new Error(`Failed to record coupon usage: ${usageError.message}`)
    }

    console.log('Coupon usage recorded successfully:', {
      coupon_id: data.coupon_id,
      order_id: data.order_id,
      discount_amount_cents: data.discount_amount_cents
    })

    return { success: true }
  } catch (error) {
    console.error('Error in recordCouponUsage:', error)
    throw error
  }
}

/**
 * Gets coupon usage statistics
 */
export async function getCouponStats(couponId: string) {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_coupon_stats', {
      p_coupon_id: couponId
    })

    if (error) {
      console.error('Failed to get coupon stats:', error)
      return null
    }

    return data && data.length > 0 ? data[0] : null
  } catch (error) {
    console.error('Error in getCouponStats:', error)
    return null
  }
}

/**
 * Validates coupon availability before payment
 * (Double-check to prevent race conditions)
 */
export async function validateCouponBeforePayment(
  tenantId: string,
  couponCode: string,
  customerId: string,
  orderTotalCents: number
) {
  try {
    const { data, error } = await supabaseAdmin.rpc('validate_coupon', {
      p_tenant_id: tenantId,
      p_coupon_code: couponCode,
      p_customer_id: customerId,
      p_order_total_cents: orderTotalCents
    })

    if (error) {
      console.error('Coupon validation error:', error)
      return { valid: false, error: error.message }
    }

    const result = data && data.length > 0 ? data[0] : null

    if (!result || !result.is_valid) {
      return {
        valid: false,
        error: result?.error_message || 'Invalid coupon'
      }
    }

    return {
      valid: true,
      coupon_id: result.coupon_id,
      discount_amount_cents: result.discount_amount_cents,
      discount_type: result.discount_type,
      discount_value: result.discount_value
    }
  } catch (error) {
    console.error('Error in validateCouponBeforePayment:', error)
    return { valid: false, error: 'Failed to validate coupon' }
  }
}

/**
 * Gets all coupon usage for a specific order
 */
export async function getCouponUsageByOrder(orderId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('coupon_usage')
      .select(`
        *,
        coupons (
          code,
          description,
          discount_type,
          discount_value
        )
      `)
      .eq('order_id', orderId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Failed to get coupon usage by order:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getCouponUsageByOrder:', error)
    return null
  }
}

/**
 * Gets coupon usage history for a customer
 */
export async function getCustomerCouponHistory(
  tenantId: string,
  customerId: string,
  limit = 10
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('coupon_usage')
      .select(`
        *,
        coupons (
          code,
          description,
          discount_type,
          discount_value
        ),
        orders (
          order_number,
          total_amount_cents,
          created_at
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('customer_id', customerId)
      .order('used_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to get customer coupon history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getCustomerCouponHistory:', error)
    return []
  }
}