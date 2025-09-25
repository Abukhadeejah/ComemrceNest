'use client'
import { useState } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SenlyshLoginPage() {
  const supabase = supabaseClient
  const router = useRouter()
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
      password 
    })
    setLoading(false)
    
    if (error) {
      setError(error.message)
      return
    }

    if (data.user && data.session) {
      // Check if this is an admin user (hard-coded admin emails)
      const emailToTenant: Record<string, string> = {
        'admin@bluebell.in': 'bluebell',
        'admin@senlysh.in': 'senlysh',
      }
      
      const tenantKey = emailToTenant[data.user.email || '']
      if (tenantKey) {
        // Admin user - redirect to admin panel
        router.replace(`/${tenantKey}/admin`)
        return
      }

      // Customer user - redirect to profile page
      router.replace('/senlysh/profile')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-6 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Senlysh</h1>
          <p className="text-gray-600">Sign in to your account to continue shopping</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input 
              id="email"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all duration-200" 
              type="email" 
              autoComplete="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input 
              id="password"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all duration-200" 
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
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-pink-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-8 text-center space-y-4">
          <p className="text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/senlysh/register" className="text-pink-600 hover:text-pink-700 font-semibold">
              Create one
            </Link>
          </p>
          
          {/* Removed admin access hint for end-user login */}
        </div>
      </div>
    </div>
  )
}
