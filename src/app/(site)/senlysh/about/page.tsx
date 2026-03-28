import type { Metadata } from 'next'
import { getRegistryEntry } from '@/registry/tenantRegistry'

export async function generateMetadata(): Promise<Metadata> {
  const registryEntry = getRegistryEntry('senlysh')
  const { getPageMetadata } = await registryEntry.metadata()
  return getPageMetadata('About Us', 'Learn more about Senlysh')
}

export default function SenlyshAboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3">About Senlysh</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Premium fashion and lifestyle, crafted for modern India.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6 text-gray-700 leading-7">
            <p>
              At Senlysh, we believe fashion is more than what you wear — it's how you express confidence,
              culture, and creativity. Founded with a vision to blend <span className="italic">modern silhouettes</span> with <span className="italic">bold individuality</span>, Senlysh is a fashion destination for those who aren’t afraid to stand out.
            </p>
            <p>
              Our collections are crafted with care, fusing <span className="italic">contemporary style</span>, quality fabrics, and youthful energy. Whether it's elevated streetwear, ethnic fusion, or everyday essentials with a twist — we design for the trendsetters, the creators, and the unapologetically original.
            </p>
            <p>
              Driven by detail, inspired by you — Senlysh isn’t just a brand. It’s your style statement.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8">Our Story – Senlysh</h2>
            <p>
              Style is personal. Fashion is fearless.
            </p>
            <p>
              Founded with a vision to disrupt the ordinary, Senlysh started as a dream — a dream to create a brand
              that doesn't just follow trends, but defines them. We noticed a gap in the fashion space: clothes
              that looked great but lacked soul, and designs that spoke loudly but said nothing real. So, we built
              Senlysh — where every piece tells a story, and every story starts with you.
            </p>
            <p>
              Our journey began with experimenting — bold prints, unconventional fits, and timeless <span className="italic">Indian elements</span> blended into modern designs. We wanted to build something for the new generation: the ones who mix street with culture, tradition with tech, confidence with comfort.
            </p>
            <p>
              From drop-shoulder tees to elevated ethnicwear, cord sets to layered silhouettes — our pieces are made to stand out, but feel effortless. Everything we do is stitched with intent — quality materials, functional cuts, expressive details, and designs that don’t fade with the scroll.
            </p>
            <p>
              Senlysh is not just a label — it's a lifestyle. A mindset.
            </p>
            <p>
              For those who dress with purpose. For those who move with style.
            </p>
            <p>
              For those who are done blending in.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8">Crafted for Presence. Designed to Endure.</h2>
            <p>
              Senlysh isn’t just a fashion brand — it’s an identity. A lifestyle for those who embrace elevated aesthetics, value quality over noise, and understand that <span className="italic">luxury is not a price point</span> — it's a perspective.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8">Our Mission</h2>
            <p>
              To inspire fearless self-expression through fashion that’s bold, wearable, and rooted in individuality.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8">Our Vision</h2>
            <p>
              To become a youth-driven fashion movement that fuses streetwear edge with <span className="italic">Indian originality</span> — and empowers creators, doers, and dreamers to dress like they mean it.
            </p>
          </div>
          <aside className="bg-gray-900 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold text-cyan-400 mb-3">Why Senlysh</h3>
            <ul className="space-y-2 text-gray-200 text-sm">
              <li>✓ Curated collections and premium quality</li>
              <li>✓ India-first fits, sizes, and styles</li>
              <li>✓ Easy returns, fast deliveries</li>
              <li>✓ Secure checkout and support</li>
            </ul>
          </aside>
        </div>
      </div>
    </div>
  )
}
