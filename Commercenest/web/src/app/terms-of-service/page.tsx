"use client";
import { useRouter } from "next/navigation";
<<<<<<< HEAD

export default function TermsofService() {
  console.log("TermsofService page component rendered");

=======
export default function Termsofservice() {
>>>>>>> 257f201b8b70ac78b4b24ef6b8385b10bdf7c8cb
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="prose mx-auto p-4 max-w-4xl">
      <button
        onClick={handleGoBack}
        className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        ← Go Back
      </button>
      <h1>Terms of Service</h1>

      <h2>Overview</h2>
      <p>
        This website is operated by Senlysh. Throughout the site, the terms “we”, “us” and “our” refer to Senlysh. Senlysh offers this website, including all information, tools, and services available from this site to you, the user, conditioned upon your acceptance of all terms, conditions, policies, and notices stated here.
      </p>
      <p>
        By visiting our site and/or purchasing something from us, you engage in our “Service” and agree to be bound by the following terms and conditions (“Terms of Service”, “Terms”), including those additional terms and conditions and policies referenced herein and/or available by hyperlink. These Terms of Service apply to all users of the site, including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content.
      </p>
      <p>
        Please read these Terms of Service carefully before accessing or using our website. By accessing or using any part of the site, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions of this agreement, then you may not access the website or use any Services. If these Terms of Service are considered an offer, acceptance is expressly limited to these Terms of Service.
      </p>
      <p>
        Any new features or tools which are added to the current store shall also be subject to the Terms of Service. You can review the most current version of the Terms of Service at any time on this page. We reserve the right to update, change, or replace any part of these Terms of Service by posting updates and/or changes to our website. It is your responsibility to check this page periodically for changes. Your continued use of or access to the website following the posting of any changes constitutes acceptance of those changes.
      </p>
      <p>
        Our store is hosted on Hostinger, which provides us with the online e-commerce platform that allows us to sell our products and Services to you.
      </p>

      <h2>Section 1 - Online Store Terms</h2>
      <ul>
        <li>You represent that you are at least the age of majority in your state or province of residence, or that you have given us your consent to allow any of your minor dependents to use this site.</li>
        <li>You may not use our products for illegal or unauthorized purposes or violate any laws in your jurisdiction.</li>
        <li>You must not transmit any worms, viruses, or destructive code.</li>
        <li>Breach of these Terms will result in immediate termination of your Services.</li>
      </ul>

      <h2>Section 2 - General Conditions</h2>
      <ul>
        <li>We reserve the right to refuse Service to anyone for any reason at any time.</li>
        <li>Your content, excluding credit card info, may be transferred unencrypted across networks. Credit card info is always encrypted.</li>
        <li>You agree not to reproduce, duplicate, copy, sell, or exploit any portion of the Service without express written permission.</li>
        <li>Headings are for convenience only and don't affect the Terms.</li>
      </ul>

      <h2>Section 3 - Accuracy, Completeness and Timeliness of Information</h2>
      <p>
        We are not responsible if information on this site is inaccurate, incomplete, or not current. Material is for general information only; reliance on it is at your own risk. Historical information may not be current. We may modify contents at any time without obligation to update.
      </p>

      <h2>Section 4 - Modifications to the Service and Prices</h2>
      <ul>
        <li>Prices are subject to change without notice.</li>
        <li>We can modify or discontinue the Service without notice.</li>
        <li>We are not liable for changes or discontinuance of the Service.</li>
      </ul>

      <h2>Section 5 - Products or Services</h2>
      <p>
        Certain products or services may be available exclusively online and are subject to return or exchange only according to our Refund Policy.
      </p>
      <p>
        We try to display colors and images accurately but can't guarantee monitor displays.
      </p>
      <p>
        We reserve the right to limit sales or discontinue products at any time.
      </p>
      <p>
        We do not warrant product quality or that all errors will be corrected.
      </p>

      <h2>Section 6 - Accuracy of Billing and Account Information</h2>
      <p>
        We reserve the right to refuse or limit orders and may notify you about order changes. You agree to provide accurate purchase and account information and keep it updated.
      </p>
      <p>
        For more details, please review our <a href="/refund-policy">Refund Policy</a>.
      </p>

      <h2>Section 7 - Optional Tools</h2>
      <p>
        We may provide access to third-party tools “as is” and without endorsement. Use them at your own risk.
      </p>

      <h2>Section 8 - Third-Party Links</h2>
      <p>
        We are not responsible for third-party content or transactions. Review their policies carefully.
      </p>

      <h2>Section 9 - User Comments, Feedback and Other Submissions</h2>
      <p>
        We may use comments you provide at our discretion without obligation. You agree not to post unlawful or harmful content or mislead others.
      </p>

      <h2>Section 10 - Personal Information</h2>
      <p>
        Your submission of personal information is governed by our <a href="/privacy-policy">Privacy Policy</a>.
      </p>

      <h2>Section 11 - Errors, Inaccuracies and Omissions</h2>
      <p>
        We may correct errors or update information without obligation. No update date means no guarantee of updates.
      </p>

      <h2>Section 12 - Prohibited Uses</h2>
      <p>
        You are prohibited from using the site for unlawful, harmful, or deceptive purposes, or interfering with security features.
      </p>

      <h2>Section 13 - Disclaimer of Warranties; Limitation of Liability</h2>
      <p>
        We provide the Service “as is” without warranties. We are not liable for damages related to use of the Service.
      </p>

      <h2>Section 14 - Indemnification</h2>
      <p>
        You agree to indemnify us and our affiliates from claims arising from your breach or violations.
      </p>

      <h2>Section 15 - Severability</h2>
      <p>
        Unlawful or unenforceable provisions shall be severed without affecting the remainder.
      </p>

      <h2>Section 16 - Termination</h2>
      <p>
        These Terms are effective until terminated by you or us. Failure to comply may result in termination.
      </p>

      <h2>Section 17 - Entire Agreement</h2>
      <p>
        These Terms and other policies constitute the entire agreement between you and us.
      </p>

      <h2>Section 18 - Governing Law</h2>
      <p>
        These Terms are governed by the laws of India.
      </p>

      <h2>Section 19 - Changes to Terms of Service</h2>
      <p>
        We may update these Terms at our sole discretion. Your continued use means acceptance.
      </p>

      <h2>Section 20 - Contact Information</h2>
      <p>
        Questions? Email us at <a href="mailto:helpdesk@senlysh.in">helpdesk@senlysh.in</a>.
      </p>
    </div>
  );
}
