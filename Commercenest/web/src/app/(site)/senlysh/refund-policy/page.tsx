'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, RotateCcw, DollarSign, Package, AlertCircle, CheckCircle, Clock } from 'lucide-react';
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
        {/* Go Back Button */}
        <button
          onClick={handleGoBack}
          className="mb-8 flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors duration-200 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Go Back</span>
        </button>

        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <RotateCcw className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Refund & Return Policy
            </h1>
          </div>
          <p className="text-sm text-gray-600">
            Last Updated: November 01, 2025
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <p className="text-gray-700 leading-relaxed">
            This refund and cancellation policy outlines how you can cancel or seek a refund for a product/service that you have purchased through the Platform.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 prose prose-gray max-w-none">
          
          {/* Cancellation Policy */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900 m-0">Cancellation Policy</h2>
            </div>

            <div className="space-y-4">
              {/* Cancellation Window */}
              <div className="bg-purple-50 border-l-4 border-purple-600 p-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">7-Day Cancellation Window</h3>
                    <p className="text-gray-700 text-sm">
                      Cancellations will only be considered if the request is made <strong>within 7 days</strong> of placing the order.
                    </p>
                  </div>
                </div>
              </div>

              {/* When Cancellations Cannot Be Made */}
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Cancellation Restrictions</h3>
                    <p className="text-gray-700 text-sm mb-2">
                      Cancellation requests may <strong>not be entertained</strong> if:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                      <li>Orders have been communicated to sellers/merchants listed on the Platform</li>
                      <li>Sellers have initiated the shipping process</li>
                      <li>The product is out for delivery</li>
                    </ul>
                    <p className="text-gray-700 text-sm mt-2">
                      In such cases, you may choose to <strong>reject the product at the doorstep</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Perishable Items */}
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-yellow-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Perishable Items</h3>
                    <p className="text-gray-700 text-sm">
                      MAFIAA WESTERN OUTFIT does <strong>not accept cancellation requests</strong> for perishable items like flowers, eatables, etc. However, the refund/replacement can be made if the user establishes that the quality of the product delivered is not good.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Refund Policy */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900 m-0">Refund Policy</h2>
            </div>

            <div className="space-y-4">
              {/* Damaged or Defective Items */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Damaged or Defective Items</h3>
                <p className="text-gray-700 text-sm mb-2">
                  In case of receipt of damaged or defective items, please report to our customer service team. The request would be entertained once the seller/merchant listed on the Platform has checked and determined the same at its own end.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-800">
                    Report within 7 days of receipt
                  </span>
                </div>
              </div>

              {/* Product Not as Expected */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Product Not as Expected</h3>
                <p className="text-gray-700 text-sm mb-2">
                  In case you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service <strong>within 7 days of receiving the product</strong>. The customer service team after looking into your complaint will take an appropriate decision.
                </p>
              </div>

              {/* Warranty Items */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Products with Manufacturer Warranty</h3>
                <p className="text-gray-700 text-sm">
                  In case of complaints regarding the products that come with a warranty from the manufacturers, please refer the issue to them directly.
                </p>
              </div>

              {/* Refund Processing Time */}
              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Refund Processing Time</h3>
                    <p className="text-gray-700 text-sm">
                      In case of any refunds approved by MAFIAA WESTERN OUTFIT, it will take <strong>7 days</strong> for the refund to be processed to you.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Return Policy */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900 m-0">Return Policy</h2>
            </div>

            {/* Return Window */}
            <div className="bg-purple-50 border-l-4 border-purple-600 p-4 mb-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">15-Day Return Window</h3>
                  <p className="text-gray-700 text-sm">
                    We offer refund/exchange <strong>within first 15 days</strong> from the date of your purchase. If 15 days have passed since your purchase, you will not be offered a return, exchange or refund of any kind.
                  </p>
                </div>
              </div>
            </div>

            {/* Eligibility Criteria */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Eligibility Criteria for Returns/Exchanges</h3>
              <p className="text-gray-700 text-sm mb-3">
                In order to become eligible for a return or an exchange, the following conditions must be met:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 text-sm">
                    <strong>(i)</strong> The purchased item should be <strong>unused and in the same condition</strong> as you received it
                  </p>
                </div>
                <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 text-sm">
                    <strong>(ii)</strong> The item must have <strong>original packaging</strong>
                  </p>
                </div>
                <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 text-sm">
                    <strong>(iii)</strong> If the item was purchased <strong>on sale</strong>, then the item may <strong>not be eligible</strong> for a return/exchange
                  </p>
                </div>
              </div>
            </div>

            {/* Exchange Process */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Exchange Process</h3>
              <p className="text-gray-700 text-sm">
                Only such items are replaced by us (based on an exchange request), if such items are found <strong>defective or damaged</strong>.
              </p>
            </div>

            {/* Exempted Categories */}
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Exempted Categories</h3>
              <p className="text-gray-700 text-sm">
                You agree that there may be a certain category of products/items that are exempted from returns or refunds. Such categories of the products would be identified to you at the time of purchase.
              </p>
            </div>

            {/* Return Process */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Return Processing</h3>
              <p className="text-gray-700 text-sm mb-2">
                For exchange/return accepted request(s) (as applicable):
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
                <li>Once your returned product/item is received and inspected by us, we will send you an email to notify you about receipt of the returned/exchanged product</li>
                <li>If the same has been approved after the quality check at our end, your request (i.e. return/exchange) will be processed in accordance with our policies</li>
              </ol>
            </div>
          </section>

          {/* Important Notes */}
          <section className="mb-8">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-purple-600" />
                Important Notes
              </h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>All returns must be initiated within the specified time period</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Items must be in original condition with all tags and packaging</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Refunds will be processed to the original payment method</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Customer service team has final decision on all return/refund requests</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Contact Section */}
          <section className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Need Help?</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about our Refund & Return Policy or need assistance with a return/refund request, please contact our customer service team:
            </p>
            <div className="space-y-2">
              <p className="text-gray-800">
                <strong>Company:</strong> MAFIAA WESTERN OUTFIT
              </p>
              <p className="text-gray-800">
                <strong>Address:</strong> SHOP NO 1, NARMADA SMRUTI, CABIN ROAD, BHAYANDER EAST, THANE, MAHARASHTRA, INDIA 401105
              </p>
              <p className="text-gray-800">
                <strong>Contact:</strong>{' '}
                <Link href="/senlysh/contact" className="text-purple-600 hover:text-purple-700 underline">
                  Contact Us
                </Link>
              </p>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
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
              href="/senlysh/privacy"
              className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
            >
              Privacy Policy
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
