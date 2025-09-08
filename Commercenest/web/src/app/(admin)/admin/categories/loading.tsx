import { AdminLoadingSpinner } from '@/components/admin/AdminLoadingSpinner'

export default function CategoriesLoading() {
  return (
    <AdminLoadingSpinner 
      message="Loading categories..." 
      size="lg"
      fullScreen={false}
    />
  )
}
