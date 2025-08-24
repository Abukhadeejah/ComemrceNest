import { resolveTenantIdFromRequest } from '@/server/tenant'

export default async function AdminTestPage() {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Test Page</h1>
        
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
          <h2 className="text-lg font-semibold text-green-800 mb-2">✅ Admin Panel Working</h2>
          <p className="text-green-700">
            The admin panel is accessible and tenant resolution is working.
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-md font-semibold text-blue-800 mb-2">Debug Information</h3>
          <div className="text-sm text-blue-700">
            <p><strong>Tenant ID:</strong> {tenantId || 'Not found'}</p>
            <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
            <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}</p>
            <p><strong>Service Role Key:</strong> {process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set'}</p>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Admin Test Error:', error)
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Test Page</h1>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">❌ Admin Panel Error</h2>
          <p className="text-red-700 mb-4">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <div className="bg-gray-100 p-3 rounded text-sm font-mono">
            <pre>{JSON.stringify(error, null, 2)}</pre>
          </div>
        </div>
      </div>
    )
  }
}


