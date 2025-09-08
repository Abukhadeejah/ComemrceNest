import { AdminLoadingSpinner } from '@/components/admin/AdminLoadingSpinner'

export default function OrdersLoading() {
  return (
    <AdminLoadingSpinner 
      message="Loading orders..." 
      size="lg"
      fullScreen={false}
    />
  )
}
