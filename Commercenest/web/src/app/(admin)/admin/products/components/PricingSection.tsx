'use client'

import { ProductFormData } from '@/types/product'
import { useEffect, useState } from 'react'
import { FieldErrors, UseFormRegister } from 'react-hook-form'

interface PricingSectionProps {
  formData: ProductFormData
  errors?: FieldErrors<ProductFormData>
  onInputChange?: (field: keyof ProductFormData, value: string | number | boolean | null | unknown[]) => void
  register?: UseFormRegister<ProductFormData>
}

export function PricingSection({ formData, errors, onInputChange }: PricingSectionProps) {
  const [validationError, setValidationError] = useState<string>('')
  const [inputValues, setInputValues] = useState({
    mrp: '',
    salePrice: '',
    costPrice: ''
  })

  // Initialize input values from formData only once to avoid precision loss
  useEffect(() => {
    setInputValues(prev => ({
      mrp: prev.mrp || (formData.compare_at_price_cents ? (formData.compare_at_price_cents / 100).toString() : ''),
      salePrice: prev.salePrice || (formData.price_cents ? (formData.price_cents / 100).toString() : ''),
      costPrice: prev.costPrice || (formData.cost_price_cents ? (formData.cost_price_cents / 100).toString() : '')
    }))
  }, [])



  // Convert rupees to cents for storage (integers only)
  const rupeesToCents = (rupees: string): number => {
    if (!rupees || rupees.trim() === '') return 0
    
    // Remove any non-numeric characters (no decimals allowed)
    const cleanValue = rupees.replace(/[^\d]/g, '')
    const value = parseInt(cleanValue, 10)
    
    if (isNaN(value) || value < 0) return 0
    
    // Convert rupees to cents (multiply by 100)
    const cents = value * 100
    
    // Validate the result is within reasonable bounds
    if (cents > Number.MAX_SAFE_INTEGER) {
      console.warn('Price value too large, capping at safe integer limit')
      return Number.MAX_SAFE_INTEGER
    }
    
    return cents
  }

  // Handle input changes while preserving user typing
  const handlePriceInput = (field: 'mrp' | 'salePrice' | 'costPrice', value: string) => {
    // Update local input state immediately
    setInputValues(prev => ({ ...prev, [field]: value }))
    
    // Convert to cents and update form data
    const cents = rupeesToCents(value)
    const fieldMap = {
      mrp: 'compare_at_price_cents',
      salePrice: 'price_cents',
      costPrice: 'cost_price_cents'
    }
    onInputChange?.(fieldMap[field] as keyof ProductFormData, cents)
  }

  // Calculate profit margin: (Sale Price - Cost) / Sale Price * 100
  const calculateProfitMargin = (): string => {
    const salePrice = formData.price_cents || 0
    const cost = formData.cost_price_cents || 0
    
    if (salePrice === 0) return '0.00'
    
    const margin = ((salePrice - cost) / salePrice) * 100
    return margin.toFixed(2)
  }

  // Calculate markup: (Sale Price - Cost) / Cost * 100
  const calculateMarkup = (): string => {
    const salePrice = formData.price_cents || 0
    const cost = formData.cost_price_cents || 0
    
    if (cost === 0) return '0.00'
    
    const markup = ((salePrice - cost) / cost) * 100
    return markup.toFixed(2)
  }

  // Validate price relationships
  useEffect(() => {
    const mrp = formData.compare_at_price_cents || 0
    const salePrice = formData.price_cents || 0
    
    if (salePrice > 0 && mrp > 0 && salePrice > mrp) {
      setValidationError('Sale price cannot be greater than MRP')
    } else if (salePrice < 0 || mrp < 0) {
      setValidationError('Prices cannot be negative')
    } else {
      setValidationError('')
    }
  }, [formData.price_cents, formData.compare_at_price_cents])

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
      
      {validationError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">⚠️ {validationError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MRP (Compare at Price) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Retail Price (MRP) * <span className="text-gray-500">(₹)</span>
          </label>
          <input
            type="number"
            value={inputValues.mrp}
            onChange={(e) => handlePriceInput('mrp', e.target.value)}
            placeholder="500"
            step="1"
            min="0"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors?.compare_at_price_cents && (
            <p className="mt-1 text-sm text-red-600">{errors?.compare_at_price_cents?.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Original price shown to customers (crossed out if sale price exists)
          </p>
        </div>

        {/* Sale Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sale Price <span className="text-gray-500">(₹)</span>
          </label>
          <input
            type="number"
            value={inputValues.salePrice}
            onChange={(e) => handlePriceInput('salePrice', e.target.value)}
            placeholder="480"
            step="1"
            min="0"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors?.price_cents && (
            <p className="mt-1 text-sm text-red-600">{errors?.price_cents?.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Discounted price. Leave blank to use MRP as selling price.
          </p>
        </div>

        {/* Cost Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cost Price <span className="text-gray-500">(₹)</span>
          </label>
          <input
            type="number"
            value={inputValues.costPrice}
            onChange={(e) => handlePriceInput('costPrice', e.target.value)}
            placeholder="300"
            step="1"
            min="0"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors?.cost_price_cents && (
            <p className="mt-1 text-sm text-red-600">{errors?.cost_price_cents?.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Your cost to purchase/manufacture this item (not shown to customers)
          </p>
        </div>

        {/* Profit Calculations */}
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Profit Analysis</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-medium">Profit Margin:</span> {calculateProfitMargin()}%
              <span className="text-xs text-gray-500 ml-1">(Profit ÷ Sale Price)</span>
            </p>
            <p>
              <span className="font-medium">Markup:</span> {calculateMarkup()}%
              <span className="text-xs text-gray-500 ml-1">(Profit ÷ Cost Price)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Explanation */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>💡 How pricing works:</strong> MRP (₹{inputValues.mrp || '500'}) 
          is the original price shown crossed out. Sale Price (₹{inputValues.salePrice || '480'}) 
          is the actual price customers pay. If no sale price is entered, customers will pay the MRP.
        </p>
      </div>
    </div>
  )
}
