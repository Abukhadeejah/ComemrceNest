'use client'

import { useState, useEffect } from 'react'
import { Playfair_Display } from 'next/font/google'
import Link from 'next/link'
import { formatPrice } from '@/lib/cart'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700', '800', '900'] })

interface Order {
  id: string
  order_number: string
  status: 'pending' | 'paid' | 'failed' | 'shipped' | 'delivered'
  total_cents: number
  payment_provider: string
  created_at: string
  email: string
  cashback_earned?: number
}

interface CustomerProfile {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  created_at: string
}

interface WalletSummary {
  balance_cents: number
  total_earned: number
  total_redeemed: number
}

interface SenlyshAccountDashboardProps {
  customer: CustomerProfile
  tenantId: string
}

export default function SenlyshAccountDashboard({ customer }: SenlyshAccountDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'profile'>('overview')
  const [orders, setOrders] = useState<Order[]>([])
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAccountData()
  }, [])

  const loadAccountData = async () => {
    try {
      setLoading(true)
      
      // Load orders
      const ordersRes = await fetch('/api/customers/orders', { credentials: 'include' })
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        setOrders(ordersData.orders || [])
      }

      // Load wallet summary
      const walletRes = await fetch('/api/customers/wallet', { credentials: 'include' })
      if (walletRes.ok) {
        const walletData = await walletRes.json()
        const transactions = walletData.transactions || []
        
        const totalEarned = transactions
          .filter((t: any) => t.type === 'credit' || t.source_key?.includes('cashback'))
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
        
        const totalRedeemed = transactions
          .filter((t: any) => t.type === 'debit' || t.source_key?.includes('withdrawal'))
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0)

        setWalletSummary({
          balance_cents: walletData.wallet?.balance_cents || 0,
          total_earned: totalEarned,
          total_redeemed: totalRedeemed
        })
      }
    } catch (error) {
      console.error('Failed to load account data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'shipped': return 'bg-blue-100 text-blue-800'
      case 'delivered': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR' 
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-100">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const recentOrders = orders.slice(0, 3)
  const totalSpent = orders.reduce((sum, order) => sum + (order.total_cents / 100), 0)
  const currentBalance = walletSummary ? walletSummary.balance_cents / 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-100">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center mb-8">
          <h1 className={`${playfair.className} text-4xl font-bold text-gray-900 mb-3`}>My Account</h1>
          <div className="w-24 h-1 bg-gradient-to-r from-pink-600 to-purple-600 mx-auto rounded-full"></div>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {customer.first_name?.charAt(0) || customer.email.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{`${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Customer'}</h2>
              <p className="text-gray-600">{customer.email}</p>
              <p className="text-sm text-gray-500">Member since {formatDate(customer.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'overview', label: 'Overview', count: null },
                { key: 'orders', label: 'Order History', count: orders.length },
                { key: 'profile', label: 'Profile', count: null },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Account Overview</h3>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-pink-100 text-sm">Wallet Balance</p>
                        <p className="text-2xl font-bold">{formatCurrency(currentBalance)}</p>
                      </div>
                      <div className="text-3xl opacity-80">💳</div>
                    </div>
                    <div className="mt-4">
                      <Link 
                        href="/senlysh/wallet"
                        className="inline-flex items-center text-sm text-pink-100 hover:text-white"
                      >
                        View Wallet →
                      </Link>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                      </div>
                      <div className="text-3xl">📦</div>
                    </div>
                    <div className="mt-4">
                      <button 
                        onClick={() => setActiveTab('orders')}
                        className="inline-flex items-center text-sm text-pink-600 hover:text-pink-700"
                      >
                        View Orders →
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Total Spent</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
                      </div>
                      <div className="text-3xl">💰</div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">Lifetime purchases</p>
                    </div>
                  </div>
                </div>

                {/* Cashback Summary */}
                {walletSummary && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-green-900 mb-4">💎 Cashback Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-green-700 text-sm">Total Earned</p>
                        <p className="text-xl font-bold text-green-900">{formatCurrency(walletSummary.total_earned)}</p>
                      </div>
                      <div>
                        <p className="text-green-700 text-sm">Total Redeemed</p>
                        <p className="text-xl font-bold text-green-900">{formatCurrency(walletSummary.total_redeemed)}</p>
                      </div>
                      <div>
                        <p className="text-green-700 text-sm">Available Balance</p>
                        <p className="text-xl font-bold text-green-900">{formatCurrency(currentBalance)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Orders */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Recent Orders</h4>
                    {orders.length > 3 && (
                      <button 
                        onClick={() => setActiveTab('orders')}
                        className="text-pink-600 hover:text-pink-700 text-sm font-medium"
                      >
                        View All →
                      </button>
                    )}
                  </div>
                  
                  {recentOrders.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                      <div className="text-gray-400 text-4xl mb-2">📦</div>
                      <p className="text-gray-600">No orders yet</p>
                      <Link
                        href="/senlysh/products"
                        className="inline-block mt-3 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors text-sm"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentOrders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-semibold text-gray-900">Order #{order.order_number}</h5>
                              <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                            </div>
                            <div className="text-right">
                              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </div>
                              <p className="text-lg font-semibold text-gray-900 mt-1">{formatPrice(order.total_cents)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Order History</h3>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📦</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-600 mb-4">Start shopping to see your orders here</p>
                    <Link
                      href="/senlysh/products"
                      className="inline-block bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
                    >
                      Browse Products
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">Order #{order.order_number}</h4>
                            <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                          </div>
                          <div className="text-right">
                            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-semibold text-gray-900">{formatPrice(order.total_cents)}</p>
                            <p className="text-sm text-gray-600">via {order.payment_provider}</p>
                          </div>
                          <Link
                            href={`/orders/${order.order_number}`}
                            className="text-pink-600 hover:text-pink-700 text-sm font-medium"
                          >
                            View Details →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      {customer.first_name || 'Not provided'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      {customer.last_name || 'Not provided'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      {customer.email}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      {customer.phone || 'Not provided'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      {formatDate(customer.created_at)}
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Link
                    href="/senlysh/profile"
                    className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/senlysh/wallet"
            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                <span className="text-2xl">💳</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">My Wallet</h4>
                <p className="text-sm text-gray-600">View balance & transactions</p>
              </div>
            </div>
          </Link>

          <Link
            href="/senlysh/addresses"
            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <span className="text-2xl">📍</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Addresses</h4>
                <p className="text-sm text-gray-600">Manage delivery addresses</p>
              </div>
            </div>
          </Link>

          <Link
            href="/senlysh/products"
            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <span className="text-2xl">🛍️</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Continue Shopping</h4>
                <p className="text-sm text-gray-600">Explore our collection</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}