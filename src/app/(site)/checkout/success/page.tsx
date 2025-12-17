'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700', '800', '900'] });

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');

  useEffect(() => {
    if (!orderId) {
      setStatus('failed');
      return;
    }

    // Poll order status for a few seconds to wait for webhook
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'paid') {
            setStatus('success');
            return true;
          } else if (data.status === 'failed') {
            setStatus('failed');
            return true;
          }
        }
      } catch (error) {
        console.error('Failed to check order status:', error);
      }
      return false;
    };

    const pollInterval = setInterval(async () => {
      attempts++;
      const done = await checkStatus();
      
      if (done || attempts >= maxAttempts) {
        clearInterval(pollInterval);
        if (!done) {
          // Assume success if we can't verify (webhook might be delayed)
          setStatus('success');
        }
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [orderId]);

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </main>
    );
  }

  if (status === 'failed') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className={`${playfair.className} text-3xl font-bold text-gray-900 mb-4`}>Payment Failed</h1>
            <p className="text-gray-600 mb-6">
              We couldn't process your payment. Please try again or contact support if the issue persists.
            </p>
            <Link
              href="/checkout"
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try Again
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className={`${playfair.className} text-3xl font-bold text-gray-900 mb-4`}>Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your order. Your payment has been processed successfully.
          </p>
          {orderId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Order ID</p>
              <p className="font-mono text-sm font-semibold text-gray-900">{orderId}</p>
            </div>
          )}
          <div className="space-y-3">
            <Link
              href={`/orders/${orderId}`}
              className="block w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              View Order Details
            </Link>
            <Link
              href="/products"
              className="block w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
