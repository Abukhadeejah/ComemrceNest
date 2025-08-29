export default function DefaultHome() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to CommerceNest</h1>
        <p className="text-gray-600 mb-8">Multi-tenant e-commerce platform</p>
        <div className="space-y-4">
          <a 
            href="/senlysh" 
            className="block px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            Visit Senlysh (Fashion)
          </a>
          <a 
            href="/bluebell" 
            className="block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Visit Bluebell (Interior Design)
          </a>
        </div>
      </div>
    </div>
  )
}























