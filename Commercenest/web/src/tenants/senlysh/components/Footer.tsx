"use client";

import Link from "next/link";
import { useTenant } from '@/hooks/useTenant';
import { getSiteUrl } from '@/utils/site-urls';

export default function Footer() {
  const tenant = useTenant();
  
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-6">
              <h3 className="text-2xl font-bold text-cyan-400">Senlysh</h3>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Your premier destination for fashion and lifestyle. Discover the latest trends 
              in clothing, accessories, and more with exclusive deals and premium quality.
            </p>
            {/* Social Media Links */}
            <div className="flex space-x-4">
              {/* Social icons (unchanged) */}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-cyan-400 mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/senlysh" className="text-gray-300 hover:text-cyan-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/senlysh/products" className="text-gray-300 hover:text-cyan-400 transition-colors">
                  Shop All
                </Link>
              </li>
              <li>
                <Link href="/senlysh/sale" className="text-gray-300 hover:text-cyan-400 transition-colors">
                  Sale Items
                </Link>
              </li>
              <li>
                <Link href="/senlysh/new-arrivals" className="text-gray-300 hover:text-cyan-400 transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/senlysh/products?sort=popularity" className="text-gray-300 hover:text-cyan-400 transition-colors">
                  Trending
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-semibold text-cyan-400 mb-6">Categories</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/senlysh/products?category=dresses" className="text-gray-300 hover:text-cyan-400 transition-colors">
                  Dresses
                </Link>
              </li>
              <li>
                <Link href="/senlysh/products?category=tops" className="text-gray-300 hover:text-cyan-400 transition-colors">
                  Tops & Blouses
                </Link>
              </li>
              <li>
                <Link href="/senlysh/products?category=bottoms" className="text-gray-300 hover:text-cyan-400 transition-colors">
                  Bottoms
                </Link>
              </li>
              <li>
                <Link href="/senlysh/products?category=accessories" className="text-gray-300 hover:text-cyan-400 transition-colors">
                  Accessories
                </Link>
              </li>
              <li>
                <Link href="/senlysh/products?category=shoes" className="text-gray-300 hover:text-cyan-400 transition-colors">
                  Shoes
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service - UPDATED WITH CORRECT LINKS */}
          <div>
            <h4 className="text-lg font-semibold text-cyan-400 mb-6">Customer Service</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/senlysh/about" className="text-gray-300 hover:text-cyan-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/senlysh/contact" className="text-gray-300 hover:text-cyan-400 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/senlysh/terms" className="text-gray-300 hover:text-cyan-400 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/senlysh/privacy" className="text-gray-300 hover:text-cyan-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/senlysh/refund-policy" className="text-gray-300 hover:text-cyan-400 transition-colors">
                  Refund & Return Policy
                </Link>
              </li>
              <li>
                <Link href="/senlysh/shipping-policy" className="text-gray-300 hover:text-cyan-400 transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/senlysh/international-policy" className="text-gray-300 hover:text-cyan-400 transition-colors">
                  International Shipping
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Subscription */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h4 className="text-xl font-semibold text-cyan-400 mb-2">
                Stay Updated
              </h4>
              <p className="text-gray-300">
                Subscribe to our newsletter for exclusive offers, new arrivals, and fashion tips.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
              />
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-950 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © 2025 Senlysh. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-gray-400 text-sm">
              <Link href="/senlysh/terms" className="hover:text-cyan-400 transition-colors">
                Terms
              </Link>
              <span>•</span>
              <Link href="/senlysh/privacy" className="hover:text-cyan-400 transition-colors">
                Privacy
              </Link>
              <span>•</span>
              <Link href="/senlysh/refund-policy" className="hover:text-cyan-400 transition-colors">
                Refunds
              </Link>
              <span>•</span>
              <Link href="/senlysh/shipping-policy" className="hover:text-cyan-400 transition-colors">
                Shipping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
