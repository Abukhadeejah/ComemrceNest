import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  name: string;
  image: string;
  price: number;
  originalPrice: number;
  badge: string;
  url: string;
  sizes?: string[];
}

interface LatestProductsProps {
  title?: string;
  products?: Product[];
  bgColor?: string;
}

const defaultProducts: Product[] = [
  {
    name: 'Front Back Fusion Graphic Tee',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    price: 599,
    originalPrice: 799,
    badge: 'Sale',
    url: '/product/front-back-graphic-tee',
    sizes: ['M-38', 'L-40', 'XL-42']
  },
  {
    name: 'Righteous -EDP 100ml-Premium Perfume',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop',
    price: 1500,
    originalPrice: 1690,
    badge: '-11%',
    url: '/product/righteous-edp-100ml-premium-perfume'
  },
  {
    name: 'Boxers',
    image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop',
    price: 600,
    originalPrice: 800,
    badge: '-25%',
    url: '/product/boxers'
  },
  {
    name: 'Dark Side EDP 100ml-Premium Perfume',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop',
    price: 1250,
    originalPrice: 1495,
    badge: '-16%',
    url: '/product/dark-side-edp-100ml-premium-perfume'
  }
];

const LatestProducts: React.FC<LatestProductsProps> = ({
  title = "Latest Products",
  products = defaultProducts,
  bgColor = "bg-white"
}) => {
  return (
    <section className={`py-8 sm:py-12 md:py-16 ${bgColor}`}>
      <div className="container mx-auto px-2 sm:px-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 text-center mb-6 sm:mb-8 md:mb-12">{title}</h2>
        <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-6">
          {products.map((product) => (
            <div key={product.name} className="group relative">
              <div className="relative overflow-hidden rounded-md sm:rounded-lg shadow-md sm:shadow-lg">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={400}
                  height={400}
                  className="w-full h-32 sm:h-48 md:h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-red-500 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-semibold">
                  {product.badge}
                </div>
                <Link href="/wishlist" className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-white p-1 sm:p-2 rounded-full shadow-md sm:shadow-lg hover:bg-gray-100">
                  <svg className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </Link>
              </div>
              <div className="mt-2 sm:mt-3 md:mt-4">
                <Link href={product.url} className="block">
                  <h3 className="text-xs sm:text-sm md:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 hover:text-purple-600 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <span className="text-sm sm:text-base md:text-lg font-bold text-gray-800">₹{product.price}</span>
                    <span className="text-xs sm:text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                  </div>
                </Link>
                {product.sizes && (
                  <div className="flex space-x-1 sm:space-x-2 mt-1 sm:mt-2">
                    {product.sizes.map((size) => (
                      <Link key={size} href="#" className="text-xs sm:text-sm text-gray-600 hover:text-purple-600 border border-gray-300 px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                        {size}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestProducts;
