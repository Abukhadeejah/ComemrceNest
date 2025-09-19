'use client'

import { useState, useEffect } from 'react'
import { ProductFormData, TaxClass } from '@/types/product'
import { getTaxClasses } from '../../tax-classes/actions'

interface TaxSectionProps {
  formData: ProductFormData
  errors: Record<string, string>
  onInputChange: (field: keyof ProductFormData, value: string | number | boolean | null | unknown[]) => void
}

export function TaxSection({ formData, errors, onInputChange }: TaxSectionProps) {
  const [taxClasses, setTaxClasses] = useState<TaxClass[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Load tax classes on component mount
  useEffect(() => {
    const loadTaxClasses = async () => {
      try {
        const classes = await getTaxClasses()
        setTaxClasses(classes)
        
        // If no tax class is selected and product is taxable, set default
        if (formData.taxable && !formData.tax_class_id) {
          const defaultClass = classes.find(c => c.is_default)
          if (defaultClass) {
            onInputChange('tax_class_id', defaultClass.id)
          }
        }
      } catch (error) {
        console.error('Failed to load tax classes:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTaxClasses()
  }, [formData.taxable, formData.tax_class_id, onInputChange])

  const handleTaxableChange = (taxable: boolean) => {
    onInputChange('taxable', taxable)
    
    if (taxable && !formData.tax_class_id) {
      // Auto-select default tax class when enabling taxable
      const defaultClass = taxClasses.find(c => c.is_default)
      if (defaultClass) {
        onInputChange('tax_class_id', defaultClass.id)
      }
    } else if (!taxable) {
      // Clear tax class when disabling taxable
      onInputChange('tax_class_id', null)
    }
  }

  const handleTaxClassChange = (taxClassId: string) => {
    onInputChange('tax_class_id', taxClassId || null)
  }

  const selectedTaxClass = taxClasses.find(c => c.id === formData.tax_class_id)
  const defaultTaxClass = taxClasses.find(c => c.is_default)

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Tax Configuration</h3>
          <p className="text-sm text-gray-500">Configure tax settings for this product</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
        </button>
      </div>

      {/* Basic Tax Settings */}
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="taxable"
            checked={formData.taxable || false}
            onChange={(e) => handleTaxableChange(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="taxable" className="ml-2 block text-sm text-gray-900">
            This product is taxable
          </label>
        </div>

        {formData.taxable && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Class
            </label>
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
            ) : (
              <div className="space-y-3">
                <select
                  value={formData.tax_class_id || ''}
                  onChange={(e) => handleTaxClassChange(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select tax class...</option>
                  {taxClasses.map((taxClass) => (
                    <option key={taxClass.id} value={taxClass.id}>
                      {taxClass.name} ({taxClass.rate_percent}%)
                      {taxClass.is_default && ' - Default'}
                    </option>
                  ))}
                </select>
                
                {selectedTaxClass && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-blue-800">
                          {selectedTaxClass.name} - {selectedTaxClass.rate_percent}% GST
                        </h4>
                        {selectedTaxClass.description && (
                          <p className="text-sm text-blue-700 mt-1">
                            {selectedTaxClass.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!selectedTaxClass && defaultTaxClass && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <p className="text-sm text-gray-600">
                      💡 <strong>Tip:</strong> Default tax class is "{defaultTaxClass.name}" ({defaultTaxClass.rate_percent}%). 
                      <button
                        type="button"
                        onClick={() => handleTaxClassChange(defaultTaxClass.id)}
                        className="text-blue-600 hover:text-blue-800 underline ml-1"
                      >
                        Use default
                      </button>
                    </p>
                  </div>
                )}
              </div>
            )}
            {errors.tax_class_id && (
              <p className="mt-1 text-sm text-red-600">{errors.tax_class_id}</p>
            )}
          </div>
        )}
      </div>

      {/* Advanced Tax Settings */}
      {showAdvanced && formData.taxable && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Advanced Tax Settings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HS Code (Harmonized System)
              </label>
              <input
                type="text"
                value={formData.hs_code || ''}
                onChange={(e) => onInputChange('hs_code', e.target.value)}
                placeholder="e.g., 6203.42.90"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <p className="mt-1 text-sm text-gray-500">
                For customs and international shipping
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Calculation Preview
              </label>
              {selectedTaxClass && (
                <div className="bg-gray-50 rounded-md p-3">
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>Product Price:</span>
                      <span>₹{((formData.price_cents as number) / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>GST ({selectedTaxClass.rate_percent}%):</span>
                      <span>₹{(((formData.price_cents as number) / 100) * (selectedTaxClass.rate_percent / 100)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1 mt-1">
                      <span>Total (incl. tax):</span>
                      <span>₹{(((formData.price_cents as number) / 100) * (1 + selectedTaxClass.rate_percent / 100)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Tax Configuration Guide:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>GST 0%:</strong> Tax-free products (books, essential medicines)</li>
          <li>• <strong>GST 5%:</strong> Basic necessities (food items, medicines)</li>
          <li>• <strong>GST 12%:</strong> Standard rate for many goods (textiles, furniture)</li>
          <li>• <strong>GST 18%:</strong> Standard rate for services and most products</li>
          <li>• <strong>GST 28%:</strong> Luxury goods (automobiles, high-end electronics)</li>
        </ul>
      </div>
    </div>
  )
}

