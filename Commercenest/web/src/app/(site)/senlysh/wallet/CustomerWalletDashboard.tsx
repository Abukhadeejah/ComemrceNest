'use client'

import { useState, useEffect, useMemo } from 'react'
import { WalletAccount, WalletLedgerEntry } from '@/types/customer'

// Extended type for wallet entry with aliases
type WalletEntryWithAliases = WalletLedgerEntry & {
  type?: 'credit' | 'debit' | 'cashback' | 'refund'
  amount?: number
  description?: string
  balance_after?: number
}

type FilterType = 'all' | 'credit' | 'debit' | 'cashback' | 'refund'
type Period = 'all' | '30d'

export default function CustomerWalletDashboard() {
  const [wallet, setWallet] = useState<WalletAccount | null>(null)
  const [transactions, setTransactions] = useState<WalletLedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [period, setPeriod] = useState<Period>('all')

  useEffect(() => { loadWalletData() }, [])

  const loadWalletData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customers/wallet', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setWallet(data.wallet)
        setTransactions(data.transactions || [])
      } else {
        setError('Failed to load wallet data')
      }
    } catch {
      setError('Failed to load wallet data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit': return '💰'
      case 'debit': return '💸'
      case 'cashback': return '🎁'
      case 'refund': return '↩️'
      default: return '💳'
    }
  }

  // Derive a display type from entry_type and source_key conventions
  const deriveDisplayType = (t: WalletEntryWithAliases): FilterType => {
    const base = (t.type || t.entry_type) as string
    const source = String(t.source_key || '')
    if (source.includes('cashback')) return 'cashback'
    if (source.includes('refund')) return 'refund'
    return (base === 'credit' || base === 'debit') ? (base as FilterType) : 'all'
  }
  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit':
      case 'cashback':
      case 'refund':
        return 'text-green-600'
      case 'debit':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const filtered = useMemo(() => {
    let list = transactions.map(t => ({ ...t, __displayType: deriveDisplayType(t as WalletEntryWithAliases) }))
    if (filterType !== 'all') list = list.filter((t: WalletEntryWithAliases & { __displayType: string }) => t.__displayType === filterType)
    if (period === '30d') {
      const since = Date.now() - 30 * 24 * 60 * 60 * 1000
      list = list.filter((t: WalletEntryWithAliases) => new Date(t.created_at).getTime() >= since)
    }
    return list
  }, [transactions, filterType, period])

  const totals = useMemo(() => {
    const sum = (type?: FilterType) => filtered
      .filter((t: WalletEntryWithAliases & { __displayType: string }) => !type || t.__displayType === type)
      .reduce((acc, t) => {
        const entry = t as WalletEntryWithAliases
        const amount = (entry.amount ?? (entry.amount_cents / 100)) || 0
        return acc + amount
      }, 0)
    return { credits: sum('credit'), debits: sum('debit'), cashback: sum('cashback'), count: filtered.length }
  }, [filtered])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-pink-100/60 h-28 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        <div className="space-y-2">
          <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  if (error) return <div className="bg-red-50 border border-red-200 rounded-md p-4"><p className="text-red-800">{error}</p></div>

  const currentBalance = wallet ? ((wallet as WalletAccount & { balance?: number; balance_cents?: number }).balance ?? ((wallet as WalletAccount & { balance_cents?: number }).balance_cents ?? 0) / 100) : 0

  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium opacity-90">Wallet Balance</h2>
            <p className="text-3xl font-bold">{formatCurrency(currentBalance)}</p>
            <p className="text-sm opacity-80 mt-1">Available for In Store Purchase Only</p>
          </div>
          <div className="text-4xl opacity-80">💳</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center">
            <div className="text-2xl mr-3">💰</div>
            <div>
              <p className="text-sm text-gray-600">Credits (selected)</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(totals.credits)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center">
            <div className="text-2xl mr-3">💸</div>
            <div>
              <p className="text-sm text-gray-600">Debits (selected)</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(totals.debits)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🎁</div>
            <div>
              <p className="text-sm text-gray-600">Cashback (selected)</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(totals.cashback)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          {([
            { key: 'all', label: 'All' },
            { key: 'credit', label: 'Credits' },
            { key: 'debit', label: 'Debits' },
            { key: 'cashback', label: 'Cashback' },
          ] as { key: FilterType, label: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm border ${filterType === tab.key ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Period</label>
          <select value={period} onChange={e => setPeriod(e.target.value as Period)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
            <option value="all">All time</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
          <span className="text-sm text-gray-600">{totals.count} items</span>
        </div>
        <div className="divide-y divide-gray-200">
          {filtered.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="text-4xl mb-3">💳</div>
              <p className="text-gray-500 mb-1">No transactions match your filters</p>
              <p className="text-xs text-gray-400">Try switching to another type or time period</p>
            </div>
          ) : (
            filtered.map((transaction: WalletEntryWithAliases & { __displayType: string }) => {
              const type = transaction.__displayType || transaction.type || transaction.entry_type || 'credit'
              const amount = (transaction.amount ?? (transaction.amount_cents / 100)) || 0
              const running = transaction.balance_after ?? 0
              return (
                <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-2xl mr-4">{getTransactionIcon(type)}</div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{String(type).replace('_', ' ')}</p>
                        <p className="text-sm text-gray-600">{transaction.description || '—'}</p>
                        <p className="text-xs text-gray-500">{formatDate(transaction.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${getTransactionColor(type)}`}>
                        {type === 'debit' ? '-' : '+'}{formatCurrency(amount)}
                      </p>
                      <p className="text-xs text-gray-500">Balance: {formatCurrency(running)}</p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-pink-50 border border-pink-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-pink-900 mb-4">How Your Wallet Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-pink-800">
          <div>
            <h4 className="font-medium mb-2">💰 Earn Cashback</h4>
            <p>Get cashback on every purchase you make. The amount is automatically added to your wallet.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">💸 Use Your Balance</h4>
            <p>Use your wallet balance to pay for future purchases or withdraw to your bank account.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">🎁 Special Rewards</h4>
            <p>Receive bonus rewards for referrals, reviews, and special promotions.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">📊 Track Everything</h4>
            <p>Monitor all your transactions and see how much you&apos;ve earned over time.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
