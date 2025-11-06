'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Globe, CreditCard, Package, Clock, Mail, AlertTriangle, CheckCircle, Phone, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function InternationalPolicyPage() {
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
            <Globe className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              International Shipping Policy
            </h1>
          </div>
          <p className="text-sm text-gray-600">
            Last Updated: November 01, 2025
          </p>
        </div>

        {/* Introduction Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-2">Our Policy to Serve the Best</h2>
          <p className="text-purple-50">
            We ship across the globe and are committed to providing you the best international shopping experience.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 prose prose-gray max-w-none">
          
          {/* Shipping Partner */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900 m-0">Global Shipping Partner</h2>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Shiprocket - Worldwide Delivery</h3>
                  <p className="text-gray-700 text-sm">
                    We ship across the globe via <strong>Shiprocket</strong>, ensuring reliable and efficient delivery to your doorstep, no matter where you are in the world.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Payment Methods */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900 m-0">International Payment Options</h2>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">
              For International Orders, you can easily pay through:
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Debit/Credit Cards</h3>
                    <p className="text-gray-700 text-sm">
                      Visa, Mastercard, American Express, and other major cards accepted
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Bank Transfer</h3>
                    <p className="text-gray-700 text-sm">
                      Direct bank transfer option available for your convenience
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Shipping Costs */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900 m-0">Shipping Costs</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-purple-50 border-l-4 border-purple-600 p-4">
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Location-Based Pricing</h3>
                    <p className="text-gray-700 text-sm">
                      International shipping cost is based on <strong>your location and order size</strong>. Prices vary depending on the destination country and total weight of your order.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-yellow-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Automatic Calculation</h3>
                    <p className="text-gray-700 text-sm">
                      Shipping charges are <strong>automatically added to your order at the time of checkout</strong>. You'll see the exact cost before completing your purchase.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Delivery Timeline */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900 m-0">Delivery Timeline</h2>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">10-15 Days Delivery</h3>
                  <p className="text-gray-700 text-sm">
                    Products usually take <strong>10-15 days to reach you after the dispatch</strong>, depending on your location and customs clearance times.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Dispatch Policy</h3>
              <p className="text-gray-700 text-sm mb-2">
                We try to dispatch the order <strong>as soon as possible</strong>. In case of delay (product not dispatched within estimated time period), you can contact us:
              </p>
              <div className="space-y-2 mt-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-600" />
                  <a href="mailto:helpdesk@senlysh.in" className="text-purple-600 hover:text-purple-700 underline text-sm">
                    helpdesk@senlysh.in
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <a href="https://wa.me/917977439669" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline text-sm">
                    WhatsApp: +91 79774 39669
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Order Tracking */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900 m-0">Order Tracking</h2>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Tracking Information</h3>
                  <p className="text-gray-700 text-sm">
                    Tracking details will be shared with you at your <strong>registered email address</strong>. You can track your order in real-time once it's dispatched.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Return Policy */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900 m-0">Return & Exchange Policy</h2>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">No Returns on International Orders</h3>
                  <p className="text-gray-700 text-sm">
                    <strong>No exchange/return is applicable on international orders.</strong> Due to customs regulations and international shipping complexities, we cannot accept returns or exchanges for international purchases.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Size & Product Queries</h3>
                  <p className="text-gray-700 text-sm mb-2">
                    For any size related queries, please feel free to contact us via <strong>Instagram Messages</strong> or <strong>email</strong> before you place an order.
                  </p>
                  <p className="text-gray-700 text-sm">
                    We recommend reaching out to us with any questions <strong>before</strong> ordering to ensure you're completely satisfied with your purchase.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Order Completion */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900 m-0">Order Dispatch Policy</h2>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-yellow-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Complete Orders Only</h3>
                  <p className="text-gray-700 text-sm">
                    International Orders are dispatched <strong>as soon as all the products in your order are ready</strong> with us. We <strong>don't dispatch incomplete orders</strong> to ensure you receive your complete purchase in one shipment.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Customs & Duties */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900 m-0">Customs, Duties & Taxes</h2>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Customer Responsibility</h3>
                  <p className="text-gray-700 text-sm mb-3">
                    As the recipient, <strong>you are liable for all import duties, customs and local sales taxes</strong> levied by the country we are shipping to.
                  </p>
                  <p className="text-gray-700 text-sm">
                    Payment of these fees might be required to <strong>release your order from customs on arrival</strong>. These charges vary by country and are beyond our control. We recommend checking with your local customs office for estimated fees.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Important Notes */}
          <section className="mb-8">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                Key Points to Remember
              </h3>
              <ul className="space-y-3 text-gray-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold mt-1">•</span>
                  <span><strong>Shipping Partner:</strong> Shiprocket for global delivery</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold mt-1">•</span>
                  <span><strong>Payment:</strong> Debit/Credit cards and Bank Transfer accepted</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold mt-1">•</span>
                  <span><strong>Delivery Time:</strong> 10-15 days after dispatch</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold mt-1">•</span>
                  <span><strong>Tracking:</strong> Sent to registered email address</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold mt-1">•</span>
                  <span><strong>Returns:</strong> Not applicable for international orders</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold mt-1">•</span>
                  <span><strong>Customs:</strong> Customer responsible for all import duties and taxes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold mt-1">•</span>
                  <span><strong>Order Policy:</strong> Only complete orders are dispatched</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Contact Section */}
          <section className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Need Assistance?</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Have questions about international shipping? Our customer support team is here to help you!
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <div>
                  <p className="text-gray-600 text-sm">Email Support</p>
                  <a href="mailto:helpdesk@senlysh.in" className="text-purple-600 hover:text-purple-700 underline font-medium">
                    helpdesk@senlysh.in
                  </a>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-gray-600 text-sm">WhatsApp Support</p>
                  <a href="https://wa.me/917977439669" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 underline font-medium">
                    +91 79774 39669
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-gray-600 text-sm">Instagram Messages</p>
                  <p className="text-blue-600 font-medium">
                    Contact us for size and product queries
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-gray-800">
                  <strong>Company:</strong> MAFIAA WESTERN OUTFIT
                </p>
                <p className="text-gray-800">
                  <strong>Address:</strong> SHOP NO 1, NARMADA SMRUTI, CABIN ROAD, BHAYANDER EAST, THANE, MAHARASHTRA, INDIA 401105
                </p>
              </div>
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
              href="/senlysh/shipping-policy"
              className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
            >
              Domestic Shipping
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
