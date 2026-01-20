'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Coupon {
  id: string
  code: string
  description: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_discount_cents?: number
  valid_from: string
  valid_until: string
  min_order_value_cents: number
  max_uses?: number
  uses_per_customer: number
  is_active: boolean
  created_at: string
  total_uses?: number
  total_discount_given_cents?: number
}

export default function CouponsPageContent() {
  const router = useRouter()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    // Store rupees in the form; convert to paise when sending to API
    max_discount_rupees: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    min_order_value_rupees: '',
    max_uses: '',
    uses_per_customer: '1'
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadCoupons()
  }, [])

  const getTenantKey = () => {
    try {
      const path = typeof window !== 'undefined' ? window.location.pathname : ''
      const seg = path.split('/').filter(Boolean)[0]
      if (seg && ['bluebell', 'senlysh'].includes(seg.toLowerCase())) return seg.toLowerCase()
      const match = typeof document !== 'undefined' ? document.cookie.match(/(?:^|; )tenant=([^;]+)/) : null
      if (match) return decodeURIComponent(match[1])
    } catch {}
    return ''
  }

  const loadCoupons = async () => {
    try {
      const tenant = getTenantKey()
      const response = await fetch('/api/admin/coupons', {
        headers: tenant ? { 'x-tenant-admin': tenant } : undefined,
      })
      if (response.ok) {
        const data = await response.json()
        setCoupons(data.coupons || [])
      }
    } catch (error) {
      console.error('Failed to load coupons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // If code is blank, auto-generate a coupon code
      const finalCode = (formData.code || '').trim() || generateRandomCode()

      // Convert rupees to paise for API fields that expect paise
      const maxDiscountCents = formData.max_discount_rupees
        ? Math.max(0, Math.round(parseFloat(formData.max_discount_rupees) * 100))
        : null
      const minOrderValueCents = formData.min_order_value_rupees
        ? Math.max(0, Math.round(parseFloat(formData.min_order_value_rupees) * 100))
        : 0

      const tenant = getTenantKey()
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(tenant ? { 'x-tenant-admin': tenant } : {}) },
        body: JSON.stringify({
          code: finalCode.toUpperCase().trim(),
          description: formData.description,
          discount_type: formData.discount_type,
          discount_value: parseFloat(formData.discount_value),
          max_discount_cents: maxDiscountCents,
          valid_from: new Date(formData.valid_from).toISOString(),
          valid_until: new Date(formData.valid_until + 'T23:59:59').toISOString(),
          min_order_value_cents: minOrderValueCents,
          max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
          uses_per_customer: parseInt(formData.uses_per_customer)
        })
      })

      if (response.ok) {
        setSuccess('Coupon created successfully!')
        setShowCreateForm(false)
        setFormData({
          code: '',
          description: '',
          discount_type: 'percentage',
          discount_value: '',
          max_discount_rupees: '',
          valid_from: new Date().toISOString().split('T')[0],
          valid_until: '',
          min_order_value_rupees: '',
          max_uses: '',
          uses_per_customer: '1'
        })
        loadCoupons()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create coupon')
      }
    } catch (error) {
      setError('An error occurred while creating the coupon')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const tenant = getTenantKey()
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(tenant ? { 'x-tenant-admin': tenant } : {}) },
        body: JSON.stringify({ is_active: !isActive })
      })

      if (response.ok) {
        loadCoupons()
      }
    } catch (error) {
      console.error('Failed to toggle coupon status:', error)
    }
  }

  const deleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return

    try {
      const tenant = getTenantKey()
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: tenant ? { 'x-tenant-admin': tenant } : undefined,
      })

      if (response.ok) {
        setSuccess('Coupon deleted successfully')
        loadCoupons()
      }
    } catch (error) {
      console.error('Failed to delete coupon:', error)
    }
  }

  const formatPrice = (cents: number) => {
    return `₹${(cents / 100).toFixed(2)}`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  function generateRandomCode(length = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let out = ''
    for (let i = 0; i < length; i++) {
      out += chars[Math.floor(Math.random() * chars.length)]
    }
    return out
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Discount Coupons</h1>
            <p className="text-gray-600 mt-1">Create and manage discount codes for your customers</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold shadow-lg transition-colors"
          >
            {showCreateForm ? 'Cancel' : '+ New Coupon'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Create New Coupon</h2>
            <p className="text-sm text-gray-500 mt-1">Fields marked with <span className="text-red-600 font-semibold">*</span> are required</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coupon Code (optional with Generate) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Coupon Code <span className="text-gray-500 text-xs">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Leave empty or click Generate"
                    className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 uppercase"
                    maxLength={32}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, code: generateRandomCode() })}
                    className="shrink-0 bg-gray-900 text-white px-4 py-3 rounded-lg hover:bg-black transition-colors"
                    title="Generate code"
                  >
                    Generate
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Leave blank to auto-generate a code on save.</p>
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Discount Type <span className="text-red-600 font-semibold">*</span>
                </label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              {/* Discount Value */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Discount Value <span className="text-red-600 font-semibold">*</span> {formData.discount_type === 'percentage' ? '(%)' : '(₹)'}
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  max={formData.discount_type === 'percentage' ? '100' : undefined}
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  placeholder={formData.discount_type === 'percentage' ? '20' : '100'}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Max Discount (for percentage, in ₹) */}
              {formData.discount_type === 'percentage' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Max Discount Cap (₹) <span className="text-gray-500 text-xs">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.max_discount_rupees}
                    onChange={(e) => setFormData({ ...formData, max_discount_rupees: e.target.value })}
                    placeholder="e.g., 100"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter in rupees. Leave empty for no cap.</p>
                </div>
              )}

              {/* Valid From */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Valid From <span className="text-red-600 font-semibold">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Valid Until */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Valid Until <span className="text-red-600 font-semibold">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Min Order Value (₹) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Min Order Value (₹) <span className="text-gray-500 text-xs">(optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.min_order_value_rupees}
                  onChange={(e) => setFormData({ ...formData, min_order_value_rupees: e.target.value })}
                  placeholder="e.g., 500"
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <p className="text-xs text-gray-500 mt-1">Enter in rupees. 0 = no minimum</p>
              </div>

              {/* Max Uses */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Max Total Uses <span className="text-gray-500 text-xs">(optional)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  placeholder="Leave empty for unlimited"
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Uses Per Customer */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Uses Per Customer <span className="text-red-600 font-semibold">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.uses_per_customer}
                  onChange={(e) => setFormData({ ...formData, uses_per_customer: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-gray-500 text-xs">(optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Internal notes about this coupon"
                  rows={3}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-400 transition-colors"
              >
                {submitting ? 'Creating...' : 'Create Coupon'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {coupons.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-lg">No coupons created yet</p>
            <p className="text-gray-400 text-sm mt-2">Click "New Coupon" to create your first discount code</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Code</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Discount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Valid Period</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Usage</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-mono font-bold text-blue-600">{coupon.code}</p>
                        {coupon.description && (
                          <p className="text-xs text-gray-500 mt-1">{coupon.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold">
                          {coupon.discount_type === 'percentage' 
                            ? `${coupon.discount_value}%`
                            : formatPrice(coupon.discount_value * 100)
                          }
                        </p>
                        {coupon.discount_type === 'percentage' && coupon.max_discount_cents && (
                          <p className="text-xs text-gray-500">Cap: {formatPrice(coupon.max_discount_cents)}</p>
                        )}
                        {coupon.min_order_value_cents > 0 && (
                          <p className="text-xs text-gray-500">Min: {formatPrice(coupon.min_order_value_cents)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <p>{formatDate(coupon.valid_from)}</p>
                        <p className="text-gray-500">to {formatDate(coupon.valid_until)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <p className="font-semibold">{coupon.total_uses || 0} times</p>
                        {coupon.max_uses && (
                          <p className="text-gray-500">of {coupon.max_uses} max</p>
                        )}
                        {coupon.total_discount_given_cents && (
                          <p className="text-xs text-green-600 mt-1">
                            {formatPrice(coupon.total_discount_given_cents)} saved
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        coupon.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {coupon.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleActive(coupon.id, coupon.is_active)}
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
  )
}
