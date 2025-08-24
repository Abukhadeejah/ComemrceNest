import { AdminLayout } from '@/components/admin/layout/AdminLayout'

export default function AnalyticsPage() {
  return (
    <AdminLayout 
      title="Analytics"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Analytics' }
      ]}
    >
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Analytics</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-sm font-medium text-blue-600">Total Views</h3>
            <p className="text-2xl font-bold text-blue-900">1,234</p>
            <p className="text-sm text-blue-600">+12% from last month</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="text-sm font-medium text-green-600">Orders</h3>
            <p className="text-2xl font-bold text-green-900">56</p>
            <p className="text-sm text-green-600">+8% from last month</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-6">
            <h3 className="text-sm font-medium text-purple-600">Revenue</h3>
            <p className="text-2xl font-bold text-purple-900">₹45,678</p>
            <p className="text-sm text-purple-600">+23% from last month</p>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-6">
            <h3 className="text-sm font-medium text-orange-600">Conversion Rate</h3>
            <p className="text-2xl font-bold text-orange-900">4.5%</p>
            <p className="text-sm text-orange-600">+2% from last month</p>
          </div>
        </div>
        
        <div className="text-center py-12">
          <p className="text-gray-500">Detailed analytics charts will be available soon.</p>
        </div>
      </div>
    </AdminLayout>
  )
}



