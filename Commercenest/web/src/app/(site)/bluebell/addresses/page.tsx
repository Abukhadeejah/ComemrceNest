import CustomerAuthGate from '@/components/CustomerAuthGate'
import CustomerAddressForm from './CustomerAddressForm'

export default function AddressesPage() {
  return (
    <CustomerAuthGate>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">My Addresses</h1>
              <p className="text-gray-600 mt-1">Manage your delivery addresses</p>
            </div>
            
            <div className="p-6">
              <CustomerAddressForm />
            </div>
          </div>
        </div>
      </div>
    </CustomerAuthGate>
  )
}
