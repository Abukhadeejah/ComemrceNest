'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
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
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
          <p className="text-sm text-gray-600">
            Version 2.0 | Effective Date: 1 March 2026 | Last Updated: 1 March 2026
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              This Privacy Policy describes how MAFIAA WESTERN OUTFIT ("Company", "we", "our", "us") collects, uses, stores, protects, and processes your personal information through{' '}
              <Link href="https://senlysh.in" className="text-purple-600 hover:text-purple-700 underline">https://senlysh.in</Link> (the "Platform").
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              We are committed to safeguarding your privacy with transparency and integrity. This Policy is governed by the applicable laws of India.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By using the Platform, you agree to this Privacy Policy. If you do not agree, please refrain from using our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <p className="text-gray-700 leading-relaxed mb-3">We collect only the information necessary to provide and improve our services.</p>
            <p className="text-gray-700 leading-relaxed mb-2"><strong>Personal Information:</strong></p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Full name</li>
              <li>Email address</li>
              <li>Mobile number</li>
              <li>Billing and shipping address</li>
              <li>Order and transaction details</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-2"><strong>Payment Information:</strong></p>
            <p className="text-gray-700 leading-relaxed mb-4">Payments are processed through authorized third-party gateways. We do not store complete card details.</p>
            <p className="text-gray-700 leading-relaxed mb-2"><strong>Technical & Usage Information:</strong></p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>IP address</li>
              <li>Device type</li>
              <li>Browser information</li>
              <li>Website interaction data</li>
              <li>Cookies and analytics data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Process and deliver orders</li>
              <li>Provide customer support</li>
              <li>Improve website functionality and user experience</li>
              <li>Detect and prevent fraud or unauthorized transactions</li>
              <li>Comply with legal obligations</li>
              <li>Send order updates and service communications</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">Marketing messages are sent only where permitted by law, and you may opt out at any time.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Cookies & Analytics</h2>
            <p className="text-gray-700 leading-relaxed mb-3">We use cookies and similar technologies to improve your browsing experience, remember preferences, analyze traffic, and improve marketing performance.</p>
            <p className="text-gray-700 leading-relaxed">You may disable cookies through browser settings, though some features may not function properly.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Sharing of Information</h2>
            <p className="text-gray-700 leading-relaxed mb-3">We do not sell, rent, or trade your personal data.</p>
            <p className="text-gray-700 leading-relaxed mb-3">We may share data only with logistics partners, payment providers, technology/hosting partners, and legal or regulatory authorities where required by law.</p>
            <p className="text-gray-700 leading-relaxed">All such partners are required to maintain confidentiality and security standards.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Storage & Security</h2>
            <p className="text-gray-700 leading-relaxed mb-3">Your data is primarily stored and processed within India. We implement reasonable safeguards against unauthorized access, misuse, alteration, or disclosure.</p>
            <p className="text-gray-700 leading-relaxed">No method of internet transmission is completely secure, and inherent risks remain.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">We retain personal information only as long as required for business, legal, tax, regulatory, fraud-prevention, and service purposes. Anonymized data may be retained for analytics and research.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Your Rights</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Access your personal data</li>
              <li>Update or correct inaccuracies</li>
              <li>Request account deletion</li>
              <li>Withdraw consent (subject to legal limitations)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">Our Platform is intended for individuals aged 18 years or above. We do not knowingly collect data from minors.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Withdrawal of Consent</h2>
            <p className="text-gray-700 leading-relaxed">You may withdraw consent by writing to us. This will not affect prior lawful processing and may limit your ability to use certain services.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">We may update this Policy periodically to reflect legal or operational changes. Updated versions will be posted on this page with revised dates.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Grievance Redressal</h2>
            <p className="text-gray-700 leading-relaxed">Grievance Officer: [Name], Email: [Official Email Address], Response Time: Within 48 business hours.</p>
          </section>

          <section className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For privacy-related concerns, please contact us via the official contact page on the Platform.
            </p>
            <div className="space-y-2">
              <p className="text-gray-800">
                <strong>Company:</strong> MAFIAA WESTERN OUTFIT
              </p>
              <p className="text-gray-800">
                <strong>Address:</strong> SHOP NO 1, NARMADA SMRUTI, CABIN ROAD, BHAYANDER EAST, THANE, MAHARASHTRA - 401105, Mumbai, India
              </p>
              <p className="text-gray-800">
                <strong>Contact Page:</strong>{' '}
                <Link href="/senlysh/contact" className="text-purple-600 hover:text-purple-700 underline">
                  Contact Us
                </Link>
              </p>
            </div>
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
            <Link
              href="/senlysh/terms"
              className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
            >
              Terms & Conditions
            </Link>
            <Link
              href="/senlysh/cookies"
              className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
            >
              Cookie Policy
            </Link>
            <Link
              href="/senlysh/contact"
              className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
