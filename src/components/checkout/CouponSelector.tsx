'use client'

import { useState, useEffect } from 'react'
import { TagIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface Coupon {
  id: string
  code: string
  description: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_discount_cents?: number
  min_order_value_cents: number
  valid_until: string
}

interface CouponSelectorProps {
  orderTotal: number
  onCouponSelected: (discount: { amount: number; code: string; description?: string; id: string }) => void
  onCouponRemoved: () => void
  selectedCoupon?: { code: string; discount: number; description?: string; id: string } | null
}

export default function CouponSelector({ 
  orderTotal, 
  onCouponSelected, 
  onCouponRemoved, 
  selectedCoupon 
}: CouponSelectorProps) {
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load available coupons
  useEffect(() => {
    loadAvailableCoupons()
  }, [orderTotal])

  const loadAvailableCoupons = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/coupons/available', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderValue: orderTotal })
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableCoupons(data.coupons || [])
      } else {
        setError('Failed to load available coupons')
      }
    } catch (error) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const selectCoupon = async (coupon: Coupon) => {
    try {
      const response = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: coupon.code,
          orderValue: orderTotal
        })
      })

      const data = await response.json()

      if (data.valid) {
        onCouponSelected({
          amount: data.discount.amount_rupees,
          code: data.coupon.code,
          description: data.coupon.description,
          id: data.coupon.id
        })
      } else {
        setError(data.error || 'Failed to apply coupon')
      }
    } catch (error) {
      setError('Failed to apply coupon')
    }
  }

  const calculateDiscount = (coupon: Coupon) => {
    const orderValueCents = Math.round(orderTotal * 100)
    let discountAmount = 0

    if (coupon.discount_type === 'percentage') {
      discountAmount = (orderValueCents * coupon.discount_value) / 100
      
      if (coupon.max_discount_cents && discountAmount > coupon.max_discount_cents) {
        discountAmount = coupon.max_discount_cents
      }
    } else {
      discountAmount = coupon.discount_value * 100
    }

    return Math.min(discountAmount, orderValueCents) / 100
  }

  if (selectedCoupon) {
    return (
      <div className="relative">
        {/* Applied Coupon Card - Compact */}
        <div className="relative bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-dashed border-green-400">
          {/* Corner Cuts - Smaller */}
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-gray-50 rounded-full border-2 border-dashed border-green-400"></div>
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-gray-50 rounded-full border-2 border-dashed border-green-400"></div>
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gray-50 rounded-full border-2 border-dashed border-green-400"></div>
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-gray-50 rounded-full border-2 border-dashed border-green-400"></div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
              <div>
                <div className="text-xl font-bold text-green-700 font-mono tracking-wider">
                  {selectedCoupon.code}
                </div>
                <div className="text-sm font-semibold text-green-600">
                  APPLIED ✓
                </div>
                <div className="mt-1">
                  <span className="inline-block bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                    Saved: ₹{selectedCoupon.discount.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onCouponRemoved}
              className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded text-sm font-medium transition-colors border border-red-300"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
          <TagIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Available Coupons</h3>
          <p className="text-sm text-gray-600">Select a coupon to apply discount</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-32 border-2 border-dashed border-gray-300"></div>
          ))}
        </div>
      ) : availableCoupons.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="w-16 h-16 mx-auto mb-3 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <TagIcon className="h-8 w-8 text-gray-300" />
          </div>
          <p className="font-medium">No coupons available</p>
          <p className="text-sm">Add more items to unlock discounts</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {availableCoupons.map((coupon) => {
            const discount = calculateDiscount(coupon)
            const isEligible = orderTotal * 100 >= coupon.min_order_value_cents
            
            return (
              <div
                key={coupon.id}
                className={`relative transition-all duration-200 ${
                  isEligible 
                    ? 'cursor-pointer hover:scale-105 hover:-translate-y-1' 
                    : 'cursor-not-allowed opacity-60'
                }`}
                onClick={() => isEligible && selectCoupon(coupon)}
              >
                {/* Coupon Card with Dashed Border */}
                <div className={`
                  relative bg-white rounded-lg p-4 
                  border-2 border-dashed 
                  ${isEligible ? 'border-blue-400 shadow-lg hover:shadow-2xl' : 'border-gray-300'}
                  transition-all duration-200
                  ${isEligible ? 'hover:bg-blue-50' : ''}
                `}>
                  {/* Corner Cuts - Smaller */}
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-gray-50 rounded-full border-2 border-dashed border-blue-400"></div>
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-gray-50 rounded-full border-2 border-dashed border-blue-400"></div>
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gray-50 rounded-full border-2 border-dashed border-blue-400"></div>
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-gray-50 rounded-full border-2 border-dashed border-blue-400"></div>
                  
                  <div className="text-center">
                    {/* Coupon Code - Smaller but still prominent */}
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-blue-600 font-mono tracking-wide">
                        {coupon.code}
                      </h3>
                      <div className="text-lg font-bold text-gray-800 mt-1">
                        {coupon.discount_type === 'percentage' 
                          ? `${coupon.discount_value}% OFF`
                          : `₹${coupon.discount_value} OFF`
                        }
                      </div>
                    </div>
                    
                    {/* Savings Amount */}
                    <div className="mb-3">
                      <div className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                        Save ₹{discount.toFixed(0)}
                      </div>
                    </div>
                    
                    {/* Coupon Details - Compact */}
                    <div className="space-y-1">
                      {coupon.min_order_value_cents > 0 && (
                        <div className="text-xs text-gray-500">
                          Min: ₹{coupon.min_order_value_cents / 100}
                        </div>
                      )}
                      
                      {!isEligible && (
                        <div className="text-xs text-red-600 font-medium">
                          Add ₹{((coupon.min_order_value_cents - orderTotal * 100) / 100).toFixed(0)} more
                        </div>
                      )}
                    </div>
                    
                    {/* Apply Button - Compact */}
                    {isEligible && (
                      <div className="mt-3">
                        <button className="w-full bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-semibold hover:bg-blue-700 transition-colors">
                          Apply
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          🎫 Click any coupon to apply discount
        </p>
      </div>
    </div>
  )
}