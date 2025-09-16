'use client'

import { useTransition } from 'react'

interface Settings {
  name: string
  logo_url: string
  address: string
  phone: string
  email: string
  gstin: string
  brand_accent_hex: string
  gst_rate_percent?: number | string
}

interface PaymentSettings {
  mode: 'test' | 'live'
  hasTest: boolean
  hasLive: boolean
  testKeyId: string
  testKeySecret: string
  testWebhookSecret: string
  liveKeyId: string
  liveKeySecret: string
  liveWebhookSecret: string
}

interface SettingsFormProps {
  settings: Settings
  paymentSettings: PaymentSettings
}

export function SettingsForm({ settings, paymentSettings }: SettingsFormProps) {
  const [, startTransition] = useTransition()

  const _handleSubmit = async (_formData: FormData) => {
    startTransition(async () => {
      // Form will be submitted via action to /api/admin/settings
      // which will redirect back with success/error message
    })
  }

  return (
    <div className="space-y-10">
      <form action="/api/admin/settings" method="post" className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Store Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            defaultValue={settings.name}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter store name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            defaultValue={settings.email}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="store@example.com"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            id="phone"
            defaultValue={settings.phone}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="+91 98765 43210"
          />
        </div>

        <div>
          <label htmlFor="gstin" className="block text-sm font-medium text-gray-700">
            GSTIN
          </label>
          <input
            type="text"
            name="gstin"
            id="gstin"
            defaultValue={settings.gstin}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="22AAAAA0000A1Z5"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700">
            Logo URL
          </label>
          <input
            type="url"
            name="logo_url"
            id="logo_url"
            defaultValue={settings.logo_url}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="https://example.com/logo.png"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <textarea
            name="address"
            id="address"
            rows={3}
            defaultValue={settings.address}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter store address"
          />
        </div>

        <div>
          <label htmlFor="gst_rate_percent" className="block text-sm font-medium text-gray-700">
            GST Rate (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="gst_rate_percent"
            id="gst_rate_percent"
            defaultValue={settings.gst_rate_percent ?? ''}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="e.g. 18"
          />
          <p className="text-xs text-gray-500 mt-1">Admin-configurable GST rate applied at checkout totals.</p>
        </div>

        <div>
          <label htmlFor="brand_accent_hex" className="block text-sm font-medium text-gray-700">
            Brand Color
          </label>
          <div className="mt-1 flex items-center space-x-3">
            <input
              type="color"
              name="brand_accent_hex"
              id="brand_accent_hex"
              defaultValue={settings.brand_accent_hex}
              className="h-10 w-20 border border-gray-300 rounded-md"
            />
            <input
              type="text"
              defaultValue={settings.brand_accent_hex}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="#C9A227"
            />
          </div>
        </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Settings
          </button>
        </div>
      </form>

      <PaymentSettingsClient paymentSettings={paymentSettings} />
    </div>
  )
}

function PaymentSettingsClient({ paymentSettings }: { paymentSettings: PaymentSettings }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const webhookUrl = origin ? `${origin}/api/webhooks/razorpay` : '/api/webhooks/razorpay'

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl)
      alert('Webhook URL copied')
    } catch {
      /* noop */
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Payments (Razorpay)</h2>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Webhook URL</label>
        <div className="flex gap-2">
          <input readOnly value={webhookUrl} className="flex-1 block w-full border rounded px-3 py-2 text-gray-600" />
          <button type="button" onClick={onCopy} className="px-3 py-2 border rounded">Copy</button>
        </div>
        <ul className="text-sm text-gray-600 list-disc pl-5">
          <li>In Razorpay Dashboard, select mode (Test or Live) at top-right.</li>
          <li>Go to Settings → Webhooks → Add New Webhook, paste the URL above.</li>
          <li>Set a strong Secret. Use different secrets for Test and Live.</li>
          <li>Select events (at least payment.captured). Save.</li>
          <li>Enter your Key ID/Secret and the same Webhook Secret below, choose Mode, Save.</li>
        </ul>
      </div>
      <form method="post" action="/api/admin/settings/payments" className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Mode</label>
          <select name="mode" defaultValue={paymentSettings.mode} className="mt-1 block w-full border rounded px-3 py-2">
            <option value="test">Test</option>
            <option value="live">Live</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Test Key ID</label>
            <input name="test_key_id" defaultValue={paymentSettings.testKeyId} className="mt-1 block w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Test Key Secret</label>
            <input name="test_key_secret" type="password" defaultValue={paymentSettings.testKeySecret} className="mt-1 block w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Test Webhook Secret</label>
            <input name="test_webhook_secret" type="password" defaultValue={paymentSettings.testWebhookSecret} className="mt-1 block w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Live Key ID</label>
            <input name="live_key_id" defaultValue={paymentSettings.liveKeyId} className="mt-1 block w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Live Key Secret</label>
            <input name="live_key_secret" type="password" defaultValue={paymentSettings.liveKeySecret} className="mt-1 block w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Live Webhook Secret</label>
            <input name="live_webhook_secret" type="password" defaultValue={paymentSettings.liveWebhookSecret} className="mt-1 block w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">If blank, CommerceNest default keys will be used.</p>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save Payment Settings</button>
        </div>
      </form>
    </div>
  )
}
