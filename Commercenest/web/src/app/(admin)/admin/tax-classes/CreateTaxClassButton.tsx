'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon } from '@heroicons/react/24/outline'
import { createTaxClass } from './actions'

export function CreateTaxClassButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rate_percent: '',
    is_default: false
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    if (!formData.name.trim()) {
      setErrors({ name: 'Tax class name is required' })
      return
    }

    if (!formData.rate_percent || isNaN(parseFloat(formData.rate_percent))) {
      setErrors({ rate_percent: 'Valid tax rate is required' })
      return
    }

    const form = new FormData(e.currentTarget)
    
    startTransition(async () => {
      try {
        await createTaxClass(form)
        setIsOpen(false)
        setFormData({ name: '', description: '', rate_percent: '', is_default: false })
        router.refresh()
      } catch (error) {
        console.error('Failed to create tax class:', error)
        setErrors({ 
          general: error instanceof Error ? error.message : 'Failed to create tax class' 
        })
      }
    })
  }

  const predefinedRates = [
    { label: '0% (Tax-free)', value: '0' },
    { label: '3% (Gold/Silver)', value: '3' },
    { label: '5% (Essentials)', value: '5' },
    { label: '12% (Standard)', value: '12' },
    { label: '18% (Services)', value: '18' },
    { label: '28% (Luxury)', value: '28' }
  ]

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Add Tax Class
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setIsOpen(false)} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Create New Tax Class
                  </h3>
                  
                  {errors.general && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm text-red-800">{errors.general}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tax Class Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Standard GST, Luxury GST"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tax Rate (%) *
                      </label>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {predefinedRates.map((rate) => (
                          <button
                            key={rate.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, rate_percent: rate.value }))}
                            className={`px-3 py-2 text-sm border rounded-md ${
                              formData.rate_percent === rate.value
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {rate.label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        name="rate_percent"
                        value={formData.rate_percent}
                        onChange={(e) => setFormData(prev => ({ ...prev, rate_percent: e.target.value }))}
                        placeholder="Enter custom rate"
                        min="0"
                        max="100"
                        step="0.01"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                      {errors.rate_percent && (
                        <p className="mt-1 text-sm text-red-600">{errors.rate_percent}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional description for this tax class"
                        rows={3}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_default"
                        checked={formData.is_default}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Set as default tax class for new products
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isPending}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isPending ? 'Creating...' : 'Create Tax Class'}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

