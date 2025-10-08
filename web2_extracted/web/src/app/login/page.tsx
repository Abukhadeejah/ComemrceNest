"use client"
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    
    if (error) {
      setError(error.message)
      return
    }

    if (data.user && data.session) {
      // Simple email-based tenant mapping for login redirect
      const emailToTenant: Record<string, string> = {
        'admin@bluebell.in': 'bluebell',
        'admin@senlysh.in': 'senlysh',
      }
      
      const tenantKey = emailToTenant[data.user.email || '']
      if (tenantKey) {
        router.replace(`/${tenantKey}/admin`)
      } else {
        setError('No tenant access found for this email')
      }
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-xl font-semibold">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm">Email</label>
          <input 
            className="w-full rounded border p-2" 
            type="email" 
            autoComplete="email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">Password</label>
          <input 
            className="w-full rounded border p-2" 
            type="password" 
            autoComplete="current-password"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button 
          type="submit"
          disabled={loading} 
          className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-60 hover:bg-gray-800"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      
      <div className="mt-4 text-center text-sm text-gray-600">
        <p>Contact your super admin for account access</p>
      </div>
    </main>
  )
}


