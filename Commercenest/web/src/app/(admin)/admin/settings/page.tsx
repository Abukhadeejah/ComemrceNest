import { getSettings } from './actions'
import { getPaymentSettings } from './payments-actions'
import { SettingsForm } from './SettingsForm'
import { adaptSettings } from '@/utils/typeAdapters'

export default async function AdminSettings() {
  const settings = await getSettings()
  const paymentSettings = await getPaymentSettings()

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your store settings and preferences
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Store Settings</h2>
        </div>
        <div className="p-6">
          <SettingsForm settings={adaptSettings(settings)} paymentSettings={paymentSettings} />
        </div>
      </div>
    </div>
  )
}



