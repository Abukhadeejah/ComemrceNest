import { AdminLoadingSpinner } from '@/components/admin/AdminLoadingSpinner'

export default function AdminLoading() {
  return (
    <AdminLoadingSpinner 
      message="Loading admin dashboard..." 
      size="lg"
      fullScreen={false}
    />
  )
}
