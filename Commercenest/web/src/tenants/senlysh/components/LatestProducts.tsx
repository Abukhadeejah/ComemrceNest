import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  name: string;
  images: string[]; // Multiple images for hover effects
  price: number;
  originalPrice: number;
  badge: string;
  url: string;
  sizes?: string[];
  isNew?: boolean;
  isTrending?: boolean;
  discount?: number;
}

interface LatestProductsProps {
  title?: string;
  products?: Product[];
  bgColor?: string;
}

const defaultProducts: Product[] = [
  {
    name: 'Front Back Fusion Graphic Tee',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop'
    ],
    price: 599,
    originalPrice: 799,
    badge: 'Sale',
    url: '/product/front-back-graphic-tee',
    sizes: ['M-38', 'L-40', 'XL-42'],
    discount: 25
  },
  {
    name: 'Righteous -EDP 100ml-Premium Perfume',
    images: [
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1592945403244-b3faa74b2c98?w=400&h=400&fit=crop'
    ],
    price: 1500,
    originalPrice: 1690,
    badge: '-11%',
    url: '/product/righteous-edp-100ml-premium-perfume',
    discount: 11,
    isNew: true
  },
  {
    name: 'Boxers',
    images: [
      'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop'
    ],
    price: 600,
    originalPrice: 800,
    badge: '-25%',
    url: '/product/boxers',
    discount: 25,
    isTrending: true
  },
  {
    name: 'Dark Side EDP 100ml-Premium Perfume',
    images: [
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop'
    ],
    price: 1250,
    originalPrice: 1495,
    badge: '-16%',
    url: '/product/dark-side-edp-100ml-premium-perfume',
    discount: 16
  }
];

