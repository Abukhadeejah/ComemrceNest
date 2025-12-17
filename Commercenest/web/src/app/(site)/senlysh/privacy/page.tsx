'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck, FileText } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
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
            <Shield className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Privacy Policy
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
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900 m-0">Introduction</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              This Privacy Policy describes how <strong>MAFIAA WESTERN OUTFIT</strong> and its affiliates (collectively "MAFIAA WESTERN OUTFIT, we, our, us") collect, use, share, protect or otherwise process your information/personal data through our website{' '}
              <Link href="https://senlysh.in/" className="text-purple-600 hover:text-purple-700 underline">
                https://senlysh.in/
              </Link>{' '}
              (hereinafter referred to as Platform).
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Please note that you may be able to browse certain sections of the Platform without registering with us. We do not offer any product/service under this Platform outside India and your personal data will primarily be stored and processed in India.
            </p>
            <div className="bg-purple-50 border-l-4 border-purple-600 p-4 mb-4">
              <p className="text-gray-800 font-semibold">
                By visiting this Platform, providing your information or availing any product/service offered on the Platform, you expressly agree to be bound by the terms and conditions of this Privacy Policy, the Terms of Use and the applicable service/product terms and conditions, and agree to be governed by the laws of India including but not limited to the laws applicable to data protection and privacy.
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed">
              If you do not agree please do not use or access our Platform.
            </p>
          </section>

          {/* Collection */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900 m-0">Collection of Information</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              We collect your personal data when you use our Platform, services or otherwise interact with us during the course of our relationship and related information provided from time to time.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Some of the information that we may collect includes but is not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>Personal data/information provided during sign-up or registration</li>
              <li>Name, date of birth, address</li>
              <li>Telephone/mobile number, email ID</li>
              <li>Proof of identity or address documentation</li>
              <li>Bank account, credit/debit card, or other payment instrument information</li>
              <li>Biometric information such as facial features or physiological information (when opted for specific features)</li>
              <li>Behavioral data, preferences, and transaction information</li>
            </ul>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
              <p className="text-gray-800">
                <strong>Important:</strong> You always have the option to not provide information by choosing not to use a particular service or feature on the Platform. Sensitive personal data is collected only with your explicit consent, in accordance with applicable law(s).
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may track your behaviour, preferences, and other information that you choose to provide on our Platform. This information is compiled and analysed on an aggregated basis.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              We will also collect your information related to your transactions on Platform and such third-party business partner platforms. When such a third-party business partner collects your personal data directly from you, you will be governed by their privacy policies.
            </p>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-gray-800 font-semibold">
                ⚠️ Security Alert: If you receive an email or call from a person/association claiming to be MAFIAA WESTERN OUTFIT seeking any personal data like debit/credit card PIN, net-banking or mobile banking password, we request you to never provide such information. If you have already revealed such information, report it immediately to an appropriate law enforcement agency.
              </p>
            </div>
          </section>

          {/* Usage */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900 m-0">Usage of Information</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use personal data to provide the services you request. To the extent we use your personal data to market to you, we will provide you the ability to opt-out of such uses.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use your personal data to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>Assist sellers and business partners in handling and fulfilling orders</li>
              <li>Enhance customer experience</li>
              <li>Resolve disputes and troubleshoot problems</li>
              <li>Inform you about online and offline offers, products, services, and updates</li>
              <li>Customize your experience</li>
              <li>Detect and protect us against error, fraud and other criminal activity</li>
              <li>Enforce our terms and conditions</li>
              <li>Conduct marketing research, analysis and surveys</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              You understand that your access to these products/services may be affected in the event permission is not provided to us.
            </p>
          </section>

          {/* Sharing */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900 m-0">Sharing of Information</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may share your personal data in the following circumstances:
            </p>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Internal Sharing</h3>
                <p className="text-gray-700 text-sm">
                  We may share your personal data internally within our group entities, our other corporate entities, and affiliates to provide you access to the services and products offered by them. These entities and affiliates may market to you as a result of such sharing unless you explicitly opt-out.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Third-Party Disclosure</h3>
                <p className="text-gray-700 text-sm">
                  We may disclose personal data to third parties such as sellers, business partners, third party service providers including logistics partners, prepaid payment instrument issuers, third-party reward programs and other payment options opted by you.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Legal Compliance</h3>
                <p className="text-gray-700 text-sm">
                  We may disclose personal and sensitive personal data to government agencies or other authorised law enforcement agencies if required to do so by law or in the good faith belief that such disclosure is reasonably necessary to respond to subpoenas, court orders, or other legal process.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Rights Protection</h3>
                <p className="text-gray-700 text-sm">
                  We may disclose personal data to law enforcement offices, third party rights owners, or others in the good faith belief that such disclosure is reasonably necessary to enforce our Terms of Use or Privacy Policy, respond to claims, or protect the rights, property or personal safety of our users or the general public.
                </p>
              </div>
            </div>
          </section>

          {/* Security */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900 m-0">Security Precautions</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              To protect your personal data from unauthorised access or disclosure, loss or misuse we adopt reasonable security practices and procedures. Once your information is in our possession or whenever you access your account information, we adhere to our security guidelines to protect it against unauthorised access and offer the use of a secure server.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-gray-800">
                <strong>Important Notice:</strong> The transmission of information is not completely secure for reasons beyond our control. By using the Platform, the users accept the security implications of data transmission over the internet and the World Wide Web which cannot always be guaranteed as completely secure, and therefore, there would always remain certain inherent risks regarding use of the Platform.
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Users are responsible for ensuring the protection of login and password records for their account.
            </p>
          </section>

          {/* Data Deletion and Retention */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Deletion and Retention</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have an option to delete your account by visiting your profile and settings on our Platform. This action would result in you losing all information related to your account. You may also write to us at the contact information provided below to assist you with these requests.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may in event of any pending grievance, claims, pending shipments or any other services refuse or delay deletion of the account. Once the account is deleted, you will lose access to the account.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              We retain your personal data information for a period no longer than is required for the purpose for which it was collected or as required under any applicable law. However, we may retain data related to you if we believe it may be necessary to prevent fraud or future abuse or for other legitimate purposes.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We may continue to retain your data in anonymised form for analytical and research purposes.
            </p>
          </section>

          {/* Your Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 leading-relaxed">
              You may access, rectify, and update your personal data directly through the functionalities provided on the Platform.
            </p>
          </section>

          {/* Consent */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Consent</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              By visiting our Platform or by providing your information, you consent to the collection, use, storage, disclosure and otherwise processing of your information on the Platform in accordance with this Privacy Policy.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you disclose to us any personal data relating to other people, you represent that you have the authority to do so and permit us to use the information in accordance with this Privacy Policy.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              You, while providing your personal data over the Platform or any partner platforms or establishments, consent to us (including our other corporate entities, affiliates, lending partners, technology partners, marketing channels, business partners and other third parties) to contact you through SMS, instant messaging apps, call and/or e-mail for the purposes specified in this Privacy Policy.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Withdrawal of Consent</h3>
              <p className="text-gray-700 text-sm mb-2">
                You have an option to withdraw your consent that you have already provided by writing to the Grievance Officer at the contact information provided below. Please mention "Withdrawal of consent for processing personal data" in your subject line of your communication.
              </p>
              <p className="text-gray-700 text-sm">
                However, please note that your withdrawal of consent will not be retrospective and will be in accordance with the Terms of Use, this Privacy Policy, and applicable laws. In the event you withdraw consent given to us under this Privacy Policy, we reserve the right to restrict or deny the provision of our services for which we consider such information to be necessary.
              </p>
            </div>
          </section>

          {/* Changes to Privacy Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to this Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              Please check our Privacy Policy periodically for changes. We may update this Privacy Policy to reflect changes to our information practices. We may alert/notify you about the significant changes to the Privacy Policy, in the manner as may be required under applicable laws.
            </p>
          </section>

          {/* Contact Section */}
          <section className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:
            </p>
            <div className="space-y-2">
              <p className="text-gray-800">
                <strong>Company:</strong> MAFIAA WESTERN OUTFIT
              </p>
              <p className="text-gray-800">
                <strong>Address:</strong> SHOP NO 1, NARMADA SMRUTI, CABIN ROAD, BHAYANDER EAST, THANE, MAHARASHTRA, INDIA 401105
              </p>
              <p className="text-gray-800">
                <strong>Contact Page:</strong>{' '}
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
              href="/senlysh/cookies"
              className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
            >
              Cookie Policy
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
