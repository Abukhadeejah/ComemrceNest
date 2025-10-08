import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Returns & Refunds | Bluebell',
  description: 'Returns, exchanges, and refund policy for Bluebell Fabrics.',
}

export default function ReturnsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-primary mb-6">Returns & Refunds</h1>
      <p className="text-brown mb-4">We want you to love your purchase. If there’s an issue, we’re here to help.</p>
      <ul className="list-disc pl-6 space-y-2 text-brown">
        <li>Return Window: 7 days from delivery for eligible items</li>
        <li>Condition: Unused, unwashed, with original packaging</li>
        <li>Process: Initiate return via email; we’ll arrange pickup where available</li>
        <li>Refunds: Issued to original payment method within 5–7 business days after QC</li>
      </ul>
    </main>
  )
}



