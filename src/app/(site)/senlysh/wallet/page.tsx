import CustomerAuthGate from '@/components/CustomerAuthGate'
import CustomerWalletDashboard from './CustomerWalletDashboard'

export default function WalletPage() {
  return (
    <CustomerAuthGate>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
              <p className="text-gray-600 mt-1">Available for In Store Purchase Only</p>
            </div>
            
            <div className="p-6">
              <CustomerWalletDashboard />
            </div>
          </div>
        </div>
      </div>
    </CustomerAuthGate>
  )
}
