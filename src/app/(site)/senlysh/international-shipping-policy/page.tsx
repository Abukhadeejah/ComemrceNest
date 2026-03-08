'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function InternationalShippingPolicyPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">International Shipping Policy</h1>
          <p className="text-sm text-gray-600">
            Version 2.0 | Effective Date: 1 March 2026 | Last Updated: 1 March 2026
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed mb-6">
            This Policy governs international orders placed on{' '}
            <Link href="https://senlysh.in" className="text-purple-600 hover:text-purple-700 underline">https://senlysh.in</Link>
            , owned and operated by MAFIAA WESTERN OUTFIT.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. International Shipping Availability</h2>
            <p className="text-gray-700 leading-relaxed">We offer international shipping to select countries serviced by authorized global logistics partners. Availability may vary by regulations and operational feasibility.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Order Processing & Dispatch</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>International orders are typically processed within 2-5 business days after payment verification.</li>
              <li>Orders are dispatched only after complete payment confirmation.</li>
              <li>We dispatch complete orders only; partial shipments may be made where operationally necessary.</li>
              <li>We may hold or cancel orders under fraud prevention protocols.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Delivery Timeline</h2>
            <p className="text-gray-700 leading-relaxed mb-3">Estimated delivery is 7-21 business days after dispatch, depending on destination and customs clearance.</p>
            <p className="text-gray-700 leading-relaxed">Delays may occur due to customs, import regulations, carrier delays, public holidays, or force majeure events.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Shipping Charges</h2>
            <p className="text-gray-700 leading-relaxed">Charges are calculated at checkout based on destination and weight. Charges are non-refundable once dispatched.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Customs, Duties & Taxes</h2>
            <p className="text-gray-700 leading-relaxed mb-3">Import duties, customs charges, VAT/sales taxes, and clearance handling fees are the sole responsibility of the recipient.</p>
            <p className="text-gray-700 leading-relaxed">If shipment is refused/abandoned due to unpaid customs fees, return shipping costs and penalties may be deducted from any eligible refund.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. No Return / No Exchange (International)</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>International orders are not eligible for return or exchange.</li>
              <li>Orders cannot be cancelled once dispatched.</li>
              <li>In exceptional verified manufacturing defect cases, resolution is at sole Company discretion.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Anti-Chargeback & Fraud Prevention</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Identity/address verification or additional documents may be requested before dispatch.</li>
              <li>High-risk orders may be cancelled without prior notice.</li>
              <li>False chargebacks are contested with shipment/verification records.</li>
              <li>Fraudulent chargebacks may lead to blacklisting and legal action.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Risk of Loss & Title</h2>
            <p className="text-gray-700 leading-relaxed">Risk of loss and title pass once shipment is handed to the international carrier. Dispatch and tracking records constitute proof of fulfillment.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Delivery Failure & Address Responsibility</h2>
            <p className="text-gray-700 leading-relaxed">Customers must provide accurate details and remain reachable for customs communication. Failed delivery due to incorrect address, unavailability, or refusal does not make the Company liable for shipping/customs losses.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Tracking Information</h2>
            <p className="text-gray-700 leading-relaxed">Tracking details are shared by registered email after dispatch. Customers are responsible for monitoring status and coordinating with local customs where required.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Force Majeure</h2>
            <p className="text-gray-700 leading-relaxed">We are not liable for delays/failure caused by government restrictions, customs holds, transport interruptions, natural disasters, or political/economic disruptions.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law & Dispute Resolution</h2>
            <p className="text-gray-700 leading-relaxed">This Policy is governed by laws of India. Disputes are subject to exclusive jurisdiction of competent courts in Mumbai, Maharashtra.</p>
          </section>

          <section className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-2"><strong>MAFIAA WESTERN OUTFIT</strong></p>
            <p className="text-gray-700 leading-relaxed mb-2">SHOP NO 1, NARMADA SMRUTI, CABIN ROAD, BHAYANDER EAST, THANE, MAHARASHTRA - 401105, Mumbai, India</p>
            <p className="text-gray-700 leading-relaxed">For assistance, use the official contact page or registered support email.</p>
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
            <Link href="/senlysh/shipping-policy" className="text-gray-600 hover:text-purple-600 transition-colors duration-200">
              Domestic Shipping
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
