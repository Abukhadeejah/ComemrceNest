import { AdminLayout } from '@/components/admin/layout/AdminLayout'

export default function TeamPage() {
  return (
    <AdminLayout 
      title="Team"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Team' }
      ]}
    >
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Team Management</h2>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
            Invite Member
          </button>
        </div>
        
        <div className="text-center py-12">
          <p className="text-gray-500">Team management features will be available soon.</p>
        </div>
      </div>
    </AdminLayout>
  )
}

