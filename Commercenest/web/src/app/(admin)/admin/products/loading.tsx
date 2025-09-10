import { AdminLoadingSpinner } from '@/components/admin/AdminLoadingSpinner'

export default function ProductsLoading() {
  return (
    <AdminLoadingSpinner 
      message="Loading products..." 
      size="lg"
      fullScreen={false}
    />
  )
}


