'use client'

import { useState, useEffect } from 'react'
import { ProductFormData } from '@/types/product'

interface PricingSectionProps {
  formData: ProductFormData
  errors: Record<string, string>
  onInputChange: (field: keyof ProductFormData, value: string | number | boolean | null | unknown[]) => void
}

export function PricingSection({ formData, errors, onInputChange }: PricingSectionProps) {
  const [mrpInput, setMrpInput] = useState('')
  const [salePriceInput, setSalePriceInput] = useState('')
  const [costInput, setCostInput] = useState('')

  // Initialize input values when formData changes - FIXED to not show 0 values
  useEffect(() => {
    // SWAPPED: MRP is now compare_at_price_cents
    const mrpCents = typeof formData.compare_at_price_cents === 'number' ? formData.compare_at_price_cents : null
    // SWAPPED: Sale Price is now price_cents
    const salePriceCents = typeof formData.price_cents === 'number' ? formData.price_cents : null
    const costCents = typeof formData.cost_per_item_cents === 'number' ? formData.cost_per_item_cents : null
    
    // Only set values if they exist and are greater than 0
    setMrpInput(mrpCents && mrpCents > 0 ? (mrpCents / 100).toFixed(2) : '')
    setSalePriceInput(salePriceCents && salePriceCents > 0 ? (salePriceCents / 100).toFixed(2) : '')
    setCostInput(costCents && costCents > 0 ? (costCents / 100).toFixed(2) : '')
  }, [formData.price_cents, formData.compare_at_price_cents, formData.cost_per_item_cents])

  const calculateProfitMargin = () => {
    // Use Sale Price (price_cents) for profit calculation, or MRP if no sale price
    const salePriceCents = typeof formData.price_cents === 'number' ? formData.price_cents : 0
    const mrpCents = typeof formData.compare_at_price_cents === 'number' ? formData.compare_at_price_cents : 0
    const costCents = typeof formData.cost_per_item_cents === 'number' ? formData.cost_per_item_cents : 0
    
    // Use sale price if available, otherwise use MRP
    const effectivePrice = salePriceCents > 0 ? salePriceCents : mrpCents
    
    if (!effectivePrice || !costCents || effectivePrice <= 0 || costCents <= 0) return null
    const profit = effectivePrice - costCents
    const margin = (profit / effectivePrice) * 100
    return margin.toFixed(1)
  }

  const calculateMarkup = () => {
    // Use Sale Price (price_cents) for markup calculation, or MRP if no sale price
    const salePriceCents = typeof formData.price_cents === 'number' ? formData.price_cents : 0
    const mrpCents = typeof formData.compare_at_price_cents === 'number' ? formData.compare_at_price_cents : 0
    const costCents = typeof formData.cost_per_item_cents === 'number' ? formData.cost_per_item_cents : 0
    
    // Use sale price if available, otherwise use MRP
    const effectivePrice = salePriceCents > 0 ? salePriceCents : mrpCents
    
    if (!effectivePrice || !costCents || effectivePrice <= 0 || costCents <= 0) return null
    const profit = effectivePrice - costCents
    const markup = (profit / costCents) * 100
    return markup.toFixed(1)
  }

  // MRP Handler (now updates compare_at_price_cents)
  const handleMrpChange = (value: string) => {
    setMrpInput(value)
  }

  const handleMrpBlur = () => {
    if (mrpInput === '') {
      onInputChange('compare_at_price_cents', null)
      setMrpInput('')
    } else {
      const numValue = parseFloat(mrpInput)
      if (!isNaN(numValue) && numValue >= 0) {
        onInputChange('compare_at_price_cents', Math.round(numValue * 100))
        setMrpInput(numValue.toFixed(2))
      }
    }
  }

  // Sale Price Handler (now updates price_cents)
  const handleSalePriceChange = (value: string) => {
    setSalePriceInput(value)
  }

  const handleSalePriceBlur = () => {
    if (salePriceInput === '') {
      onInputChange('price_cents', null)
      setSalePriceInput('')
    } else {
      const numValue = parseFloat(salePriceInput)
      if (!isNaN(numValue) && numValue >= 0) {
        onInputChange('price_cents', Math.round(numValue * 100))
        setSalePriceInput(numValue.toFixed(2))
      }
    }
  }

  // Cost Handler (stays the same)
  const handleCostChange = (value: string) => {
    setCostInput(value)
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

  // Check if profit margin should be shown (MRP + Cost must be filled)
  const showProfitCalculations = () => {
    const mrpCents = typeof formData.compare_at_price_cents === 'number' ? formData.compare_at_price_cents : 0
    const costCents = typeof formData.cost_per_item_cents === 'number' ? formData.cost_per_item_cents : 0
    return mrpCents > 0 && costCents > 0
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* MRP (Required) - NOW mapped to compare_at_price_cents */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            MRP (₹) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">₹</span>
            </div>
            <input
              type="text"
              value={mrpInput}
              onChange={(e) => handleMrpChange(e.target.value)}
              onBlur={handleMrpBlur}
              className={`pl-7 w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.compare_at_price_cents ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0.00"
              required
            />
          </div>
          {errors.compare_at_price_cents && (
            <p className="mt-1 text-sm text-red-600">{errors.compare_at_price_cents}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Maximum Retail Price (Required)
          </p>
        </div>

        {/* Sale Price (Optional) - NOW mapped to price_cents */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sale Price (₹)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">₹</span>
            </div>
            <input
              type="text"
              value={salePriceInput}
              onChange={(e) => handleSalePriceChange(e.target.value)}
              onBlur={handleSalePriceBlur}
              className="pl-7 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0.00"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Discounted price (Optional). Leave blank if no discount.
          </p>
        </div>

        {/* Cost per Item (Same) */}
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

      {/* Profit Calculations Display - Only show when MRP and Cost are filled */}
      {showProfitCalculations() && (
        <div className="mt-4 space-y-2">
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              <span className="font-medium">Profit Margin:</span> {calculateProfitMargin()}%
              <span className="text-xs text-green-600 ml-2">(Profit as % of selling price)</span>
            </p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Markup:</span> {calculateMarkup()}%
              <span className="text-xs text-blue-600 ml-2">(Profit as % of cost price)</span>
            </p>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-xs text-blue-800">
          <strong>💡 How pricing works:</strong> MRP (₹500) is the original price shown crossed out. Sale Price (₹480) is the actual price customers pay. If no sale price is entered, customers will pay the MRP.
        </p>
      </div>
    </div>
  )
}
