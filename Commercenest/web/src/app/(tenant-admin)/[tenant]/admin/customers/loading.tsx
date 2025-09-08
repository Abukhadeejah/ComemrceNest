import { AdminLoadingSpinner } from '@/components/admin/AdminLoadingSpinner'

export default function CustomersLoading() {
  return (
    <AdminLoadingSpinner 
      message="Loading customers..." 
      size="lg"
      fullScreen={false}
    />
  )
}
