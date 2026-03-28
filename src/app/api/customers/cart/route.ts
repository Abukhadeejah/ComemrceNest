import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'

function sanitizeItems(items: unknown) {
  if (!Array.isArray(items)) return []

  return items
    .filter((item) => item && typeof item === 'object')
    .map((item: any) => ({
      id: typeof item.id === 'string' ? item.id : `cart_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      productId: String(item.productId || ''),
      name: String(item.name || ''),
      price: Number(item.price) || 0,
      imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : undefined,
      quantity: Math.max(0, Number(item.quantity) || 0),
      variant: item.variant && typeof item.variant === 'object' ? item.variant : undefined,
    }))
    .filter((item) => item.productId.length > 0 && item.quantity > 0)
}

async function getAuthenticatedUserId() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null
  return user.id
}

export async function GET() {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single()

    if (!customer) {
      return NextResponse.json({ items: [] })
    }

    const admin = supabaseAdmin as any
    const { data: cartRow, error } = await admin
      .from('customer_carts')
      .select('items, updated_at')
      .eq('tenant_id', tenantId)
      .eq('customer_id', customer.id)
      .maybeSingle()

    if (error) {
      console.error('Get customer cart error:', error)
      return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
    }

    return NextResponse.json({
      items: sanitizeItems(cartRow?.items || []),
      updatedAt: cartRow?.updated_at || null,
    })
  } catch (error) {
    console.error('Get customer cart error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = (await request.json().catch(() => ({}))) as { items?: unknown }
    const items = sanitizeItems(body.items)

    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single()

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const admin = supabaseAdmin as any
    const { error } = await admin
      .from('customer_carts')
      .upsert(
        {
          tenant_id: tenantId,
          customer_id: customer.id,
          items,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,customer_id' }
      )

    if (error) {
      console.error('Update customer cart error:', error)
      return NextResponse.json({ error: 'Failed to save cart' }, { status: 500 })
    }

    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error('Update customer cart error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
