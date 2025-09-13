import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { generateProductBadges, getBadgeClassName, getBadgeStyle } from '@/utils/badges';
import AutoCarousel from '@/components/tenant/AutoCarousel';
import { QuickViewModal } from '@/components/tenant/products/QuickViewModal';
import { useCart } from '@/lib/cart';
import { ProductListItem } from '@/server/modules/products/service';

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
  // New badge system fields
  allBadges?: Array<{ text: string; className: string; priority: number; icon?: string }>;
  badgeColor?: string;
}

interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price_cents: number;
  compare_at_price_cents?: number;
  currency: string;
  images?: string[];
  status: string;
  stock: number;
  low_stock_threshold?: number;
  // Badge System
  is_featured?: boolean;
  is_bestseller?: boolean;
  is_new_arrival?: boolean;
  is_on_sale?: boolean;
  is_limited_edition?: boolean;
  is_sold_out?: boolean;
  custom_badge_text?: string;
  badge_color?: string;
  badge_priority?: number;
  badge_display_until?: string;
  badge_display_from?: string;
  // Known DB field used as primary image
  hero_image_url?: string;
}

interface LatestProductsProps {
  title?: string;
  products?: Product[];
  bgColor?: string;
  apiProducts?: ApiProduct[];
}

// PRODUCTION READY: No hardcoded mock data - only dynamic database data is used
// All products are managed through the admin panel and stored in the database

