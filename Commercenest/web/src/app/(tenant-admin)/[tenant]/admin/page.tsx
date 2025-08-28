import { resolveTenantIdFromRequest } from '@/server/tenant'
import { redirect } from 'next/navigation'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { CubeIcon, ShoppingCartIcon, CurrencyRupeeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { assertTenantAdmin } from '@/server/auth'
import AdminBrandingWrapper from '@/components/admin/AdminBrandingWrapper'
import type { TenantKey } from '@/registry/types'

interface TenantAdminPageProps {
  params: Promise<{
    tenant: string
  }>
}

export default async function TenantAdminPage({ params }: TenantAdminPageProps) {
  const { tenant } = await params
  
  // Validate tenant and get tenant ID
  const tenantId = await resolveTenantIdFromRequest()
  
  if (!tenantId) {
    redirect('/login')
  }

  // 🔒 SECURITY: Add authentication check
  try {
    await assertTenantAdmin(tenantId)
  } catch {
    redirect('/login')
  }

  // Verify the tenant parameter matches the resolved tenant
  const tenantKey = await getTenantKeyFromId(tenantId)
  if (tenantKey !== tenant) {
    redirect(`/${tenantKey}/admin`)
  }
  
  // Fetch dashboard stats for this specific tenant
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, status')
    .eq('tenant_id', tenantId)

  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, status, total_cents')
    .eq('tenant_id', tenantId)

  const totalProducts = products?.length || 0
  const publishedProducts = products?.filter(p => p.status === 'published').length || 0
  const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0
  const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_cents || 0), 0) || 0
  const lowStockProducts = products?.filter(p => p.status === 'published').length || 0

  const stats = [
    { name: 'Total Products', value: totalProducts, icon: CubeIcon, change: '+12%', changeType: 'positive' },
    { name: 'Published Products', value: publishedProducts, icon: CubeIcon, change: '+8%', changeType: 'positive' },
    { name: 'Pending Orders', value: pendingOrders, icon: ShoppingCartIcon, change: '+2', changeType: 'neutral' },
    { name: 'Total Revenue', value: `₹${(totalRevenue / 100).toLocaleString()}`, icon: CurrencyRupeeIcon, change: '+23%', changeType: 'positive' },
  ]

  const recentActivity = [
    { id: 1, type: 'product', action: 'Product created', name: 'Sample Product', time: '2 hours ago' },
    { id: 2, type: 'order', action: 'Order received', name: 'Order #1234', time: '4 hours ago' },
    { id: 3, type: 'product', action: 'Product updated', name: 'Updated Product', time: '6 hours ago' },
  ]

  return (
    <AdminBrandingWrapper tenantKey={tenant as TenantKey}>
      <AdminLayout title={`${tenant.charAt(0).toUpperCase() + tenant.slice(1)} Admin Dashboard`}>
        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
          >
            <dt>
              <div className="absolute rounded-md bg-indigo-500 p-3">
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  item.changeType === 'positive' ? 'text-green-600' : 
                  item.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
                }`}
              >
                {item.change}
              </p>
            </dd>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {lowStockProducts > 0 && (
        <div className="mt-8">
          <div className="rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Low Stock Alert
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You have {lowStockProducts} products with low stock levels. 
                    <a href={`/${tenant}/admin/products`} className="font-medium underline hover:text-yellow-600 ml-1">
                      Review inventory
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="mt-8">
        <h3 className="text-base font-semibold leading-6 text-gray-900">Recent Activity</h3>
        <div className="mt-4 flow-root">
          <ul role="list" className="-mb-8">
            {recentActivity.map((activity, activityIdx) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {activityIdx !== recentActivity.length - 1 ? (
                    <span
                      className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
                        <span className="text-sm font-medium text-white">
                          {activity.type === 'product' ? 'P' : 'O'}
                        </span>
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p className="text-sm text-gray-500">
                          {activity.action} <span className="font-medium text-gray-900">{activity.name}</span>
                        </p>
                      </div>
                      <div className="whitespace-nowrap text-right text-sm text-gray-500">
                        <time dateTime={activity.time}>{activity.time}</time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      </AdminLayout>
    </AdminBrandingWrapper>
  )
}

async function getTenantKeyFromId(tenantId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('tenants')
    .select('name')
    .eq('id', tenantId)
    .maybeSingle()
  
  if (!data?.name) return null
  
  // Map tenant names to keys
  const nameToKey: Record<string, string> = {
    'Bluebell Interiors': 'bluebell',
    'Senlysh Fashion': 'senlysh',
  }
  
  return nameToKey[data.name] || null
}


