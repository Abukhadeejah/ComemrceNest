import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { InventoryTable } from './InventoryTable'
import { InventoryStats } from './InventoryStats'

export default async function InventoryPage() {
  const tenantId = await resolveTenantIdFromRequest()
  
  if (!tenantId) {
    throw new Error('Tenant not found')
  }

  // Fetch all products with inventory data
  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select(`
      id,
      name,
      slug,
      sku,
      stock,
      low_stock_threshold,
      track_inventory,
      allow_backorders,
      status,
      price_cents,
      created_at,
      updated_at
    `)
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching inventory:', error)
    throw new Error('Failed to fetch inventory data')
  }

  // Calculate inventory stats
  const totalProducts = products?.length || 0
  const trackingInventory = products?.filter(p => p.track_inventory).length || 0
  const lowStockProducts = products?.filter(p => {
    if (!p.track_inventory || p.status !== 'published') return false
    const stock = p.stock || 0
    const threshold = p.low_stock_threshold || 0
    return stock <= threshold
  }).length || 0
  const outOfStockProducts = products?.filter(p => {
    if (!p.track_inventory || p.status !== 'published') return false
    return (p.stock || 0) <= 0
  }).length || 0

  const stats = {
    totalProducts,
    trackingInventory,
    lowStockProducts,
    outOfStockProducts
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-500">Monitor and manage product stock levels</p>
      </div>

      <InventoryStats stats={stats} />
      
      <div className="mt-6">
      <InventoryTable products={(products || []).map(p => ({
        ...p,
        sku: p.sku ?? undefined,
        low_stock_threshold: p.low_stock_threshold ?? null,
        track_inventory: p.track_inventory ?? null,
        allow_backorders: p.allow_backorders ?? null
      }))} />
      </div>
    </div>
  )
}


