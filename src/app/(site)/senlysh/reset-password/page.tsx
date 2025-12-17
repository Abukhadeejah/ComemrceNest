'use client'
import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import { PasswordInput } from '@/components/PasswordInput'

export default function SenlyshResetPasswordPage() {
  const supabase = supabaseClient
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    // Handle the auth callback
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        setError('Invalid or expired reset link')
      }
    }
    
    handleAuthCallback()
  }, [supabase.auth])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }
    
    const { error } = await supabase.auth.updateUser({
      password: password
    })
    
    setLoading(false)
    
    if (error) {
      setError(error.message)
      return
    }

    setMessage('Password updated successfully! Redirecting to login...')
    setTimeout(() => {
      router.push('/senlysh/login')
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-6 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600">Enter your new password below</p>
        </div>

        {message ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <p className="text-green-600 text-sm">{message}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                New Password
              </label>
              <PasswordInput
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                autoComplete="new-password"
                className="border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all duration-200"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm New Password
              </label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                autoComplete="new-password"
                className="border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all duration-200"
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
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}