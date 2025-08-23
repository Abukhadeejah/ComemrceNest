import { AdminLayout } from '@/components/admin/layout/AdminLayout'

export default function SettingsPage() {
  return (
    <AdminLayout 
      title="Settings"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Settings' }
      ]}
    >
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
        </div>
        
        <div className="space-y-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Store Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Store Name</label>
                <input type="text" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Store Description</label>
                <textarea rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"></textarea>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Settings</h3>
            <p className="text-gray-500">Payment gateway configuration will be available soon.</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Settings</h3>
            <p className="text-gray-500">Shipping configuration will be available soon.</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

