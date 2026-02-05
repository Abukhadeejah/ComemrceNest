'use client'

import { useState, useEffect } from 'react'
import { X, Crown, Check, Sparkles, Gift, Zap } from 'lucide-react'

interface MembershipPricing {
  id: string
  durationMonths: number
  priceCents: number
  currency: string
  priceDisplay: string
  monthlyRate: string
  originalPrice?: string
  savings?: string
}

interface MembershipUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  customerId?: string
}

export default function MembershipUpgradeModal({ 
  isOpen, 
  onClose, 
  customerId 
}: MembershipUpgradeModalProps) {
  const [pricing, setPricing] = useState<MembershipPricing[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadPricing()
    }
  }, [isOpen])

  const loadPricing = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customers/membership/pricing', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setPricing(data.pricing)
        // Auto-select 3-month plan as default
        const threeMonthPlan = data.pricing.find((p: MembershipPricing) => p.durationMonths === 3)
        if (threeMonthPlan) {
          setSelectedPlan(threeMonthPlan.id)
        }
      }
    } catch (error) {
      console.error('Failed to load pricing:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async () => {
    if (!selectedPlan || !customerId) return

    try {
      setProcessingPayment(true)
      
      const selectedPricing = pricing.find(p => p.id === selectedPlan)
      if (!selectedPricing) return

      // Create payment intent
      const response = await fetch('/api/customers/membership/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          durationMonths: selectedPricing.durationMonths
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Redirect to PhonePe payment
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to initiate payment')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Failed to process payment')
    } finally {
      setProcessingPayment(false)
    }
  }

  if (!isOpen) return null

  const benefits = [
    {
      icon: <Sparkles className="h-5 w-5 text-purple-500" />,
      title: "5% Cashback on Orders",
      description: "Earn cashback on every purchase (min ₹500 order)"
    },
    {
      icon: <Gift className="h-5 w-5 text-pink-500" />,
      title: "Exclusive Deals",
      description: "Access to premium member-only discounts and offers"
    },
    {
      icon: <Zap className="h-5 w-5 text-yellow-500" />,
      title: "Priority Support",
      description: "Get faster customer service and priority order processing"
    },
    {
      icon: <Crown className="h-5 w-5 text-purple-500" />,
      title: "Premium Badge",
      description: "Show off your premium status with exclusive badges"
    }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Upgrade to Premium</h2>
              <p className="text-gray-600">Unlock exclusive benefits and cashback rewards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Benefits */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Premium Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3">
                {benefit.icon}
                <div>
                  <h4 className="font-medium text-gray-900">{benefit.title}</h4>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Plan</h3>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {pricing.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPlan === plan.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedPlan === plan.id
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedPlan === plan.id && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {plan.durationMonths} Month{plan.durationMonths > 1 ? 's' : ''}
                        </h4>
                        <p className="text-sm text-gray-600">{plan.monthlyRate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {plan.originalPrice && (
                          <span className="text-lg text-gray-400 line-through">{plan.originalPrice}</span>
                        )}
                        <div className="text-2xl font-bold text-gray-900">{plan.priceDisplay}</div>
                      </div>
                      {plan.savings && (
                        <div className="text-sm text-green-600 font-medium">{plan.savings}</div>
                      )}
                    </div>
                  </div>
                  
                  {plan.durationMonths === 3 && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      POPULAR
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Payment Button */}
          <div className="mt-6 pt-6 border-t">
            <button
              onClick={handleUpgrade}
              disabled={!selectedPlan || processingPayment || loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {processingPayment ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                `Upgrade Now - Pay with PhonePe`
              )}
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-2">
              Secure payment powered by PhonePe. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}