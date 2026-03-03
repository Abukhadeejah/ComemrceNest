'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700', '800', '900'] });

function getOrdersPath(): string {
  if (typeof window !== 'undefined') {
    const pathSegments = window.location.pathname.split('/').filter(Boolean)
    if (pathSegments.length > 0 && (pathSegments[0] === 'bluebell' || pathSegments[0] === 'senlysh')) {
      return `/${pathSegments[0]}/orders`
    }

    const cookies = document.cookie || ''
    const tenantCookie = /(?:^|; )tenant=([^;]+)/.exec(cookies)?.[1]
    if (tenantCookie === 'bluebell' || tenantCookie === 'senlysh') {
      return `/${tenantCookie}/orders`
    }
  }

  return '/senlysh/orders'
}

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const [redirectSeconds, setRedirectSeconds] = useState<number | null>(null);
  const ordersPath = getOrdersPath();

  useEffect(() => {
    if (!orderId) {
      setStatus('failed');
      return;
    }

    let attempts = 0;
    const maxAttempts = 8;
    let verifyAttempted = false;
    
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`);
        if (res.ok) {
          const data = await res.json();
          console.log(`[CheckoutSuccess] Order status check attempt ${attempts + 1}:`, data.status);
          
          if (data.status === 'paid') {
            setStatus('success');
            return true;
          } else if (data.status === 'failed') {
            setStatus('failed');
            return true;
          }
        }
      } catch (error) {
        console.error('[CheckoutSuccess] Failed to check order status:', error);
      }
      return false;
    };

    const verifyWithPhonePe = async () => {
      if (verifyAttempted) return false;
      verifyAttempted = true;
      setVerificationAttempted(true);
      
      try {
        console.log('[CheckoutSuccess] Webhook not received, verifying with PhonePe API...');
        
        const res = await fetch(`/api/orders/${orderId}/verify-payment`, {
          method: 'POST'
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log('[CheckoutSuccess] PhonePe verification result:', data);
          
          if (data.status === 'paid') {
            setStatus('success');
            return true;
          } else if (data.status === 'failed') {
            setStatus('failed');
            return true;
          }
        } else {
          console.error('[CheckoutSuccess] Verification failed:', await res.text());
        }
      } catch (error) {
        console.error('[CheckoutSuccess] Verification error:', error);
      }
      return false;
    };

    const pollInterval = setInterval(async () => {
      attempts++;
      const done = await checkStatus();
      
      // Periodically verify directly so status/cashback gets finalized quickly
      if (!done && !verifyAttempted && attempts >= 3) {
        const verified = await verifyWithPhonePe();
        if (verified) {
          clearInterval(pollInterval);
          return;
        }
      }

      if (done || attempts >= maxAttempts) {
        clearInterval(pollInterval);
        if (!done) {
          // Do not assume success silently; route user to orders where final status can be tracked
          setStatus('failed');
        }
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [orderId]);

  useEffect(() => {
    if (!orderId || (status !== 'success' && status !== 'failed')) {
      setRedirectSeconds(null);
      return;
    }

    setRedirectSeconds(5);
    const interval = setInterval(() => {
      setRedirectSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          router.push(ordersPath);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, orderId, router, ordersPath]);

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {verificationAttempted 
              ? 'Verifying payment with PhonePe...' 
              : 'Confirming your payment...'}
          </p>
          <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
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
              We could not process your payment. Please try again or contact support if the issue persists.
            </p>
            {orderId && (
              <p className="text-sm text-gray-500 mb-6">
                Redirecting to your orders in {redirectSeconds ?? 5}s...
              </p>
            )}
            <Link
              href={ordersPath}
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              View My Orders
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
            <p className="text-sm text-gray-500 mb-6">
              Redirecting to your orders in {redirectSeconds ?? 5}s...
            </p>
          )}
          {orderId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Order ID</p>
              <p className="font-mono text-sm font-semibold text-gray-900">{orderId}</p>
            </div>
          )}
          <div className="space-y-3">
            <Link
              href={ordersPath}
              className="block w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              View My Orders
            </Link>
            <Link
              href="/senlysh/products"
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
