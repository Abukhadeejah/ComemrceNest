'use client'

import { useState, useEffect } from 'react'
import { GiftIcon, PlusIcon } from '@heroicons/react/24/outline'

interface Coupon {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  valid_from: string
  valid_until: string
  is_active: boolean
  created_at: string
}

export default function CouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load coupons
  const loadCoupons = async () => {
    try {
      const response = await fetch('/api/admin/coupons')
      if (response.ok) {
        const data = await response.json()
        setCoupons(data.coupons || [])
      } else {
        setError('Failed to load coupons')
      }
    } catch (error) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCoupons()
  }, [])

  // Toggle coupon active status
  const toggleCouponStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      })

      if (response.ok) {
        loadCoupons() // Refresh the list
      } else {
        setError('Failed to update coupon status')
      }
    } catch (error) {
      setError('Network error')
    }
  }

  // Delete coupon
  const deleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadCoupons() // Refresh the list
      } else {
        setError('Failed to delete coupon')
      }
    } catch (error) {
      setError('Network error')
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Discount Coupons</h1>
          <p className="text-gray-600 mt-2">Create and manage discount codes for your customers</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <CreateCouponForm 
            onSuccess={() => {
              setShowCreateForm(false)
              loadCoupons()
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {/* Coupon List */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Active Coupons</h2>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                New Coupon
              </button>
            </div>
            
            {coupons.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <GiftIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No coupons yet</p>
                <p className="text-sm">Create your first discount coupon to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Code</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Discount</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Valid Until</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {coupons.map((coupon) => (
                      <tr key={coupon.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono font-bold text-blue-600">{coupon.code}</td>
                        <td className="px-4 py-3">
                          {coupon.discount_type === 'percentage' 
                            ? `${coupon.discount_value}%` 
                            : `₹${coupon.discount_value}`
                          }
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(coupon.valid_until).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            coupon.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {coupon.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleCouponStatus(coupon.id, coupon.is_active)}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {coupon.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => deleteCoupon(coupon.id)}
                              className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateCouponForm({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    valid_until: '',
    min_order_value: '',
    max_discount_amount: '' // Only for percentage
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Prepare data for API
      const apiData = {
        code: formData.code,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        max_discount_cents: formData.max_discount_amount ? Math.round(parseFloat(formData.max_discount_amount) * 100) : null,
        min_order_value_cents: formData.min_order_value ? Math.round(parseFloat(formData.min_order_value) * 100) : 0,
        valid_until: formData.valid_until,
        uses_per_customer: 1 // Default to 1 use per customer
      }

      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData)
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create coupon')
      }
    } catch (error) {
      setError('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  // Generate random coupon code
  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    setFormData({ ...formData, code })
  }

  return (
    <div className="mb-6 bg-white rounded-lg shadow border p-6">
      <h3 className="text-lg font-semibold mb-6">Create New Coupon</h3>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Coupon Code */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3">📝 Step 1: Coupon Code</h4>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                placeholder="SAVE20"
                maxLength={15}
              />
              <p className="text-xs text-gray-600 mt-1">
                This is what customers will type to get the discount
              </p>
            </div>
            <button
              type="button"
              onClick={generateCode}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              Generate
            </button>
          </div>
        </div>

        {/* Step 2: Discount Amount */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-3">💰 Step 2: How much discount?</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Type
              </label>
              <select
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="percentage">Percentage (%) - e.g., 20% off</option>
                <option value="fixed">Fixed Amount (₹) - e.g., ₹100 off</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.discount_type === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'}
              </label>
              <input
                type="number"
                required
                min="1"
                max={formData.discount_type === 'percentage' ? '99' : undefined}
                step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder={formData.discount_type === 'percentage' ? '20' : '100'}
              />
              <p className="text-xs text-gray-600 mt-1">
                {formData.discount_type === 'percentage' 
                  ? 'Enter number without % sign (e.g., 20 for 20% off)'
                  : 'Enter amount in rupees (e.g., 100 for ₹100 off)'
                }
              </p>
            </div>
          </div>

          {/* Max discount for percentage */}
          {formData.discount_type === 'percentage' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Discount Limit (₹) - Optional
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={formData.max_discount_amount}
                onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="500"
              />
              <p className="text-xs text-gray-600 mt-1">
                Example: If you set 20% off with ₹500 limit, a ₹5000 order gets ₹500 off (not ₹1000)
              </p>
            </div>
          )}
        </div>

        {/* Step 3: Rules */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-3">📋 Step 3: Rules (Optional)</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Order Value (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.min_order_value}
                onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="1000"
              />
              <p className="text-xs text-gray-600 mt-1">
                Customer must spend at least this much to use coupon
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid Until
              </label>
              <input
                type="date"
                required
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-gray-600 mt-1">
                Coupon will stop working after this date
              </p>
            </div>
          </div>
        </div>

        {/* Preview */}
        {formData.code && formData.discount_value && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">👀 Preview</h4>
            <div className="bg-white border-2 border-dashed border-blue-300 rounded-lg p-3 inline-block">
              <div className="font-mono font-bold text-blue-600 text-lg">{formData.code}</div>
              <div className="text-sm text-gray-600">
                {formData.discount_type === 'percentage' 
                  ? `${formData.discount_value}% OFF`
                  : `₹${formData.discount_value} OFF`
                }
                {formData.min_order_value && ` on orders above ₹${formData.min_order_value}`}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            {submitting ? 'Creating...' : 'Create Coupon'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}