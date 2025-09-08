import { AdminLoadingSpinner } from '@/components/admin/AdminLoadingSpinner'

export default function SettingsLoading() {
  return (
    <AdminLoadingSpinner 
      message="Loading settings..." 
      size="lg"
      fullScreen={false}
    />
  )
}
