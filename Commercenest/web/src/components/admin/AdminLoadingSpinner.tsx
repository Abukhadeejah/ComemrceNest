'use client'

import { useEffect, useState } from 'react'

interface AdminLoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

export function AdminLoadingSpinner({ 
  message = 'Loading...', 
  size = 'md',
  fullScreen = false 
}: AdminLoadingSpinnerProps) {
  const [showSpinner, setShowSpinner] = useState(false)

  // Show spinner after a small delay to avoid flash for fast loads
  useEffect(() => {
    const timer = setTimeout(() => setShowSpinner(true), 100)
    return () => clearTimeout(timer)
  }, [])

  if (!showSpinner) return null

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  }

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50'
    : 'flex items-center justify-center p-8'

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-3">
        <div className="relative">
          <div className={`${sizeClasses[size]} border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin`}></div>
        </div>
        <p className="text-sm text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  )
}

// Quick loading component for inline use
export function InlineLoadingSpinner({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className={`${sizeClasses[size]} border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin`}></div>
  )
}

// Button loading state component
export function ButtonLoadingSpinner() {
  return (
    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
  )
}
