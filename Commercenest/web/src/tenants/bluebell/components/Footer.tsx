"use client"
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white py-20 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100" height="100" viewBox="0 0 100 100" className="w-full h-full">
          <pattern id="footer-pattern" x="0" y="0" width="25" height="25" patternUnits="userSpaceOnUse">
            <circle cx="12.5" cy="12.5" r="1" fill="#FEFEFE"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#footer-pattern)"/>
        </svg>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <svg width="200" height="60" viewBox="0 0 200 60" className="mb-6">
              <g transform="translate(0, 8)">
                <path d="M18 40 Q12 28 18 16 Q24 28 18 40" fill="#FEFEFE" opacity="0.9"/>
                <path d="M14 36 Q9 26 14 18 Q19 26 14 36" fill="#FDCE59" opacity="0.7"/>
                <circle cx="18" cy="16" r="4" fill="#DC2A38" opacity="0.8"/>
                <line x1="18" y1="40" x2="18" y2="46" stroke="#FEFEFE" strokeWidth="3"/>
                <path d="M10 46 Q18 40 26 46" fill="none" stroke="#FEFEFE" strokeWidth="2"/>
              </g>
              <text x="40" y="24" fontFamily="Playfair Display, serif" fontSize="22" fontWeight="bold" fill="#FEFEFE">Bluebell</text>
              <text x="40" y="42" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="300" fill="#FEFEFE" letterSpacing="3" opacity="0.8">FABRICS</text>
            </svg>
            <p className="text-white/80 max-w-md text-lg leading-relaxed mb-6">
              Creating beautiful interiors with premium fabrics since 1985. Your trusted partner for exceptional design solutions that transform spaces into extraordinary experiences.
            </p>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-800" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold">Award Winning</p>
                <p className="text-white/70 text-sm">Design Excellence 2024</p>
              </div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-xl mb-6 text-yellow-400">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link href="/bluebell" className="text-white/80 hover:text-yellow-400 transition-all duration-300 flex items-center group">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-3 group-hover:bg-yellow-400 transition-colors"></span>
                Home
              </Link></li>
              <li><Link href="/bluebell/portfolio" className="text-white/80 hover:text-yellow-400 transition-all duration-300 flex items-center group">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-3 group-hover:bg-yellow-400 transition-colors"></span>
                Portfolio
              </Link></li>
              <li><Link href="/bluebell/products" className="text-white/80 hover:text-yellow-400 transition-all duration-300 flex items-center group">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-3 group-hover:bg-yellow-400 transition-colors"></span>
                Products
              </Link></li>
              <li><Link href="/bluebell/about" className="text-white/80 hover:text-yellow-400 transition-all duration-300 flex items-center group">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-3 group-hover:bg-yellow-400 transition-colors"></span>
                About
              </Link></li>
              <li><Link href="/bluebell/contact" className="text-white/80 hover:text-yellow-400 transition-all duration-300 flex items-center group">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-3 group-hover:bg-yellow-400 transition-colors"></span>
                Contact
              </Link></li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-xl mb-6 text-yellow-400">Get In Touch</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mt-1">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-white/90">123 Design Street</p>
                  <p className="text-white/90">New York, NY 10001</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                </div>
                <p className="text-white/90">(555) 123-4567</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <p className="text-white/90">hello@bluebellFabrics.com</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Newsletter Signup */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 mb-12 border border-white/10">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-serif font-bold text-white mb-2">Stay Inspired</h3>
            <p className="text-white/80">Subscribe to our newsletter for design tips and exclusive fabric collections</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-yellow-400 transition-colors"
            />
            <button className="bg-yellow-400 hover:bg-yellow-300 text-yellow-800 font-bold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105">
              Subscribe
            </button>
          </div>
        </div>
        
        {/* Social Icons and Copyright */}
        <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex space-x-6 mb-6 md:mb-0">
            <a href="#" className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white/80 hover:text-yellow-400 hover:bg-yellow-400/20 transition-all duration-300 transform hover:scale-110">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
            </a>
            <a href="#" className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white/80 hover:text-yellow-400 hover:bg-yellow-400/20 transition-all duration-300 transform hover:scale-110">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
              </svg>
            </a>
            <a href="#" className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white/80 hover:text-yellow-400 hover:bg-yellow-400/20 transition-all duration-300 transform hover:scale-110">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
              </svg>
            </a>
            <a href="#" className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white/80 hover:text-yellow-400 hover:bg-yellow-400/20 transition-all duration-300 transform hover:scale-110">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.02 2.091c-2.719 0-3.063.012-4.137.06-1.071.049-1.805.218-2.446.465-.664.258-1.228.598-1.789 1.158-.561.561-.9 1.125-1.158 1.789-.247.641-.416 1.375-.465 2.446-.048 1.074-.06 1.418-.06 4.137s.012 3.063.06 4.137c.049 1.071.218 1.805.465 2.446.258.664.598 1.228 1.158 1.789.561.561 1.125.9 1.789 1.158.641.247 1.375.416 2.446.465 1.074.048 1.418.06 4.137.06s3.063-.012 4.137-.06c1.071-.049 1.805-.218 2.446-.465.664-.258 1.228-.598 1.789-1.158.561-.561.9-1.125 1.158-1.789.247-.641.416-1.375.465-2.446.048-1.074.06-1.418.06-4.137s-.012-3.063-.06-4.137c-.049-1.071-.218-1.805-.465-2.446-.258-.664-.598-1.228-1.158-1.789-.561-.561-1.125-.9-1.789-1.158-.641-.247-1.375-.416-2.446-.465-1.074-.048-1.418-.06-4.137-.06zm0 1.621c2.67 0 2.987.01 4.042.059.976.045 1.505.207 1.858.344.467.182.8.398 1.15.748.35.35.566.683.748 1.15.137.353.299.882.344 1.858.048 1.055.058 1.372.058 4.042s-.01 2.987-.058 4.042c-.045.976-.207 1.505-.344 1.858-.182.467-.398.8-.748 1.15-.35.35-.683.566-1.15.748-.353.137-.882.299-1.858.344-1.055.048-1.372.058-4.042.058s-2.987-.01-4.042-.058c-.976-.045-1.505-.207-1.858-.344-.467-.182-.8-.398-1.15-.748-.35-.35-.566-.683-.748-1.15-.137-.353-.299-.882-.344-1.858-.048-1.055-.058-1.372-.058-4.042s.01-2.987.058 4.042c.045.976.207 1.505.344 1.858.182.467.398.8.748 1.15.35.35.683.566 1.15.748.353.137.882.299 1.858.344 1.055.048 1.372.058 4.042.058zm0 9.718c-3.257 0-5.895 2.638-5.895 5.895s2.638 5.895 5.895 5.895 5.895-2.638 5.895-5.895-2.638-5.895-5.895-5.895z"/>
                <circle cx="18.406" cy="5.594" r="1.378"/>
              </svg>
            </a>
          </div>
          <div className="text-center md:text-right">
            <p className="text-white/60 text-sm mb-2">
              © 2024 Bluebell Fabrics. All rights reserved.
            </p>
            <p className="text-white/40 text-xs">
              Crafted with ❤️ for beautiful interiors
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

