import { Suspense } from 'react'
import { getProducts, getCategories } from '@/app/(admin)/admin/products/actions'
import { ProductTable } from './ProductTable'
import { ProductSearch } from '@/app/(admin)/admin/products/ProductSearch'
import { ProductFilters } from '@/app/(admin)/admin/products/ProductFilters'
import { CreateProductButton } from '@/app/(admin)/admin/products/CreateProductButton'
import { ProductPagination } from '@/app/(admin)/admin/products/ProductPagination'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/server/supabaseAdmin'

interface TenantAdminProductsProps {
  params: Promise<{
    tenant: string
  }>
  searchParams: Promise<{
    search?: string
    status?: string
    category?: string
    page?: string
    pageSize?: string
    sort?: string
  }>
}

export default async function TenantAdminProducts({ params, searchParams }: TenantAdminProductsProps) {
  const { tenant } = await params
  const searchParamsData = await searchParams
  
  // Get tenant ID and validate
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) {
    redirect('/login')
  }

  // Verify tenant parameter matches resolved tenant
  const tenantKey = await getTenantKeyFromId(tenantId)
  if (tenantKey !== tenant) {
    redirect(`/${tenantKey}/admin/products`)
  }

  // Add tenant ID to search params for filtering
  const paramsWithTenant = {
    ...searchParamsData,
    tenantId
  }
  
  const [products, categories] = await Promise.all([
    getProducts(paramsWithTenant, tenantId),
    getCategories(tenantId)
  ])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{tenant.charAt(0).toUpperCase() + tenant.slice(1)} Products</h1>
        <CreateProductButton />
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <ProductSearch currentSearch={searchParamsData.search} />
            <ProductFilters 
              categories={categories}
              currentStatus={searchParamsData.status}
              currentCategory={searchParamsData.category}
            />
          </div>
        </div>

        <Suspense fallback={<div className="p-6">Loading products...</div>}>
          <ProductTable
            products={products.data || []}
          />
        </Suspense>

        <ProductPagination
          page={products.page}
          totalPages={products.totalPages}
          count={products.count}
          pageSize={products.pageSize}
        />
      </div>
    </div>
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
