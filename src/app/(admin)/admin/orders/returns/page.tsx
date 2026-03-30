import OfflineReturnCreateForm from '@/components/admin/orders/OfflineReturnCreateForm'

interface AdminReturnsPageProps {
  searchParams: Promise<{
    order?: string
  }>
}

export default async function AdminReturnsPage({ searchParams }: AdminReturnsPageProps) {
  const params = await searchParams

  return (
    <OfflineReturnCreateForm
      ordersBasePath="/admin/orders"
      initialOrderQuery={params.order || ''}
    />
  )
}
