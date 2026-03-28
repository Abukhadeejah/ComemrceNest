import { resolveTenantIdFromRequest } from '@/server/tenant'
import { fetchPublishedProducts } from '@/server/modules/products/service'
import { fetchPublishedProjects } from '@/server/modules/portfolio/service'
import Home from './Home'
import { adaptProductListItems, adaptProjects } from '@/utils/typeAdapters'

export default async function HomeServer() {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) {
    return <main className="p-6"><h1 className="text-xl font-semibold">Bluebell</h1><p className="text-sm text-neutral-600">Tenant not found.</p></main>
  }

  const [{ data: products }, { data: projects }] = await Promise.all([
    fetchPublishedProducts(tenantId),
    fetchPublishedProjects(tenantId),
  ])

  return <Home 
    products={adaptProductListItems(products || [])} 
    projects={adaptProjects(projects || [])} 
  />
}






