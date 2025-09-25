'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabaseClient'

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = supabaseClient
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    if (data.user && data.session) {
      const resp = await fetch('/api/auth/admin-tenant', { cache: 'no-store' })
      if (resp.ok) {
        const json = await resp.json()
        if (json?.tenantKey) {
          router.replace(`/${json.tenantKey}/admin`)
          return
        }
      }
      await supabase.auth.signOut()
      setError('Admin access only. Please use your tenant login page.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-6 bg-gray-900 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Sign In</h1>
          <p className="text-gray-600">Enter your admin credentials to continue</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <input
              id="email"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-gray-900 focus:ring-2 focus:ring-gray-200 transition-all duration-200"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input
              id="password"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-gray-900 focus:ring-2 focus:ring-gray-200 transition-all duration-200"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Your password"
            />
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white font-semibold py-3 px-6 rounded-xl hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}




