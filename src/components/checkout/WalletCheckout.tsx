/**
 * CHECKOUT WITH WALLET PAYMENT COMPONENT
 * 
 * Features:
 * - Wallet balance display
 * - Wallet amount slider (max = wallet balance)
 * - Real-time cashback preview
 * - Payment split visualization
 */

'use client'

import { useState, useEffect } from 'react'
import { formatRupees } from '@/lib/cashback/cashbackEngine'

interface CheckoutItem {
  productId: string
  productName: string
  quantity: number
  priceCents: number
  costCents: number
}

interface WalletCheckoutProps {
  customerId: string
  items: CheckoutItem[]
  onSubmit: (data: {
    walletUsedRupees: number
    cashPaidRupees: number
  }) => void
}

interface WalletData {
  balance: {
    cents: number
    rupees: string
    formatted: string
  }
}

interface CashbackPreview {
  eligible: boolean
  reason?: string
  profitPct: number
  cashbackPct: number
  cashbackAmount: number
}

export default function WalletCheckout({ customerId, items, onSubmit }: WalletCheckoutProps) {
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [walletUsedRupees, setWalletUsedRupees] = useState(0)
  const [cashbackPreview, setCashbackPreview] = useState<CashbackPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Calculate order total
  const orderTotalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0)
  const orderTotalRupees = orderTotalCents / 100
  
  const totalCostCents = items.reduce((sum, item) => sum + item.costCents * item.quantity, 0)
  
  const maxWalletUsageRupees = Math.min(
    walletData?.balance.cents ? walletData.balance.cents / 100 : 0,
    orderTotalRupees
  )
  
  const cashPaidRupees = orderTotalRupees - walletUsedRupees
  
  // Fetch wallet balance
  useEffect(() => {
    async function fetchWalletBalance() {
      try {
        const response = await fetch(`/api/wallet?customerId=${customerId}`)
        const data = await response.json()
        
        if (response.ok) {
          setWalletData(data)
        } else {
          console.error('Failed to fetch wallet:', data.error)
        }
      } catch (error) {
        console.error('Error fetching wallet:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchWalletBalance()
  }, [customerId])
  
  // Preview cashback when wallet usage changes
  useEffect(() => {
    async function previewCashback() {
      if (walletUsedRupees < 0 || walletUsedRupees > maxWalletUsageRupees) {
        setCashbackPreview(null)
        return
      }
      
      try {
        const response = await fetch('/api/wallet/preview-cashback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId,
            totalSalePriceCents: orderTotalCents,
            totalPurchasePriceCents: totalCostCents,
            walletUsedCents: Math.round(walletUsedRupees * 100),
            cashPaidCents: Math.round(cashPaidRupees * 100)
          })
        })
        
        const data = await response.json()
        
        if (response.ok) {
          setCashbackPreview(data)
        }
      } catch (error) {
        console.error('Error previewing cashback:', error)
      }
    }
    
    const debounce = setTimeout(previewCashback, 300)
    return () => clearTimeout(debounce)
  }, [walletUsedRupees, customerId, orderTotalCents, totalCostCents, cashPaidRupees, maxWalletUsageRupees])
  
  const handleSubmit = () => {
    setSubmitting(true)
    onSubmit({
      walletUsedRupees,
      cashPaidRupees
    })
  }
  
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Wallet Balance</p>
            <p className="text-3xl font-bold">{walletData?.balance.formatted || '₹0.00'}</p>
          </div>
          <svg 
            className="w-12 h-12 opacity-80" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" 
            />
          </svg>
        </div>
      </div>
      
      {/* Order Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
        
        <div className="space-y-2 mb-4">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {item.productName} × {item.quantity}
              </span>
              <span className="font-medium">
                {formatRupees(item.priceCents * item.quantity / 100)}
              </span>
            </div>
          ))}
        </div>
        
        <div className="border-t pt-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatRupees(orderTotalRupees)}</span>
          </div>
        </div>
      </div>
      
      {/* Wallet Slider */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Use Wallet Balance</h3>
        
        <div className="space-y-4">
          {/* Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                Amount from wallet
              </label>
              <span className="text-lg font-bold text-blue-600">
                {formatRupees(walletUsedRupees)}
              </span>
            </div>
            
            <input
              type="range"
              min="0"
              max={maxWalletUsageRupees}
              step="1"
              value={walletUsedRupees}
              onChange={(e) => setWalletUsedRupees(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              disabled={maxWalletUsageRupees === 0}
            />
            
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>₹0</span>
              <span>{formatRupees(maxWalletUsageRupees)}</span>
            </div>
          </div>
          
          {/* Payment Split Visualization */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Wallet Payment</p>
              <p className="text-xl font-bold text-blue-600">
                {formatRupees(walletUsedRupees)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {walletUsedRupees > 0 ? 'No cashback on this' : 'Not using wallet'}
              </p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Cash Payment</p>
              <p className="text-xl font-bold text-green-600">
                {formatRupees(cashPaidRupees)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {cashPaidRupees > 0 ? 'Eligible for cashback' : 'Paid from wallet'}
              </p>
            </div>
          </div>
          
          {/* Quick Select Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setWalletUsedRupees(0)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              No Wallet
            </button>
            <button
              type="button"
              onClick={() => setWalletUsedRupees(maxWalletUsageRupees / 2)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={maxWalletUsageRupees === 0}
            >
              Half Wallet
            </button>
            <button
              type="button"
              onClick={() => setWalletUsedRupees(maxWalletUsageRupees)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={maxWalletUsageRupees === 0}
            >
              Max Wallet
            </button>
          </div>
        </div>
      </div>
      
      {/* Cashback Preview */}
      {cashbackPreview && (
        <div className={`rounded-lg p-6 ${
          cashbackPreview.eligible 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">
                {cashbackPreview.eligible ? '🎉 Cashback Preview' : 'ℹ️ Cashback Status'}
              </h3>
              {cashbackPreview.eligible ? (
                <>
                  <p className="text-sm text-gray-600 mt-1">
                    Profit: {cashbackPreview.profitPct.toFixed(2)}% → 
                    Cashback: {cashbackPreview.cashbackPct}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Calculated on cash paid only
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-600 mt-1">
                  {cashbackPreview.reason || 'No cashback available'}
                </p>
              )}
            </div>
            {cashbackPreview.eligible && (
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">
                  {formatRupees(cashbackPreview.cashbackAmount / 100)}
                </p>
                <p className="text-xs text-gray-500">Will be credited</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={submitting || cashPaidRupees < 0}
        className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? 'Processing...' : `Pay ${formatRupees(orderTotalRupees)}`}
      </button>
      
      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Cashback is calculated ONLY on the cash amount you pay, 
          not on the wallet amount used. Use less wallet to maximize cashback!
        </p>
      </div>
    </div>
  )
}
