'use client'

import { useState, useEffect } from 'react'
import { Crown, Clock, AlertTriangle, Sparkles } from 'lucide-react'

interface MembershipStatus {
  id: string | null
  membershipType: 'FREE' | 'PREMIUM' | null
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING' | null
  validUntil: string | null
  isTrial: boolean
  daysRemaining: number
  isActive: boolean
  expiresSoon: boolean
  needsUpgrade: boolean
}

interface MembershipStatusIndicatorProps {
  customerId?: string
  onUpgradeClick?: () => void
  className?: string
}

export default function MembershipStatusIndicator({ 
  customerId, 
  onUpgradeClick,
  className = '' 
}: MembershipStatusIndicatorProps) {
  const [membership, setMembership] = useState<MembershipStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (customerId) {
      loadMembershipStatus()
    } else {
      setLoading(false)
    }
  }, [customerId])

  const loadMembershipStatus = async () => {
    try {
      const response = await fetch('/api/customers/membership/status', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setMembership(data.membership)
      }
    } catch (error) {
      console.error('Failed to load membership status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 w-24 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (!customerId || !membership?.isActive || membership?.needsUpgrade) {
    return null // Remove the Get Premium button completely
  }

  const getStatusColor = () => {
    if (membership.needsUpgrade || membership.expiresSoon) return 'from-orange-500 to-red-500'
    if (membership.membershipType === 'FREE') return 'from-green-500 to-blue-500'
    return 'from-purple-500 to-pink-500'
  }

  const getStatusIcon = () => {
    if (membership.needsUpgrade || membership.expiresSoon) return <AlertTriangle className="h-4 w-4" />
    if (membership.membershipType === 'FREE') return <Sparkles className="h-4 w-4" />
    return <Crown className="h-4 w-4" />
  }

  const getStatusText = () => {
    if (membership.needsUpgrade) {
      return 'Expired'
    }
    if (membership.expiresSoon) {
      return `${membership.daysRemaining}d left`
    }
    if (membership.membershipType === 'FREE') {
      return `Free: ${membership.daysRemaining}d`
    }
    return `Premium: ${membership.daysRemaining}d`
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r ${getStatusColor()} text-white text-sm font-medium rounded-full shadow-sm`}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>
      
      {(membership.expiresSoon || membership.needsUpgrade) && (
        <button
          onClick={onUpgradeClick}
          className="flex items-center space-x-1 px-2 py-1 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors"
        >
          <Clock className="h-3 w-3" />
          <span>{membership.membershipType === 'FREE' ? 'Upgrade' : 'Renew'}</span>
        </button>
      )}
    </div>
  )
}