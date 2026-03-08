import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          href="/senlysh"
          className="mb-8 inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors duration-200 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Disclaimer</h1>
          <p className="text-sm text-gray-600">Version 1.0 | Effective Date: 8 March 2026</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed mb-6">
            This disclaimer governs the use of the Senlysh platform operated by MAFIAA WESTERN OUTFIT.
            By accessing or using this website, you agree to this disclaimer along with our Terms and
            Privacy Policy.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. General Information</h2>
            <p className="text-gray-700 leading-relaxed">
              All information on this website is provided in good faith for general informational and
              commercial purposes. While we aim to keep all information accurate and up to date, we do not
              guarantee completeness, reliability, or suitability of any content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Product Representation</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We attempt to display product colors, sizes, and details as accurately as possible. However,
              actual appearance may vary due to device displays, lighting, and manufacturing variations.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Product availability, pricing, and promotions may change without prior notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. External Links</h2>
            <p className="text-gray-700 leading-relaxed">
              Our website may include links to third-party websites or services. We do not control or
              endorse third-party content and are not responsible for any loss, damage, or issue arising
              from their use.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              To the maximum extent permitted by law, Senlysh and MAFIAA WESTERN OUTFIT will not be liable
              for any direct, indirect, incidental, special, or consequential damages resulting from use of,
              or inability to use, this platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. No Professional Advice</h2>
            <p className="text-gray-700 leading-relaxed">
              Content on this website is not legal, financial, medical, or professional advice. You should
              seek independent advice when required.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Updates to This Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this disclaimer from time to time for legal, operational, or business reasons.
              Updated versions will be posted on this page with a revised effective date.
            </p>
          </section>

          <section className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this disclaimer, please contact us through the details available on
              the Contact page.
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <Link
            href="/senlysh"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors duration-200 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>

          <div className="flex gap-4 flex-wrap justify-center">
            <Link href="/senlysh/terms" className="text-gray-600 hover:text-purple-600 transition-colors duration-200">
              Terms
            </Link>
            <Link href="/senlysh/privacy" className="text-gray-600 hover:text-purple-600 transition-colors duration-200">
              Privacy
            </Link>
            <Link href="/senlysh/cookies" className="text-gray-600 hover:text-purple-600 transition-colors duration-200">
              Cookies
            </Link>
            <Link href="/senlysh/contact" className="text-gray-600 hover:text-purple-600 transition-colors duration-200">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
