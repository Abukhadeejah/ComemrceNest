'use client'

import { useState } from 'react'
import { TagIcon } from '@heroicons/react/24/outline'

interface CouponInputProps {
  orderTotal: number
  onCouponApplied: (discount: { amount: number; code: string; description?: string }) => void
  onCouponRemoved: () => void
  appliedCoupon?: { code: string; discount: number; description?: string } | null
}

export default function CouponInput({ 
  orderTotal, 
  onCouponApplied, 
  onCouponRemoved, 
  appliedCoupon 
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateCoupon = async () => {
    if (!couponCode.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          orderValue: orderTotal
        })
      })

      const data = await response.json()

      if (data.valid) {
        onCouponApplied({
          amount: data.discount.amount_rupees,
          code: data.coupon.code,
          description: data.coupon.description
        })
        setCouponCode('')
      } else {
        setError(data.error || 'Invalid coupon code')
      }
    } catch (error) {
      setError('Failed to validate coupon')
    } finally {
      setLoading(false)
    }
  }

  const removeCoupon = () => {
    onCouponRemoved()
    setError(null)
  }

  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TagIcon className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">
                Coupon Applied: {appliedCoupon.code}
              </p>
              {appliedCoupon.description && (
                <p className="text-sm text-green-600">{appliedCoupon.description}</p>
              )}
              <p className="text-sm text-green-600">
                Discount: -₹{appliedCoupon.discount.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={removeCoupon}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Remove
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <TagIcon className="h-5 w-5 text-gray-400" />
        <h3 className="font-medium text-gray-900">Apply Coupon</h3>
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="Enter coupon code"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={loading}
        />
        <button
          onClick={validateCoupon}
          disabled={loading || !couponCode.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Checking...' : 'Apply'}
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Enter a valid coupon code to get discount on your order
      </p>
    </div>
  )
}