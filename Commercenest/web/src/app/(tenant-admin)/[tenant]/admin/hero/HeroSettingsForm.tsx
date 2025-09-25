'use client'

import { useState } from 'react'
import { HeroSettings, HeroSettingsFormData } from '@/types/hero'

interface HeroSettingsFormProps {
  settings: HeroSettings | null
  onUpdate: (data: HeroSettingsFormData) => void
  isPending: boolean
}

export function HeroSettingsForm({ settings, onUpdate, isPending }: HeroSettingsFormProps) {
  const [formData, setFormData] = useState({
    auto_play: settings?.auto_play ?? true,
    auto_play_interval_ms: settings?.auto_play_interval_ms ?? 5000,
    bg_overlay_class: settings?.bg_overlay_class ?? 'bg-black/20'
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseInt(value) || 0 : value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(formData)
  }

  const intervalOptions = [
    { value: 3000, label: '3 seconds' },
    { value: 5000, label: '5 seconds' },
    { value: 8000, label: '8 seconds' },
    { value: 10000, label: '10 seconds' },
    { value: 15000, label: '15 seconds' }
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="auto_play"
              checked={formData.auto_play}
              onChange={handleInputChange}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">
              Enable Auto-play
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Automatically advance slides at the specified interval
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Auto-play Interval
          </label>
          <select
            name="auto_play_interval_ms"
            value={formData.auto_play_interval_ms}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {intervalOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={isPending}
        >
          {isPending ? 'Updating...' : 'Update Settings'}
        </button>
      </div>
    </form>
  )
}




