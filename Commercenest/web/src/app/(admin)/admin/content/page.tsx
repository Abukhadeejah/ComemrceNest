import { AdminLayout } from '@/components/admin/layout/AdminLayout'

export default function ContentPage() {
  return (
    <AdminLayout 
      title="Content"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Content' }
      ]}
    >
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Content Management</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Hero Section</h3>
            <p className="text-gray-600 mb-4">Manage your homepage hero content</p>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
              Edit
            </button>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">About Us</h3>
            <p className="text-gray-600 mb-4">Update your company information</p>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
              Edit
            </button>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Contact Info</h3>
            <p className="text-gray-600 mb-4">Manage contact details and social links</p>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
              Edit
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}



