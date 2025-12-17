import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ | Bluebell',
  description: 'Frequently asked questions for Bluebell Fabrics.',
}

export default function FAQPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-primary mb-6">Frequently Asked Questions</h1>
      <div className="space-y-6 text-brown">
        <div>
          <h2 className="font-semibold text-lg">Do you ship across India?</h2>
          <p>Yes, we ship pan-India with trusted partners. See our Shipping Policy.</p>
        </div>
        <div>
          <h2 className="font-semibold text-lg">Can I return customized fabric cuts?</h2>
          <p>Customized or cut-to-length fabrics are generally not returnable unless defective.</p>
        </div>
        <div>
          <h2 className="font-semibold text-lg">Which payments are accepted?</h2>
          <p>We support cards, UPI, and wallets via Razorpay.</p>
        </div>
      </div>
    </main>
  )
}



