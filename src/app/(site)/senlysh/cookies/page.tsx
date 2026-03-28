'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CookiePolicyPage() {
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/senlysh');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <button
          onClick={handleGoBack}
          className="mb-8 flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors duration-200 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Go Back</span>
        </button>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
          <p className="text-sm text-gray-600">Version 1.0 | Effective Date: 1 March 2026</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed mb-6">
            This Cookie Policy explains how MAFIAA WESTERN OUTFIT ("Company", "we", "our", "us") uses cookies and similar technologies on{' '}
            <Link href="https://senlysh.in" className="text-purple-600 hover:text-purple-700 underline">https://senlysh.in</Link>.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. What Are Cookies?</h2>
            <p className="text-gray-700 leading-relaxed mb-3">Cookies are small text files placed on your device when you visit a website.</p>
            <p className="text-gray-700 leading-relaxed mb-3">They help us enable core functionality, improve user experience, analyze traffic patterns, remember preferences, and provide relevant content.</p>
            <p className="text-gray-700 leading-relaxed">Cookies do not typically contain personally identifiable information but may be linked to information you provide.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Types of Cookies We Use</h2>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">A. Strictly Necessary Cookies</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Secure login</li>
              <li>Cart functionality</li>
              <li>Payment processing</li>
              <li>Fraud detection</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">B. Performance & Analytics Cookies</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Pages visited</li>
              <li>Time spent on site</li>
              <li>Traffic source</li>
              <li>Device type</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">C. Functional Cookies</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Preferred currency</li>
              <li>Language</li>
              <li>Region preferences</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">D. Advertising & Marketing Cookies</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Deliver relevant ads</li>
              <li>Cap ad frequency</li>
              <li>Measure campaign effectiveness</li>
              <li>Retarget viewed products</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Third-Party Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-3">Trusted third parties (payments, analytics, ads, logistics) may set cookies on your device.</p>
            <p className="text-gray-700 leading-relaxed">We do not control third-party cookie policies. Please review their privacy policies separately.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Consent & Cookie Management</h2>
            <p className="text-gray-700 leading-relaxed mb-3">By continuing to use our Platform, you consent to cookie usage as described here.</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Block/delete cookies via browser settings</li>
              <li>Disable certain categories where available</li>
              <li>Withdraw consent where legally applicable</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">Blocking cookies may impact site functionality and shopping experience.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">Cookies may exist for one browsing session (session cookies) or remain for a defined period (persistent cookies), based on operational necessity.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Security & Data Protection</h2>
            <p className="text-gray-700 leading-relaxed">We use reasonable safeguards for cookie-collected data. Internet transmission always includes inherent risks.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Updates to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">We may revise this Cookie Policy for legal, technology, or business updates. Revised versions will be posted with updated effective dates.</p>
          </section>

          <section className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">For cookie or data usage questions, contact us through the official contact details available on the Platform.</p>
          </section>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors duration-200 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Go Back</span>
          </button>

          <div className="flex gap-4">
            <Link href="/senlysh/privacy" className="text-gray-600 hover:text-purple-600 transition-colors duration-200">
              Privacy Policy
            </Link>
            <Link href="/senlysh/terms" className="text-gray-600 hover:text-purple-600 transition-colors duration-200">
              Terms & Conditions
            </Link>
            <Link href="/senlysh/contact" className="text-gray-600 hover:text-purple-600 transition-colors duration-200">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
