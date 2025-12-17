'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Truck, Clock, MapPin, Mail, AlertCircle, Package, CheckCircle } from 'lucide-react';
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
            <Truck className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Shipping Policy
            </h1>
          </div>
          <p className="text-sm text-gray-600">
            Last Updated: November 01, 2025
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 prose prose-gray max-w-none">
          
          {/* Introduction */}
          <section className="mb-8">
            <p className="text-gray-700 leading-relaxed text-lg">
              This Shipping Policy outlines how we ship orders to our customers and what you can expect during the delivery process.
            </p>
          </section>

          {/* Shipping Methods */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900 m-0">Shipping Methods</h2>
            </div>
            
            <div className="bg-purple-50 border-l-4 border-purple-600 p-4 mb-4">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Domestic Shipping Only</h3>
                  <p className="text-gray-700 text-sm">
                    The orders for the user are shipped through <strong>registered domestic courier companies and/or speed post only</strong>. We currently ship within India only.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Processing & Delivery Time */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900 m-0">Processing & Delivery Time</h2>
            </div>

            <div className="space-y-4">
              {/* Shipping Timeline */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">15-Day Shipping Window</h3>
                    <p className="text-gray-700 text-sm">
                      Orders are shipped <strong>within 15 days</strong> from the date of the order and/or payment, or as per the delivery date agreed at the time of order confirmation and delivering of the shipment.
                    </p>
                  </div>
                </div>
              </div>

              {/* Courier Dependency */}
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Delivery Timeline</h3>
                    <p className="text-gray-700 text-sm mb-2">
                      Delivery is subject to <strong>courier company/post office norms</strong>.
                    </p>
                    <p className="text-gray-700 text-sm font-medium">
                      <strong>Important:</strong> Platform Owner (MAFIAA WESTERN OUTFIT) shall not be liable for any delay in delivery by the courier company/postal authority.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Delivery Address */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900 m-0">Delivery Address</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Shipping Address Requirements</h3>
                    <p className="text-gray-700 text-sm">
                      Delivery of all orders will be made to the <strong>address provided by the buyer at the time of purchase</strong>. Please ensure that you provide a complete and accurate shipping address to avoid delivery issues.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Order Confirmation</h3>
                    <p className="text-gray-700 text-sm">
                      Delivery of our services will be confirmed on your <strong>email ID as specified at the time of registration</strong>. Please check your email regularly for shipping updates and tracking information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Shipping Costs */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900 m-0">Shipping Costs</h2>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Non-Refundable Shipping Charges</h3>
                  <p className="text-gray-700 text-sm">
                    If there are any shipping cost(s) levied by the seller or the Platform Owner (as the case be), the same is <strong>not refundable</strong>.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Important Information */}
          <section className="mb-8">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                Key Points to Remember
              </h3>
              <ul className="space-y-3 text-gray-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold mt-1">•</span>
                  <span><strong>Shipping Method:</strong> Registered domestic courier companies and/or speed post</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold mt-1">•</span>
                  <span><strong>Processing Time:</strong> Orders shipped within 15 days from order date</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold mt-1">•</span>
                  <span><strong>Delivery Location:</strong> To the address provided by buyer at purchase</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold mt-1">•</span>
                  <span><strong>Email Confirmation:</strong> Delivery confirmation sent to registered email ID</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold mt-1">•</span>
                  <span><strong>Shipping Charges:</strong> Non-refundable once levied</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold mt-1">•</span>
                  <span><strong>Courier Delays:</strong> Platform Owner not liable for delays by courier/postal services</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Shipping Tips */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Tips for Smooth Delivery</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Provide Complete Address
                </h3>
                <p className="text-gray-700 text-sm">
                  Include house/flat number, landmark, city, state, and PIN code for accurate delivery.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Verify Contact Details
                </h3>
                <p className="text-gray-700 text-sm">
                  Ensure your phone number and email are correct for delivery updates.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Check Your Email
                </h3>
                <p className="text-gray-700 text-sm">
                  Monitor your registered email for shipping confirmations and tracking information.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Be Available
                </h3>
                <p className="text-gray-700 text-sm">
                  Ensure someone is available at the delivery address during delivery hours.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Have Questions About Shipping?</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about our Shipping Policy or need assistance with your order delivery, please contact us:
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
              href="/senlysh/refund-policy"
              className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
            >
              Refund Policy
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
