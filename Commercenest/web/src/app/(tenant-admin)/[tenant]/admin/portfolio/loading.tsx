import { AdminLoadingSpinner } from '@/components/admin/AdminLoadingSpinner'

export default function PortfolioLoading() {
  return (
    <AdminLoadingSpinner 
      message="Loading portfolio..." 
      size="lg"
      fullScreen={false}
    />
  )
}