const LatestProducts: React.FC<LatestProductsProps> = ({
  title = "Latest Products",
  products = defaultProducts,
  bgColor = "bg-white"
}) => {
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: string]: number }>({});
  const [isTransitioning, setIsTransitioning] = useState<{ [key: string]: boolean }>({});

  // Auto-cycle images on hover
  useEffect(() => {
    if (!hoveredProduct) return;

    const interval = setInterval(() => {
      const product = products.find(p => p.name === hoveredProduct);
      if (product && product.images.length > 1) {
        setCurrentImageIndex(prev => ({
          ...prev,
          [hoveredProduct]: ((prev[hoveredProduct] || 0) + 1) % product.images.length
        }));
      }
    }, 3000); // 3 seconds interval

    return () => clearInterval(interval);
  }, [hoveredProduct, products]);

  const handleMouseEnter = (productName: string) => {
    setHoveredProduct(productName);
    setCurrentImageIndex(prev => ({ ...prev, [productName]: 0 }));
  };

  const handleMouseLeave = () => {
    setHoveredProduct(null);
  };

  const handleImageClick = (productName: string, index: number) => {
    setIsTransitioning(prev => ({ ...prev, [productName]: true }));
    setCurrentImageIndex(prev => ({ ...prev, [productName]: index }));
    
    // Reset transition flag after animation
    setTimeout(() => {
      setIsTransitioning(prev => ({ ...prev, [productName]: false }));
    }, 300);
  };

  return (
    <section className={`py-8 sm:py-12 md:py-16 ${bgColor}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 text-center mb-6 sm:mb-8 md:mb-12 animate-fade-in-up">{title}</h2>
        
        {/* Horizontal Scrollable Container */}
        <div className="relative">
          {/* Scrollable Products Grid */}
          <div className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-4 sm:pb-6
            scroll-smooth snap-x snap-mandatory
            [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {products.map((product, index) => {
              const isHovered = hoveredProduct === product.name;
              const imageIndex = currentImageIndex[product.name] || 0;
              const currentImage = product.images[imageIndex];

              return (
                <div 
                  key={product.name} 
                  className="group relative flex-shrink-0 w-64 sm:w-72 md:w-80 animate-fade-in-up snap-start"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onMouseEnter={() => handleMouseEnter(product.name)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Product Card Container - Fixed Height */}
                  <div className="relative overflow-hidden rounded-lg shadow-lg h-full flex flex-col
                    transition-all duration-300 ease-out will-change-transform
                    group-hover:scale-105 group-hover:shadow-xl
                    group-hover:-translate-y-1 motion-reduce:transition-none
                    hover:z-10">
                    
                    {/* Image Container - Fixed Height */}
                    <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden flex-shrink-0">
                      {/* All Product Images (for smooth transitions) */}
                      {product.images.map((image, imgIndex) => (
                        <div
                          key={imgIndex}
                          className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                            imgIndex === imageIndex ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          <Image
                            src={image}
                            alt={`${product.name} - View ${imgIndex + 1}`}
                            fill
                            loading="lazy"
                            className="object-cover transition-transform duration-700 ease-out
                              group-hover:scale-110 motion-reduce:transition-none"
                          />
                        </div>
                      ))}
                      
                      {/* Image Overlay */}
                      <div className="absolute inset-0 
                        bg-gradient-to-t from-black/20 via-transparent to-transparent
                        opacity-0 group-hover:opacity-100
                        transition-opacity duration-300 motion-reduce:transition-none"></div>

                      {/* Badge with enhanced animations */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {product.isNew && (
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold
                            animate-bounce hover:animate-pulse transition-all duration-200
                            hover:scale-110 hover:shadow-lg motion-reduce:animate-none">
                            ✨ New
                          </span>
                        )}
                        {product.isTrending && (
                          <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold 
                            animate-pulse hover:animate-bounce transition-all duration-200
                            hover:scale-110 hover:shadow-lg motion-reduce:animate-none">
                            🔥 Trending
                          </span>
                        )}
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold
                          transition-all duration-200 hover:scale-110 hover:shadow-lg
                          group-hover:bg-red-400">
                          {product.badge}
                        </span>
                      </div>

                      {/* Wishlist Button with enhanced hover */}
                      <Link href="/wishlist" className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-lg 
                        hover:bg-gray-100 transition-all duration-300 transform hover:scale-110 
                        motion-reduce:transition-none z-10 hover:shadow-xl
                        hover:-translate-y-0.5">
                        <svg className="h-4 w-4 text-gray-600 transition-transform duration-200
                          group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </Link>

                      {/* Quick Actions on Hover with staggered animation */}
                      <div className="absolute bottom-2 left-2 right-2 flex justify-center gap-2 opacity-0 group-hover:opacity-100 
                        transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 
                        motion-reduce:transition-none z-10">
                        <button className="bg-white text-gray-800 px-3 py-1 rounded-full text-xs font-semibold 
                          shadow-lg hover:bg-gray-100 transition-all duration-200 hover:scale-105
                          hover:shadow-xl hover:-translate-y-0.5">
                          Quick View
                        </button>
                        <button className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold 
                          shadow-lg hover:bg-purple-700 transition-all duration-200 hover:scale-105
                          hover:shadow-xl hover:-translate-y-0.5">
                          Add to Cart
                        </button>
                      </div>

                      {/* Image Navigation Dots with enhanced interaction */}
                      {product.images.length > 1 && (
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                          motion-reduce:transition-none z-10">
                          {product.images.map((_, dotIndex) => (
                            <button
                              key={dotIndex}
                              onClick={() => handleImageClick(product.name, dotIndex)}
                              className={`w-2 h-2 rounded-full transition-all duration-200 cursor-pointer
                                hover:scale-125 hover:shadow-sm ${
                                dotIndex === imageIndex 
                                  ? 'bg-white scale-125 shadow-sm' 
                                  : 'bg-white/50 hover:bg-white/75'
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Subtle shine effect on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 
                        transition-opacity duration-700 ease-out pointer-events-none
                        bg-gradient-to-r from-transparent via-white/20 to-transparent
                        transform -skew-x-12 -translate-x-full group-hover:translate-x-full
                        motion-reduce:transition-none"></div>
                    </div>

                    {/* Product Info - Flex Grow to Fill Space */}
                    <div className="p-3 sm:p-4 flex flex-col flex-grow">
                      <Link href={product.url} className="block flex-grow">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 
                          hover:text-purple-600 transition-colors duration-200 line-clamp-2 
                          motion-reduce:transition-none min-h-[2.5rem] sm:min-h-[3rem]
                          group-hover:scale-[1.02] transform-gpu">
                          {product.name}
                        </h3>
                        
                        {/* Price Section with enhanced hover */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-base sm:text-lg font-bold text-gray-800 
                              transition-colors duration-200 group-hover:text-purple-600">
                              ₹{product.price}
                            </span>
                            <span className="text-sm text-gray-500 line-through 
                              transition-opacity duration-200 group-hover:opacity-75">
                              ₹{product.originalPrice}
                            </span>
                          </div>
                          {product.discount && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-semibold
                              transition-all duration-200 hover:scale-110 hover:shadow-sm
                              group-hover:bg-red-200">
                              {product.discount}% OFF
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* Size Options - Fixed Height with enhanced interactions */}
                      <div className="mt-auto">
                        {product.sizes && (
                          <div className="flex flex-wrap gap-1 mt-2 min-h-[1.5rem]">
                            {product.sizes.map((size) => (
                              <Link 
                                key={size} 
                                href="#" 
                                className="text-xs text-gray-600 hover:text-purple-600 border border-gray-300 
                                  px-2 py-1 rounded transition-all duration-200 hover:border-purple-300 
                                  motion-reduce:transition-none hover:scale-105 hover:shadow-sm
                                  hover:-translate-y-0.5 transform-gpu"
                              >
                                {size}
                              </Link>
                            ))}
                          </div>
                        )}
                        {/* Spacer for products without sizes */}
                        {!product.sizes && <div className="min-h-[1.5rem]"></div>}
                      </div>
                    </div>

                    {/* Enhanced Hover Effect Overlay */}
                    <div className="absolute inset-0 
                      bg-gradient-to-t from-purple-500/10 via-purple-500/5 to-transparent 
                      opacity-0 group-hover:opacity-100 
                      transition-opacity duration-300 motion-reduce:transition-none"></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Scroll Indicators */}
          <div className="flex justify-center mt-6 space-x-2">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LatestProducts;
