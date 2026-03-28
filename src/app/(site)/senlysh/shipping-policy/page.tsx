'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ShippingPolicyPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Shipping Policy</h1>
          <p className="text-sm text-gray-600">
            Version 2.0 | Effective Date: 1 March 2026 | Last Updated: 1 March 2026
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed mb-6">
            This Shipping Policy governs dispatch and delivery of products purchased from{' '}
            <Link href="https://senlysh.in" className="text-purple-600 hover:text-purple-700 underline">https://senlysh.in</Link>
            , owned and operated by MAFIAA WESTERN OUTFIT.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Shipping Coverage</h2>
            <p className="text-gray-700 leading-relaxed">We currently ship within India only. International shipping is governed separately.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Order Processing</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Orders are typically processed within 1-3 business days after successful payment confirmation.</li>
              <li>Processing may take longer during peak demand, sales, or special campaigns.</li>
              <li>Made-to-order or special collection items may need additional processing time.</li>
              <li>Order confirmation does not constitute final acceptance.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Delivery Timeline</h2>
            <p className="text-gray-700 leading-relaxed mb-3">Standard delivery timelines are generally 3-10 business days depending on destination.</p>
            <p className="text-gray-700 leading-relaxed">Timelines are estimates and may vary due to courier norms, weather, holidays, government restrictions, or force majeure events.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Shipping Charges</h2>
            <p className="text-gray-700 leading-relaxed">Shipping charges (if applicable) are shown at checkout and are non-refundable except in verified manufacturing defect or Company error cases.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. COD Misuse Policy</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Repeated COD refusals may result in COD restriction or permanent suspension.</li>
              <li>Prepaid payment may be required for future high-risk orders.</li>
              <li>Re-shipping charges may apply for repeated refusals.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Delivery Address Responsibility</h2>
            <p className="text-gray-700 leading-relaxed mb-3">Orders are delivered to the address provided at checkout. Customers must provide complete and accurate details and remain reachable.</p>
            <p className="text-gray-700 leading-relaxed">Incorrect addresses, repeated failures, or unavailability may result in additional shipping charges for re-dispatch.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Risk of Loss</h2>
            <p className="text-gray-700 leading-relaxed">Risk of loss and title pass to the customer upon successful delivery confirmation at the provided address.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Partial Shipments</h2>
            <p className="text-gray-700 leading-relaxed">We may deliver orders in multiple shipments due to stock availability or operational reasons.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Damaged or Tampered Packages</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Inspect your package at the time of delivery.</li>
              <li>If visibly tampered/damaged, refuse delivery or report within 24 hours with clear photo/video proof.</li>
              <li>Late reporting may affect claim eligibility.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Force Majeure</h2>
            <p className="text-gray-700 leading-relaxed">We are not liable for delivery delays or failures caused by events beyond reasonable control, including natural disasters, transport interruptions, government action, or public emergencies.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Communication & Tracking</h2>
            <p className="text-gray-700 leading-relaxed">Once shipped, tracking details are shared via registered email or SMS. Customers should monitor shipment progress using provided tracking links.</p>
          </section>

          <section className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-2"><strong>MAFIAA WESTERN OUTFIT</strong></p>
            <p className="text-gray-700 leading-relaxed mb-2">SHOP NO 1, NARMADA SMRUTI, CABIN ROAD, BHAYANDER EAST, THANE, MAHARASHTRA - 401105, Mumbai, India</p>
            <p className="text-gray-700 leading-relaxed">For shipping-related queries, use the official contact page.</p>
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
            <Link href="/senlysh/terms" className="text-gray-600 hover:text-purple-600 transition-colors duration-200">
              Terms & Conditions
            </Link>
            <Link href="/senlysh/refund-policy" className="text-gray-600 hover:text-purple-600 transition-colors duration-200">
              Return & Refund Policy
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
