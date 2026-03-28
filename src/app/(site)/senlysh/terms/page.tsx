'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsAndConditionsPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms & Conditions</h1>
          <p className="text-sm text-gray-600">
            Version 2.0 | Effective Date: 1 March 2026 | Last Updated: 1 March 2026
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 prose prose-gray max-w-none">
          <section className="mb-8">
            <p className="text-gray-700 leading-relaxed mb-4">
              This electronic record is published in accordance with the provisions of the Information Technology Act, 2000 and applicable rules made thereunder in India.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By accessing, browsing, or purchasing from{' '}
              <Link href="https://senlysh.in" className="text-purple-600 hover:text-purple-700 underline">
                https://senlysh.in
              </Link>{' '}
              (the Platform), you agree to be legally bound by these Terms & Conditions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Platform Owner</h2>
            <p className="text-gray-700 leading-relaxed mb-3">MAFIAA WESTERN OUTFIT</p>
            <p className="text-gray-700 leading-relaxed mb-3">SHOP NO 1, NARMADA SMRUTI, CABIN ROAD, BHAYANDER EAST, THANE, MAHARASHTRA - 401105, Mumbai, India</p>
            <p className="text-gray-700 leading-relaxed">(Hereinafter referred to as "Company", "we", "our", "us")</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-3">These Terms apply along with our Privacy Policy, Shipping Policy, Return & Refund Policy, Cancellation Policy, and Disclaimer. These policies form an integral part of this agreement.</p>
            <p className="text-gray-700 leading-relaxed">If you do not agree, please do not use this Platform.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Eligibility</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>You are at least 18 years of age.</li>
              <li>You are legally capable of entering into binding contracts.</li>
              <li>All information provided by you is true and accurate.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Account Responsibility</h2>
            <p className="text-gray-700 leading-relaxed mb-3">You are responsible for maintaining confidentiality of your account credentials and all activity performed through your account.</p>
            <p className="text-gray-700 leading-relaxed">We may suspend or terminate accounts with false, misleading, or fraudulent information.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Product Information & Representation</h2>
            <p className="text-gray-700 leading-relaxed mb-3">We strive to display product colors, design, and details as accurately as possible.</p>
            <p className="text-gray-700 leading-relaxed">Minor variations due to screen resolution, lighting conditions, or fabric batch differences do not qualify as defects.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Pricing & GST</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>All prices are listed in INR.</li>
              <li>GST shall be applicable as per Indian tax laws.</li>
              <li>We reserve the right to cancel and refund orders affected by pricing errors, typographical mistakes, or technical glitches.</li>
              <li>Order confirmation email does not constitute final acceptance of the order.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Order Acceptance & Cancellation Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-3">We may refuse or cancel any order at our sole discretion, including due to stock unavailability, pricing errors, suspicious transactions, repeated return abuse, multiple COD refusals, or policy violations.</p>
            <p className="text-gray-700 leading-relaxed">If payment was made, the amount will be refunded to the original payment method.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. COD Misuse Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-3">Repeated COD order refusals may lead to permanent restriction of COD services.</p>
            <p className="text-gray-700 leading-relaxed">We may require advance payment from high-risk customers.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Fraud Prevention & Chargeback Protection</h2>
            <p className="text-gray-700 leading-relaxed mb-3">We actively monitor transactions for fraud and may verify identity, request additional documentation, or initiate legal action where required.</p>
            <p className="text-gray-700 leading-relaxed">Knowingly initiating false chargebacks or refund claims may result in legal proceedings under applicable Indian laws.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Shipping & Delivery</h2>
            <p className="text-gray-700 leading-relaxed">Shipping timelines are governed by our Shipping Policy. Risk of loss passes to the customer upon successful delivery confirmation. Force majeure events may affect timelines without Company liability.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Returns & Refunds</h2>
            <p className="text-gray-700 leading-relaxed">Returns and refunds are governed exclusively by our Return & Refund Policy.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">All logos, images, designs, text, graphics, and layout are the exclusive property of the Company. Unauthorized use may invite legal action.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Limitation of Liability</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>We are not liable for indirect, incidental, or consequential damages.</li>
              <li>Total liability shall not exceed the amount paid for the product in question.</li>
              <li>Nothing excludes liability that cannot be excluded under Indian law.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Indemnity</h2>
            <p className="text-gray-700 leading-relaxed">You agree to indemnify and hold harmless the Company and its affiliates from claims arising out of breach of these Terms, violation of applicable law, or infringement of third-party rights.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Force Majeure</h2>
            <p className="text-gray-700 leading-relaxed">We are not liable for delays or failure caused by events beyond reasonable control, including natural disasters, government restrictions, strikes, logistics disruption, or supply chain interruptions.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Governing Law & Jurisdiction</h2>
            <p className="text-gray-700 leading-relaxed">These Terms are governed by the laws of India. All disputes are subject to the exclusive jurisdiction of competent courts in Mumbai, Maharashtra.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. Grievance Redressal</h2>
            <p className="text-gray-700 leading-relaxed">In compliance with Consumer Protection (E-Commerce) Rules, 2020: Grievance Officer: [Name], Email: [Email ID], Response Time: Within 48 business hours.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">18. Modification of Terms</h2>
            <p className="text-gray-700 leading-relaxed">We reserve the right to modify these Terms at any time. Changes become effective from the date of publication on the Platform.</p>
          </section>

          <section className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">For terms-related concerns, please contact us via the official contact page on the Platform.</p>
            <div className="space-y-2">
              <p className="text-gray-800">
                <strong>Business:</strong> MAFIAA WESTERN OUTFIT
              </p>
              <p className="text-gray-800">
                <strong>Address:</strong> SHOP NO 1, NARMADA SMRUTI, CABIN ROAD, BHAYANDER EAST, THANE, MAHARASHTRA - 401105, Mumbai, India
              </p>
              <p className="text-gray-800"><strong>Contact:</strong> <Link href="/senlysh/contact" className="text-purple-600 hover:text-purple-700 underline">Official Contact Page</Link></p>
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
              href="/senlysh/privacy"
              className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <Link
              href="/senlysh/refund-policy"
              className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
            >
              Return & Refund Policy
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
