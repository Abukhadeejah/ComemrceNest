"use client";

import { useRouter } from "next/navigation";
export default function RefundPolicy() {
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };
  return (
    <div className="prose mx-auto p-4">
      <button
        onClick={handleGoBack}
        className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        ← Go Back
      </button>
      <h1>Refund and Return Policy</h1>

      <h2>Refund Policy</h2>
      <p>We allow only Exchange of the products purchased from Senlysh.in within 2 days from the date of delivery.</p>
      <ul>
        <li>Exchange is applicable only in case of damaged/defective product.</li>
        <li>Exchange in case of size issue is allowed.</li>
        <li>Exchange is allowed provided the product is in original condition i.e. unused, unwashed, unaltered, untampered with original packaging intact.</li>
        <li>All products received will undergo quality check after the product has been received at our Warehouse.</li>
        <li>Exchange can be done within 2 days after your order is delivered.</li>
        <li>The Reverse Pickup facility is not available on our website. Respective product will have to be returned by the customer. Reshipping charges are 100% refundable if you received defective/wrong product(s). (Max Courier Charge Rs 100 Refundable) (Only Applicable in Defective/Damaged product received).</li>
        <li>If there is any size issue, then he/she has to bear the shipping cost.</li>
        <li>Kindly pack the product(s) properly to prevent damage during transit. Please ensure the product(s) must be in unused condition with proper packaging.</li>
        <li>We do not accept any Return & Exchange of any altered garments.</li>
      </ul>

      <h2>Refund Policy Details</h2>
      <p><strong>Note:</strong> We Will Not Give Refund Or Money Back For Any Order.</p>
      <p>Refunds will be provided in terms of Senlysh.in Coupon Code or Membership E-Wallet. Validity of the Coupon will be for 3 months from the date of issue. No Expiry Date For Membership E-Wallet.</p>
      <p>Once the product is received at our warehouse and undergone quality check, we will issue the coupon code.</p>

      <h2>Terms and Conditions for Returns & Exchange</h2>
      <ul>
        <li>Coupon code will be issued within 2-3 business days of receiving the product.</li>
        <li>Return of the product is applicable only if you receive wrong product.</li>
        <li>In case of damaged/defective product, unboxing video is compulsory. (Damage or defect must be visible in video to qualify).</li>
      </ul>

      <h2>Raising the Return/Exchange Request</h2>
      <p>Email: <a href="mailto:helpdesk@senlysh.in">helpdesk@senlysh.in</a></p>
      <p>WhatsApp: 7977439669</p>

      <h2>Things To Consider</h2>
      <ul>
        <li>Customers are requested to check the size guide before placing the order.</li>
        <li>The color of the product(s) may vary as per the customer’s screen resolution.</li>
        <li>Please provide your WhatsApp registered number for timely updates and a better shopping experience.</li>
      </ul>

      <p>Happy Shopping!</p>
    </div>
  );
}
