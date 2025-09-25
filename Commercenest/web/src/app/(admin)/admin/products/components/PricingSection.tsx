'use client'

import { useState, useEffect } from 'react'

import { ProductFormData } from '@/types/product'

interface PricingSectionProps {
  formData: ProductFormData
  errors: Record<string, string>
  onInputChange: (field: keyof ProductFormData, value: string | number | boolean | null | unknown[]) => void
}

export function PricingSection({ formData, errors, onInputChange }: PricingSectionProps) {
  const [priceInput, setPriceInput] = useState('')
  const [comparePriceInput, setComparePriceInput] = useState('')
  const [costInput, setCostInput] = useState('')

  // Initialize input values when formData changes
  useEffect(() => {
    // Set the formatted values from formData
    const priceCents = typeof formData.price_cents === 'number' ? formData.price_cents : 0
    const comparePriceCents = typeof formData.compare_at_price_cents === 'number' ? formData.compare_at_price_cents : 0
    const costCents = typeof formData.cost_per_item_cents === 'number' ? formData.cost_per_item_cents : 0
    
    setPriceInput(priceCents ? (priceCents / 100).toFixed(2) : '')
    setComparePriceInput(comparePriceCents ? (comparePriceCents / 100).toFixed(2) : '')
    setCostInput(costCents ? (costCents / 100).toFixed(2) : '')
  }, [formData.price_cents, formData.compare_at_price_cents, formData.cost_per_item_cents])

  const calculateProfitMargin = () => {
    const priceCents = typeof formData.price_cents === 'number' ? formData.price_cents : 0
    const costCents = typeof formData.cost_per_item_cents === 'number' ? formData.cost_per_item_cents : 0
    
    if (!priceCents || !costCents) return null
    const profit = priceCents - costCents
    const margin = (profit / priceCents) * 100
    return margin.toFixed(1)
  }

  const handlePriceChange = (value: string) => {
    setPriceInput(value)
    // Don't update form data while typing - only update on blur
  }

  const handlePriceBlur = () => {
    if (priceInput === '') {
      onInputChange('price_cents', 0)
      setPriceInput('')
    } else {
      const numValue = parseFloat(priceInput)
      if (!isNaN(numValue) && numValue >= 0) {
        onInputChange('price_cents', Math.round(numValue * 100))
        setPriceInput(numValue.toFixed(2))
      }
    }
  }

  const handleComparePriceChange = (value: string) => {
    setComparePriceInput(value)
    // Don't update form data while typing - only update on blur
  }

  const handleComparePriceBlur = () => {
    if (comparePriceInput === '') {
      onInputChange('compare_at_price_cents', null)
      setComparePriceInput('')
    } else {
      const numValue = parseFloat(comparePriceInput)
      if (!isNaN(numValue) && numValue >= 0) {
        onInputChange('compare_at_price_cents', Math.round(numValue * 100))
        setComparePriceInput(numValue.toFixed(2))
      }
    }
  }

  const handleCostChange = (value: string) => {
    setCostInput(value)
    // Don't update form data while typing - only update on blur
  }

  const handleCostBlur = () => {
    if (costInput === '') {
      onInputChange('cost_per_item_cents', null)
      setCostInput('')
    } else {
      const numValue = parseFloat(costInput)
      if (!isNaN(numValue) && numValue >= 0) {
        onInputChange('cost_per_item_cents', Math.round(numValue * 100))
        setCostInput(numValue.toFixed(2))
      }
    }
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price (₹) *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">₹</span>
            </div>
            <input
              type="text"
              value={priceInput}
              onChange={(e) => handlePriceChange(e.target.value)}
              onBlur={handlePriceBlur}
              className={`pl-7 w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.price_cents ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
          </div>
          {errors.price_cents && (
            <p className="mt-1 text-sm text-red-600">{errors.price_cents}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Compare at Price (₹)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">₹</span>
            </div>
            <input
              type="text"
              value={comparePriceInput}
              onChange={(e) => handleComparePriceChange(e.target.value)}
              onBlur={handleComparePriceBlur}
              className="pl-7 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0.00"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Original price for comparison
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cost per Item (₹)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">₹</span>
            </div>
            <input
              type="text"
              value={costInput}
              onChange={(e) => handleCostChange(e.target.value)}
              onBlur={handleCostBlur}
              className="pl-7 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0.00"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Your cost to purchase this item
          </p>
        </div>
      </div>

      {/* Profit Margin Display */}
      {formData.price_cents && formData.cost_per_item_cents && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            <span className="font-medium">Profit Margin:</span> {calculateProfitMargin()}%
          </p>
        </div>
      )}
    </div>
  )
}
