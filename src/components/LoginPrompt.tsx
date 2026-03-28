'use client'

import { useRouter } from 'next/navigation'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface LoginPromptProps {
  isOpen: boolean
  onClose: () => void
  message?: string
  redirectTo?: string
}

export function LoginPrompt({ 
  isOpen, 
  onClose, 
  message = 'Please sign in to continue',
  redirectTo 
}: LoginPromptProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleLogin = () => {
    const loginUrl = redirectTo 
      ? `/senlysh/login?redirect=${encodeURIComponent(redirectTo)}`
      : '/senlysh/login'
    router.push(loginUrl)
  }

  const handleRegister = () => {
    const registerUrl = redirectTo 
      ? `/senlysh/register?redirect=${encodeURIComponent(redirectTo)}`
      : '/senlysh/register'
    router.push(registerUrl)
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-indigo-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                />
              </svg>
            </div>
          </div>

          {/* Content */}
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Sign In Required
          </h2>
          <p className="text-center text-gray-600 mb-6">
            {message}
          </p>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleLogin}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={handleRegister}
              className="w-full bg-white text-indigo-600 py-3 px-4 rounded-lg font-medium border-2 border-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              Create Account
            </button>
            <button
              onClick={onClose}
              className="w-full text-gray-600 py-2 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Continue Browsing
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
