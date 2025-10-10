"use client"

import Image from 'next/image'

interface PaymentLogosProps {
  className?: string
  showTitle?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function PaymentLogos({ 
  className = '', 
  showTitle = true, 
  size = 'md' 
}: PaymentLogosProps) {
  const sizeClasses = {
    sm: 'w-10 h-6',
    md: 'w-12 h-8', 
    lg: 'w-16 h-10'
  }

  const logos = [
    {
      name: 'Visa',
      src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png',
      alt: 'Visa'
    },
    {
      name: 'Mastercard', 
      src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/2560px-Mastercard-logo.svg.png',
      alt: 'Mastercard'
    },
    {
      name: 'PayPal',
      src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/2560px-PayPal.svg.png', 
      alt: 'PayPal'
    },
    {
      name: 'Razorpay',
      src: 'https://razorpay.com/assets/razorpay-logo.svg',
      alt: 'Razorpay'
    }
  ]


  return (
    <div className={`text-center ${className}`}>
      {showTitle && (
        <p className="text-sm font-semibold text-gray-800 mb-4">
          Guaranteed Safe Checkout
        </p>
      )}
      <div className="flex justify-center items-center space-x-3">
        {logos.map((logo) => (
          <div 
            key={logo.name}
            className={`${sizeClasses[size]} flex items-center justify-center bg-white rounded border border-gray-200 shadow-sm hover:shadow-md transition-shadow`}
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              width={size === 'sm' ? 40 : size === 'md' ? 48 : 64}
              height={size === 'sm' ? 24 : size === 'md' ? 32 : 40}
              className="object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
