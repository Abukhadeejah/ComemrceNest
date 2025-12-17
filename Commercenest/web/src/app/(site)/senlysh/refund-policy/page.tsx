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
          <h1 className="text-4xl font-bold text-gray-900">Refund and Return Policy</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-6 prose prose-gray max-w-none">
          {/* Cancellation Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Cancellation Policy</h2>
            <h3 className="font-bold text-gray-900 mb-2">1-Day Cancellation Window</h3>
            <p>Cancellations will only be considered if the request is made within 1 day of placing the order.</p>
            <h3 className="font-bold text-gray-900 mt-6 mb-2">Cancellation Restrictions</h3>
            <p>Cancellation requests may not be entertained if:</p>
            <ul className="list-disc pl-6">
              <li>Orders have been communicated to sellers/merchants</li>
              <li>Sellers have initiated the shipping process</li>
              <li>The product is out for delivery</li>
            </ul>
            <p>In such cases, you may choose to reject the product at the doorstep.</p>
          </section>

          {/* Clothing Exchange and Return Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Clothing Exchange and Return Policy</h2>
            <p>
              Clothing items are eligible for exchange or return only if the request is made within 2 days of delivery.<br />
              Requests submitted after this period will not be accepted under any circumstances.
            </p>
          </section>

          {/* Return and Exchange Policy for Accessories */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Return and Exchange Policy for Accessories</h2>
            <p>
              The following accessory products are non-returnable, non-exchangeable, and non-refundable:
            </p>
            <ul className="list-disc pl-6">
              <li>Belts</li>
              <li>Perfumes and deodorants</li>
              <li>Handkerchiefs</li>
              <li>Socks</li>
              <li>Room fresheners</li>
              <li>Caps</li>
              <li>Any other similar accessory items</li>
            </ul>
            <p>
              Once purchased, these items cannot be returned, exchanged, or refunded under any circumstances.
            </p>
          </section>

          {/* Refund Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Refund Policy</h2>
            <p>
              Mafia Western Outfit and Senlysh.in do not offer direct money-back refunds.<br />
              However, if a refund is approved, the amount will be credited to your e-wallet on the respective platform.<br />
              There is no expiry date on the e-wallet balance; you can use it for purchases anytime.
            </p>
            <h3 className="font-bold text-gray-900 mt-6 mb-2">Refund Processing Time</h3>
            <p>
              In case of any refunds approved by MAFIAA WESTERN OUTFIT, it will take 7 days for the refund to be processed to you in your e-wallet.
            </p>
          </section>

          {/* Return Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Return Policy</h2>
            <h3 className="font-bold text-gray-900 mb-2">2 Day Return Window</h3>
            <p>
              We offer refund/exchange within 2 days from the date of delivery. If 2 days have passed since your delivery, you will not be offered a return, exchange, or refund of any kind.
            </p>
            <h3 className="font-bold text-gray-900 mb-2">Eligibility Criteria for Returns/Exchanges</h3>
            <ul className="list-disc pl-6">
              <li>The purchased item should be unused, unwashed, unaltered, untampered and in the same condition as you received it</li>
              <li>The item must have original packaging</li>
              <li>If the item was purchased on sale, then the item may not be eligible for a return/exchange</li>
            </ul>

            <h3 className="font-bold text-gray-900 mb-2">Exchange Process</h3>
            <p>
              Only such items are replaced by us (based on an exchange request), if such items are found defective or damaged.
            </p>

            <h3 className="font-bold text-gray-900 mb-2">Exempted Categories</h3>
            <p>
              Certain categories of products/items are exempted from returns or refunds and will be identified to you at the time of purchase.
            </p>

            <h3 className="font-bold text-gray-900 mb-2">Return Processing</h3>
            <ol className="list-decimal list-inside mb-2 pl-7">
              <li>Once your returned product/item is received and inspected, we will notify you by email.</li>
              <li>If approved after quality check, your request will be processed in accordance with our policies.</li>
            </ol>
          </section>

          {/* Important Notes */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Important Notes</h2>
            <ul className="list-disc pl-6">
              <li>All returns must be initiated within the specified time period.</li>
              <li>Items must be in original condition with all tags and packaging.</li>
              <li>All approved refunds will be processed to your e-wallet on our platform.</li>
              <li>Refunds will not be credited to your original payment method (such as bank account, UPI, or card). You can use your e-wallet balance for future purchases at any time.</li>
              <li>Customer service team has final decision on all return/refund requests.</li>
            </ul>
          </section>

          {/* Things to Consider */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Things To Consider</h2>
            <ul className="list-disc pl-6">
              <li>The customers are requested to check the size guide before placing the order.</li>
              <li>The color of the product(s) may vary as per the customer’s screen resolution.</li>
              <li>Please provide your Arattai / WhatsApp registered number for timely updates and a better shopping experience.</li>
            </ul>
            <p className="font-semibold mt-4">Happy Shopping!</p>
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
