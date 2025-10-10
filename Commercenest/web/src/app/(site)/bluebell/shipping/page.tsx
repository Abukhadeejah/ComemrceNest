import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shipping | Bluebell',
  description: 'Shipping policy and delivery information for Bluebell Fabrics.',
}

export default function ShippingPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-primary mb-6">Shipping Policy</h1>
      <p className="text-brown mb-4">We ship across India with trusted courier partners. Orders are typically processed within 1–2 business days.</p>
      <ul className="list-disc pl-6 space-y-2 text-brown">
        <li>Standard Delivery: 3–7 business days depending on destination</li>
        <li>Shipping Fee: Calculated at checkout based on weight and location</li>
        <li>Tracking: Tracking link shared by email/SMS post-dispatch</li>
        <li>Contact Support: hello@bluebellFabrics.com</li>
      </ul>
    </main>
  )
}



