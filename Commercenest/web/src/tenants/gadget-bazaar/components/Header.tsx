import type { HeaderProps } from '@/components/tenant/contracts'

export default function Gadget-bazaarHeader({ config, theme }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">G</span>
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-gray-900">Gadget Bazaar</h1>
            </div>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="/" className="text-gray-700 hover:text-blue-900">Home</a>
            <a href="/products" className="text-gray-700 hover:text-blue-900">Products</a>
            <a href="/portfolio" className="text-gray-700 hover:text-blue-900">Portfolio</a>
            <a href="/contact" className="text-gray-700 hover:text-blue-900">Contact</a>
          </nav>
          <div className="md:hidden">
            <button className="text-gray-700 hover:text-blue-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