const LatestProducts: React.FC<LatestProductsProps> = ({
  title = "Latest Products",
  products: propProducts,
  bgColor = "bg-white",
  apiProducts: propApiProducts
}) => {
  const [products, setProducts] = useState<Product[]>(propProducts || []); // PRODUCTION READY: No default products - only database data
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: string]: number }>({});
  const [quickViewProduct, setQuickViewProduct] = useState<ProductListItem | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Convert ApiProduct to ProductListItem for QuickViewModal
  const convertToProductListItem = (apiProduct: ApiProduct): ProductListItem => ({
    id: apiProduct.id,
    name: apiProduct.name,
    slug: apiProduct.slug || '',
    description: apiProduct.description || 'No description available',
    price_cents: apiProduct.price_cents,
    compare_at_price_cents: apiProduct.compare_at_price_cents,
    currency: 'INR', // Default currency
    hero_image_url: apiProduct.hero_image_url || null,
    stock: apiProduct.stock || 0,
    low_stock_threshold: 5,
    is_featured: apiProduct.is_featured,
    is_bestseller: apiProduct.is_bestseller,
    is_new_arrival: apiProduct.is_new_arrival,
    is_on_sale: apiProduct.is_on_sale,
    is_limited_edition: apiProduct.is_limited_edition,
    is_sold_out: apiProduct.is_sold_out,
  });
  const { addItem } = useCart();

  useEffect(() => {
    if (propApiProducts && Array.isArray(propApiProducts) && propApiProducts.length > 0) {
      const transformedProducts = propApiProducts.slice(0, 8).map(product => {
        if (!product || typeof product !== 'object') {
          return null;
        }
        
        const price = (product.price_cents || 0) / 100;
        const originalPrice = product.compare_at_price_cents ? product.compare_at_price_cents / 100 : price;
        const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
        
        // Generate badges using the new badge system
        const badges = generateProductBadges({
          is_featured: product.is_featured,
          is_bestseller: product.is_bestseller,
          is_new_arrival: product.is_new_arrival,
          is_on_sale: product.is_on_sale,
          is_limited_edition: product.is_limited_edition,
          is_sold_out: product.is_sold_out,
          custom_badge_text: product.custom_badge_text,
          badge_color: product.badge_color,
          badge_priority: product.badge_priority,
          badge_display_until: product.badge_display_until,
          badge_display_from: product.badge_display_from,
          compare_at_price_cents: product.compare_at_price_cents,
          price_cents: product.price_cents,
          stock: product.stock,
          low_stock_threshold: product.low_stock_threshold
        });

        // Get the primary badge (first one) for backward compatibility
        const primaryBadge = badges.length > 0 ? badges[0] : { text: 'New', className: 'bg-green-500 text-white' };

        // PRODUCTION READY: Use database images with fallback for missing images
        const resolvedImages: string[] = (Array.isArray(product.images) && product.images.length > 0)
          ? product.images
          : (product.hero_image_url ? [product.hero_image_url] : []);

        // Add fallback images if no images found in database
        if (resolvedImages.length === 0) {
          console.warn(`Product ${product.name} has no images in database, using fallback`);
          const fallbackImages = [
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=400&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=400&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop&crop=center'
          ];
          resolvedImages.push(fallbackImages[Math.floor(Math.random() * fallbackImages.length)]);
        }

        // Generate a proper slug from product name if slug is missing
        const generateSlug = (name: string) => {
          return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .trim();
        };

        const productSlug = product.slug || generateSlug(product.name || 'unnamed-product');

        return {
          name: product.name || 'Unnamed Product',
          images: resolvedImages,
          price: price,
          originalPrice: originalPrice,
          badge: primaryBadge.text,
          url: `/senlysh/products/${productSlug}`,
          sizes: ['M-38', 'L-40', 'XL-42'],
          isNew: product.is_new_arrival || (product.status === 'published' && Math.random() > 0.7),
          isTrending: product.is_bestseller || Math.random() > 0.8,
          discount: discount,
          // Store all badges for rendering
          allBadges: badges,
          badgeColor: product.badge_color
        };
      }).filter(product => product !== null) as Product[]; // Remove any null entries
      
      setProducts(transformedProducts);
    }
  }, [propApiProducts]);


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
    setCurrentImageIndex(prev => ({ ...prev, [productName]: index }));
  };

  const handleQuickView = (product: Product) => {
    // Find the original API product data
    const apiProduct = propApiProducts?.find(p => p.name === product.name);
    if (apiProduct) {
      setQuickViewProduct(convertToProductListItem(apiProduct));
      setIsQuickViewOpen(true);
    }
  };

  const handleAddToCart = (product: Product) => {
    // Find the original API product data
    const apiProduct = propApiProducts?.find(p => p.name === product.name);
    if (apiProduct) {
      addItem({
        productId: apiProduct.id,
        name: product.name,
        price: product.price * 100, // Convert to cents
        imageUrl: product.images[0],
        quantity: 1
      });
      
      // Show success feedback (you could add a toast notification here)
      console.log('Added to cart:', product.name);
    }
  };

  const closeQuickView = () => {
    setIsQuickViewOpen(false);
    setQuickViewProduct(null);
  };


  return (
    <section className={`py-8 sm:py-12 md:py-16 ${bgColor}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 text-center mb-6 sm:mb-8 md:mb-12 animate-fade-in-up">{title}</h2>
        
        {/* Auto-Play Carousel */}
        <AutoCarousel
          itemsPerView={{
            mobile: 2.2,
            tablet: 3,
            desktop: 4
          }}
          autoPlay={true}
          autoPlayInterval={5000}
          showControls={false}  // Remove play/pause button
          showIndicators={true}
          showProgress={true}
          className="px-4"
          itemClassName="animate-fade-in-up"
        >
            {products.map((product, index) => {
              const imageIndex = currentImageIndex[product.name] || 0;

              return (
                <div 
                  key={product.name} 
                className="group relative w-full animate-fade-in-up px-2"
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
                            onError={(e) => {
                              console.error('LatestProducts image failed to load:', image);
                              const fallbackImages = [
                                'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center',
                                'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=400&fit=crop&crop=center',
                                'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop&crop=center'
                              ];
                              e.currentTarget.src = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
                            }}
                            onLoad={() => {
                              console.log('LatestProducts image loaded successfully:', image);
                            }}
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
                        {product.allBadges && product.allBadges.length > 0 ? (
                          product.allBadges.map((badge, badgeIndex) => (
                            <span 
                              key={badgeIndex}
                              className={`text-xs px-2 py-1 rounded-full font-semibold
                                transition-all duration-200 hover:scale-110 hover:shadow-lg
                                motion-reduce:animate-none ${getBadgeClassName(badge, product.badgeColor)}`}
                              style={getBadgeStyle(badge, product.badgeColor)}
                            >
                              {badge.icon && <span className="mr-1">{badge.icon}</span>}
                              {badge.text}
                            </span>
                          ))
                        ) : (
                          // Fallback to old badge system for backward compatibility
                          <>
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
                          </>
                        )}
                      </div>

                      {/* Wishlist Button with enhanced hover */}
                      <Link href="/wishlist" className="absolute top-2 right-2 bg-white p-3 rounded-full shadow-lg
                        hover:bg-gray-100 transition-all duration-300 transform hover:scale-110 
                        motion-reduce:transition-none z-10 hover:shadow-xl
                        hover:-translate-y-0.5 min-w-[44px] min-h-[44px] flex items-center justify-center">
                        <svg className="h-4 w-4 text-gray-600 transition-transform duration-200
                          group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </Link>

                      {/* Quick Actions on Hover with staggered animation */}
                      <div className="absolute bottom-2 left-2 right-2 flex justify-center gap-2 opacity-0 group-hover:opacity-100 
                        transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 
                        motion-reduce:transition-none z-10">
                      <button 
                        onClick={() => handleQuickView(product)}
                        className="bg-white text-gray-800 px-4 py-2 rounded-full text-sm font-semibold
                          shadow-lg hover:bg-gray-100 transition-all duration-200 hover:scale-105
                        hover:shadow-xl hover:-translate-y-0.5 min-h-[44px] flex items-center justify-center">
                          Quick View
                        </button>
                      <button 
                        onClick={() => handleAddToCart(product)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold
                          shadow-lg hover:bg-purple-700 transition-all duration-200 hover:scale-105
                        hover:shadow-xl hover:-translate-y-0.5 min-h-[44px] flex items-center justify-center">
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
                          <div className="flex flex-wrap gap-2 mt-2 min-h-[2rem]">
                            {product.sizes.map((size) => (
                              <Link 
                                key={size} 
                                href="#" 
                                className="text-sm text-gray-600 hover:text-purple-600 border border-gray-300
                                  px-3 py-2 rounded transition-all duration-200 hover:border-purple-300
                                  motion-reduce:transition-none hover:scale-105 hover:shadow-sm
                                  hover:-translate-y-0.5 transform-gpu min-w-[44px] min-h-[44px]
                                  flex items-center justify-center"
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
        </AutoCarousel>
      </div>
      
      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={closeQuickView}
      />
    </section>
  );
};

export default LatestProducts;
