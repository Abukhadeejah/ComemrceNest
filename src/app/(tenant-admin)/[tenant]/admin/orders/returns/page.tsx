import OfflineReturnCreateForm from '@/components/admin/orders/OfflineReturnCreateForm'

interface TenantReturnsPageProps {
  params: Promise<{
    tenant: string
  }>
  searchParams: Promise<{
    order?: string
  }>
}

export default async function TenantReturnsPage({ params, searchParams }: TenantReturnsPageProps) {
  const { tenant } = await params
  const query = await searchParams

  return (
    <OfflineReturnCreateForm
      tenant={tenant}
      ordersBasePath={`/${tenant}/admin/orders`}
      initialOrderQuery={query.order || ''}
    />
  )
}
