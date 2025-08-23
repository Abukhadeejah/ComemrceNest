import { AdminLayout } from '@/components/admin/layout/AdminLayout'

export default function CategoriesPage() {
  return (
    <AdminLayout 
      title="Categories"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Categories' }
      ]}
    >
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Categories</h2>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
            Add Category
          </button>
        </div>
        
        <div className="text-center py-12">
          <p className="text-gray-500">No categories found. Create your first category to get started.</p>
        </div>
      </div>
    </AdminLayout>
  )
}

