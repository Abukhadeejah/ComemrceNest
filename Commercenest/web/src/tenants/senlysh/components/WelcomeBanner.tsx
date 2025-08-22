import React from 'react';

interface WelcomeBannerProps {
  messages?: string[];
  bgGradient?: string;
  speed?: number;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  messages = [
    "🎉 NEW ARRIVALS: Fresh Styles Just Dropped!",
    "🚚 FREE SHIPPING on orders above ₹999",
    "💎 VIP MEMBERSHIP: Join & Get 10% Off",
    "🔥 FLASH SALE: Up to 70% Off on Winter Collection",
    "⭐ 4.8/5 Rating from 10,000+ Happy Customers",
    "🔄 EASY RETURNS: 30-Day Money Back Guarantee"
  ],
  bgGradient = "from-purple-600 via-pink-600 to-orange-500",
  speed = 25
}) => {
  return (
    <div className={`bg-gradient-to-r ${bgGradient} text-white py-3 overflow-hidden shadow-lg`}>
      <div className="flex whitespace-nowrap animate-marquee" style={{ animationDuration: `${speed}s` }}>
        <div className="flex items-center space-x-12 px-4">
          {messages.map((message, index) => (
            <React.Fragment key={index}>
              <span className="text-sm md:text-base font-medium flex items-center gap-2">
                {message}
              </span>
              <span className="text-white/60 text-lg">•</span>
            </React.Fragment>
          ))}
          {/* Duplicate for seamless loop */}
          {messages.map((message, index) => (
            <React.Fragment key={`duplicate-${index}`}>
              <span className="text-sm md:text-base font-medium flex items-center gap-2">
                {message}
              </span>
              <span className="text-white/60 text-lg">•</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
