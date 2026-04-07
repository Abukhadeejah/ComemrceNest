import OfflineOrderCreateForm from '@/components/admin/orders/OfflineOrderCreateForm'

interface TenantCreateOrderPageProps {
  params: Promise<{ tenant: string }>
}

export default async function TenantCreateOrderPage({ params }: TenantCreateOrderPageProps) {
  const { tenant } = await params

  return (
    <OfflineOrderCreateForm
      tenant={tenant}
      ordersBasePath={`/${tenant}/admin/orders`}
    />
  )
}
