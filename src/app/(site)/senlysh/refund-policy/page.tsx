'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RefundAndReturnPolicyPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Return, Exchange & Refund Policy</h1>
          <p className="text-sm text-gray-600">
            Version 2.0 | Effective Date: 01 March 2026 | Last Updated: 01 March 2026
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed mb-6">
            This Policy governs purchases on{' '}
            <Link href="https://senlysh.in" className="text-purple-600 hover:text-purple-700 underline">https://senlysh.in</Link>
            , operated by MAFIAA WESTERN OUTFIT.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Order Cancellation Policy</h2>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">1.1 Cancellation Window</h3>
            <p className="text-gray-700 leading-relaxed mb-3">Orders may be cancelled within 24 hours of placement, only if not processed.</p>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">1.2 Non-Cancellable Orders</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Order has been processed or packed</li>
              <li>Order has been dispatched</li>
              <li>Shipment is out for delivery</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">If refused at delivery, reverse logistics and handling charges may be deducted.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Exchange Policy (Allowed)</h2>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">2.1 Exchange Window</h3>
            <p className="text-gray-700 leading-relaxed mb-3">Exchange requests must be raised within 5 days from date of delivery.</p>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">2.2 Exchange Eligibility</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Unused, unwashed, unaltered item</li>
              <li>Original tags intact</li>
              <li>Original packaging available</li>
              <li>Invoice available</li>
              <li>No signs of wear, perfume, stains, or damage</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">Products failing quality inspection will be rejected and returned to the customer.</p>
            <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">2.3 Exchange Conditions</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Size issue (subject to stock availability)</li>
              <li>Verified defect or damage</li>
              <li>Wrong item received</li>
              <li>Only one exchange per order is permitted</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">If requested size is unavailable, store credit (E-Wallet) may be issued.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Return Policy (Strictly Limited)</h2>
            <p className="text-gray-700 leading-relaxed mb-3">General returns are not accepted.</p>
            <p className="text-gray-700 leading-relaxed mb-3">Return is accepted only for verified manufacturing defect, damaged product, or wrong item delivered.</p>
            <p className="text-gray-700 leading-relaxed">Claims must be reported within 48 hours with clear unboxing video and photo proof.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Non-Returnable / Non-Exchangeable Items</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Belts</li>
              <li>Perfumes & Deodorants</li>
              <li>Handkerchiefs</li>
              <li>Socks</li>
              <li>Caps</li>
              <li>Room Fresheners</li>
              <li>Innerwear</li>
              <li>Accessories</li>
              <li>Clearance / Final Sale items</li>
              <li>Items marked Non-Returnable at purchase</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Refund Policy</h2>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">5.1 Refund Mode Clarification</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Defective/Damaged/Wrong item: refund to original payment method.</li>
              <li>Size exchange unavailable or approved non-defect case: refund to Senlysh E-Wallet.</li>
              <li>COD orders: refund to verified bank account or Senlysh E-Wallet after verification.</li>
              <li>Original shipping charges are non-refundable.</li>
            </ul>
            <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">5.2 E-Wallet Terms</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>No expiry</li>
              <li>Non-transferable</li>
              <li>Cannot be withdrawn as cash</li>
              <li>Usable only on senlysh.in</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Refund Processing Timeline</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Reverse pickup quality inspection: 2-4 business days</li>
              <li>Refund initiation: within 7 business days after approval</li>
              <li>Bank posting timeline depends on payment provider</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Shipping & Deductions</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Original shipping charges are non-refundable</li>
              <li>Return shipping may be deducted unless claim is approved as defect/wrong item</li>
              <li>COD handling fees may be deducted where applicable</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Right to Refuse Return / Exchange</h2>
            <p className="text-gray-700 leading-relaxed mb-3">We may refuse return/exchange for used, washed, altered, tag-removed, customer-damaged, or fraudulent claims.</p>
            <p className="text-gray-700 leading-relaxed">Rejected returns may be re-shipped to the customer at customer cost.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Fraud & Abuse Prevention</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Excessive return/exchange behavior may lead to account restriction</li>
              <li>False defect claims may result in permanent blocking</li>
              <li>Invalid chargebacks will be contested with delivery/inspection proof</li>
              <li>Legal action may be initiated for deliberate misuse</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Sale & Discount Policy</h2>
            <p className="text-gray-700 leading-relaxed">Products purchased in clearance/flash/special promotions may not be eligible for exchange/refund unless defective or wrong.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Important Customer Advisory</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Check size chart and product details carefully before ordering.</li>
              <li>Minor color variation due to screen differences is not a defect.</li>
              <li>Keep active contact details for smooth delivery coordination.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">To the maximum extent permitted by law, we are not liable for indirect/consequential damages, loss of profit, emotional distress, or third-party logistics delays.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Governing Law & Jurisdiction</h2>
            <p className="text-gray-700 leading-relaxed">This Policy is governed by laws of India. Disputes are subject to exclusive jurisdiction of courts in Mumbai, Maharashtra.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Policy Updates</h2>
            <p className="text-gray-700 leading-relaxed">We may modify this Policy at any time. Updated versions are effective upon publication on the Platform.</p>
          </section>

          <section className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Customer Support</h2>
            <p className="text-gray-700 leading-relaxed mb-2"><strong>Email:</strong> helpdesk@senlysh.in</p>
            <p className="text-gray-700 leading-relaxed mb-2"><strong>WhatsApp:</strong> +91 7977439669</p>
            <p className="text-gray-700 leading-relaxed"><strong>Business Name:</strong> MAFIAA WESTERN OUTFIT</p>
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
            <Link href="/senlysh/privacy" className="text-gray-600 hover:text-purple-600 transition-colors duration-200">
              Privacy Policy
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
