"use client";
import { useRouter } from "next/navigation";

export default function ShippingPolicy() {
  console.log("ShippingPolicy page component rendered");

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
      <h1>Shipping Policy</h1>

      <p>
        At Senlysh, we ensure that all products are shipped in excellent condition and use the best shipping partners.
      </p>

      <h2>Delivery Timelines:</h2>
      <ul>
        <li><strong>Within India:</strong> Orders are shipped within 1-2 working days and typically delivered within 4-6 days.</li>
        <li><strong>International Orders:</strong> Orders are shipped within 1-2 working days and typically delivered within 12-15 days.</li>
        <li><strong>Free Shipping:</strong> Orders over Rs. 1499 ship for free within India.</li>
      </ul>

      <p><strong>COD (Cash On Delivery):</strong> Not Available</p>
      <p><strong>International Orders:</strong> Calculated at checkout</p>

      <p>
        Please note that delivery times may vary due to factors beyond our control, such as weather or road conditions. However, we are committed to ensuring your order reaches you, no matter what. If you encounter any issues, we're here to assist you.
      </p>
    </div>
  );
}
