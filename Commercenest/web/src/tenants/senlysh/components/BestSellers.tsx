import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface CountdownTimer {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface BestSellerProduct {
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  badges: string[];
  url: string;
  rating?: number;
}

interface BestSellersProps {
  title?: string;
  products?: BestSellerProduct[];
  countdown?: CountdownTimer;
  bgColor?: string;
}

const defaultProducts: BestSellerProduct[] = [
  {
    name: 'Gray T-shirt for men',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    price: 14,
    originalPrice: 16,
    badges: ['Featured', '-13%', 'Limited', 'Sold Out'],
    url: '/product/gray-t-shirt-for-men'
  },
  {
    name: 'Too cool green jacket',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop',
    price: 39,
    originalPrice: 50,
    badges: ['-22%', 'Limited', 'Sold Out'],
    url: '/product/too-cool-green-jacket'
  },
  {
    name: 'T-shirt with ruffled sleeves',
    image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop',
    price: 69,
    originalPrice: 80,
    badges: ['Featured', '-14%', 'Limited', 'Sold Out'],
    rating: 5.0,
    url: '/product/t-shirt-with-ruffled-sleeves'
  },
  {
    name: 'Hoodie with slogan',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop',
    price: 99,
    badges: [],
    url: '/product/hoodie-with-slogan'
  }
];

const defaultCountdown: CountdownTimer = {
  days: 129,
  hours: 6,
  minutes: 41,
  seconds: 58
};

const BestSellers: React.FC<BestSellersProps> = ({
  title = "Our Best Sellers",
  products = defaultProducts,
  countdown = defaultCountdown,
  bgColor = "bg-gray-50"
}) => {
  return (
    <section className={`py-16 ${bgColor}`}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.name} className="group relative">
              <div className="relative overflow-hidden rounded-lg shadow-lg">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={400}
                  height={400}
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  {product.badges.map((badge, index) => (
                    <span key={index} className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      {badge}
                    </span>
                  ))}
                </div>
                <div className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-lg">
                  <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-75 text-white p-2 rounded">
                  <div className="flex justify-between text-xs">
                    <span>{countdown.days} Days</span>
                    <span>{countdown.hours.toString().padStart(2, '0')} Hours</span>
                    <span>{countdown.minutes.toString().padStart(2, '0')} Mins</span>
                    <span>{countdown.seconds.toString().padStart(2, '0')} Secs</span>
                  </div>
                </div>
                <Link href="/wishlist" className="absolute top-2 right-12 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100">
                  <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </Link>
              </div>
              <div className="mt-4">
                <Link href={product.url} className="block">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-purple-600">{product.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-800">₹{product.price}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                    )}
                  </div>
                  {product.rating && (
                    <div className="flex items-center mt-2">
                      <span className="text-sm text-gray-600">Rated</span>
                      <span className="text-sm font-bold text-gray-800 ml-1">{product.rating}</span>
                      <span className="text-sm text-gray-600 ml-1">out of 5</span>
                    </div>
                  )}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
