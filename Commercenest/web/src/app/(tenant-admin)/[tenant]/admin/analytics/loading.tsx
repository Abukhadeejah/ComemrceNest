import { AdminLoadingSpinner } from '@/components/admin/AdminLoadingSpinner'

export default function AnalyticsLoading() {
  return (
    <AdminLoadingSpinner 
      message="Loading analytics..." 
      size="lg"
      fullScreen={false}
    />
  )
}
