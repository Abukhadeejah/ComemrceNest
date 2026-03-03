'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Playfair_Display } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700', '800', '900'] })

export default function CheckoutCancelPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className={`${playfair.className} text-3xl font-bold text-gray-900 mb-4`}>Payment Cancelled</h1>
          <p className="text-gray-600 mb-6">
            Your payment was cancelled. No amount has been charged.
          </p>
          {orderId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Order ID</p>
              <p className="font-mono text-sm font-semibold text-gray-900">{orderId}</p>
            </div>
          )}
          <div className="space-y-3">
            <Link
              href="/checkout"
              className="block w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try Payment Again
            </Link>
            <Link
              href="/cart"
              className="block w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Cart
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
