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

        {/* Refund Policy */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6 prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Refund Policy</h2>
            <p>
              We allow only Exchange of the products purchased from Senlysh.in within 2 days from the date of delivery.
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Exchange is applicable only in case of damaged/defective product.</li>
              <li>Exchange in case of size issue is allowed.</li>
              <li>
                Exchange is allowed provided the product is in original condition i.e. unused, unwashed, unaltered, untampered
                with original packaging intact.
              </li>
              <li>
                All products received will undergo quality check after the product has been received at our Warehouse.
              </li>
              <li>Exchange can be done within 2 days after your order is delivered.</li>
              <li>
                The Reverse Pickup facility is not available on our website. Respective product will have to be returned by the customer.
                Reshipping charges are 100% refundable if you received defective/wrong product(s). (Max Courier Charge Rs 100 Refundable)
                (Only Applicable in Defective/Damaged product received).
              </li>
              <li>If there is any size issue, then he/she has to bear the shipping cost.</li>
              <li>
                Kindly pack the product(s) properly to prevent damage during transit. Please ensure the product(s) must be in unused condition
                with proper packaging.
              </li>
              <li>We do not accept any Return & Exchange of any altered garments.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Refund Policy Details</h2>
            <p>
              Note: We Will Not Give Refund Or Money Back For Any Order.
              Refunds will be provided in terms of Senlysh.in Coupon Code or Membership E-Wallet. Validity of the Coupon will be for 3 months
              from the date of issue. No Expiry Date For Membership E-Wallet.
            </p>
            <p>
              Once the product is received at our warehouse and undergone quality check, we will issue the coupon code.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 my-4">Terms and Conditions for Returns & Exchange</h2>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Coupon code will be issued within 2-3 business days of receiving the product.</li>
              <li>Return of the product is applicable only if you receive wrong product.</li>
              <li>
                In case of damaged/defective product, unboxing video is compulsory. (Damage or defect must be visible in video to qualify).
              </li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 my-4">Raising the Return/Exchange Request</h2>
            <p>Email: <a href="mailto:helpdesk@senlysh.in" className="text-purple-600 underline">helpdesk@senlysh.in</a></p>
            <p>WhatsApp: 7977439669</p>

            <h2 className="text-2xl font-semibold text-gray-900 my-4">Things To Consider</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Customers are requested to check the size guide before placing the order.</li>
              <li>The color of the product(s) may vary as per the customer’s screen resolution.</li>
              <li>Please provide your WhatsApp registered number for timely updates and a better shopping experience.</li>
            </ul>

            <p className="mt-4 font-semibold">Happy Shopping!</p>
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
