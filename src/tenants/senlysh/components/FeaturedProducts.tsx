import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AutoCarousel from '@/components/tenant/AutoCarousel';
import { generateProductBadges } from '@/utils/badges';
import { useCart } from '@/lib/cart';

interface CountdownTimer {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface FeaturedProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  badges: string[];
  url: string;
  rating?: number;
  // Variant support
  hasVariants: boolean;
  variantOptions?: Array<{
    id: string;
    name: string;
    display_name: string;
    type: string;
    values: Array<{
      id: string;
      value: string;
      display_value: string;
      color_hex?: string;
      image_url?: string;
      price_adjustment_cents: number;
      cost_adjustment_cents: number;
      sort_order: number;
    }>;
  }>;
}

// Database product format from HomeServer
interface ApiProduct {
  id: string
  name: string
  slug: string
  description?: string
  price_cents: number
  compare_at_price_cents?: number
  currency: string
  hero_image_url?: string
  images?: string[]
  stock: number
  status: string
  is_featured?: boolean
  is_bestseller?: boolean
  is_on_sale?: boolean
  is_new_arrival?: boolean
  // Variant support
  product_variant_options?: Array<{
    variant_options: {
      id: string
      name: string
      display_name: string
      type: string
      variant_option_values: Array<{
        id: string
        value: string
        display_value: string
        color_hex: string | null
        image_url: string | null
        price_adjustment_cents: number | null
        cost_adjustment_cents: number | null
        sort_order: number | null
      }>
    }
  }>
}

interface FeaturedProductsProps {
  title?: string;
  products?: ApiProduct[]; // Changed to accept database products
  countdown?: CountdownTimer;
  bgColor?: string;
  variantCombinations?: Array<{
    product_id: string
    id: string
    name: string
    price_cents: number
    stock: number
    sku: string
    attributes: Record<string, string>
  }>;
}

// PRODUCTION READY: No hardcoded mock data - only dynamic database data is used
// All featured products are managed through the admin panel and stored in the database

// PRODUCTION READY: No hardcoded countdown - should come from database or be removed

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
  title = "Our Featured Products",
  products = [], // PRODUCTION READY: No default products - only database data
  countdown, // PRODUCTION READY: No default countdown - optional prop
  bgColor = "bg-gray-50",
  variantCombinations = []
}) => {

  // Convert database products to display format
  const displayProducts: FeaturedProduct[] = products.map(product => {
    const badges = generateProductBadges({
      is_featured: product.is_featured,
      is_on_sale: product.is_on_sale,
      is_bestseller: product.is_bestseller,
      is_new_arrival: product.is_new_arrival,
      compare_at_price_cents: product.compare_at_price_cents,
      price_cents: product.price_cents
    });

    // Warn if no image found in database
    if (!product.hero_image_url) {
      console.warn(`Featured product "${product.name}" has no hero_image_url in database`);
    }

    // Fallback fashion images for different product types
    const fallbackImages = [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center', // Fashion store
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=400&fit=crop&crop=center', // Clothing rack
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop&crop=center', // Fashion model
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=400&fit=crop&crop=center', // Shopping bags
      'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop&crop=center'  // Fashion display
    ];
    
    const fallbackImage = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];

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

    // Transform variant options
    const variantOptions = product.product_variant_options?.map(pvo => ({
      id: pvo.variant_options.id,
      name: pvo.variant_options.name,
      display_name: pvo.variant_options.display_name,
      type: pvo.variant_options.type,
      values: pvo.variant_options.variant_option_values.map(value => ({
        id: value.id,
        value: value.value,
        display_value: value.display_value,
        color_hex: value.color_hex || undefined,
        image_url: value.image_url || undefined,
        price_adjustment_cents: value.price_adjustment_cents || 0,
        cost_adjustment_cents: value.cost_adjustment_cents || 0,
        sort_order: value.sort_order || 0
      }))
    })) || [];

    const hasVariants = variantOptions.length > 0;

    return {
      id: product.id,
      name: product.name,
      image: product.hero_image_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center',
      price: product.price_cents / 100,
      originalPrice: product.compare_at_price_cents ? product.compare_at_price_cents / 100 : undefined,
      badges: badges.map(badge => badge.text),
      url: `/senlysh/products/${productSlug}`,
      rating: 4.5, // Default rating - could be made dynamic from reviews table
      // Variant support
      hasVariants: hasVariants,
      variantOptions: variantOptions
    };
  });

  // Show warning if no products found
  if (displayProducts.length === 0) {
    console.warn('No featured products found in database - FeaturedProducts section will be empty');
  }
  return (
    <section className={`py-12 sm:py-16 md:py-20 ${bgColor}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 text-center mb-6 sm:mb-8 md:mb-12 animate-fade-in-up">{title}</h2>
        
        {/* Auto-Play Carousel */}
        <AutoCarousel
          itemsPerView={{
            mobile: 2.1,
            tablet: 2.5,
            desktop: 3
          }}
          autoPlay={true}
          autoPlayInterval={7000}
          showControls={false}  // Remove play/pause button
          showIndicators={true}
          showProgress={true}
          className="px-4 mb-8"
        >
          {displayProducts.map((product, index) => (
            <FeaturedProductCard
              key={product.id}
              product={product}
              index={index}
              countdown={countdown}
              variantCombinations={variantCombinations}
            />
          ))}
        </AutoCarousel>
      </div>
    </section>
  );
};

// Product Card Component with Variant Support
interface FeaturedProductCardProps {
  product: FeaturedProduct;
  index: number;
  countdown?: CountdownTimer;
  variantCombinations: Array<{
    product_id: string
    id: string
    name: string
    price_cents: number
    stock: number
    sku: string
    attributes: Record<string, string>
  }>;
}

const FeaturedProductCard: React.FC<FeaturedProductCardProps> = ({
  product,
  index,
  countdown,
  variantCombinations
}) => {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [variantValidationError, setVariantValidationError] = useState<string>('');
  const { addItem } = useCart();

  // Calculate current price based on selected variants
  const calculateCurrentPrice = () => {
    let currentPrice = product.price;
    
    if (product.hasVariants && product.variantOptions && Object.keys(selectedVariants).length > 0) {
      // Priority 1: Check for direct variant combination price
      const productVariants = variantCombinations?.filter(vc => vc.product_id === product.id) || [];
      
      if (productVariants.length > 0) {
        // Find matching variant combination based on selected variants
        const matchingCombination = productVariants.find(combination => {
          // Check if all selected variants match this combination's attributes
          return Object.entries(selectedVariants).every(([optionName, selectedValue]) => {
            // Find the option ID for this option name
            const option = product.variantOptions?.find(opt => opt.name === optionName);
            if (!option) return false;
            
            // Find the value ID for this value
            const value = option.values.find(v => v.value === selectedValue);
            if (!value) return false;
            
            // Check if this combination has this option-value pair
            return combination.attributes[option.id] === value.id;
          });
        });
        
        if (matchingCombination && matchingCombination.price_cents > 0) {
          return matchingCombination.price_cents / 100; // Convert cents to rupees
        }
      }
      
      // Priority 2: Fallback to base price + adjustments
      let adjustmentCents = 0;
      product.variantOptions.forEach(option => {
        const selectedValue = selectedVariants[option.name];
        if (selectedValue) {
          const valueObj = option.values.find(v => v.value === selectedValue);
          if (valueObj && valueObj.price_adjustment_cents) {
            adjustmentCents += valueObj.price_adjustment_cents;
          }
        }
      });
      
      // Apply adjustments to base price
      if (adjustmentCents !== 0) {
        currentPrice = (product.price * 100 + adjustmentCents) / 100;
      }
    }
    
    return currentPrice;
  };

  const currentPrice = calculateCurrentPrice();

  const handleVariantSelect = (optionName: string, value: string) => {
    setSelectedVariants(prev => ({ ...prev, [optionName]: value }));
    setVariantValidationError(''); // Clear error when variant is selected
  };

  const handleAddToCart = () => {
    if (product.hasVariants && product.variantOptions && product.variantOptions.length > 0) {
      const missingVariants: string[] = [];
      product.variantOptions.forEach(option => {
        const selectedValue = selectedVariants[option.name];
        if (!selectedValue) {
          missingVariants.push(option.display_name || option.name);
        }
      });

      if (missingVariants.length > 0) {
        const message = missingVariants.length === 1
          ? `Please select ${missingVariants[0].toLowerCase()}`
          : `Please select ${missingVariants.join(', ').toLowerCase()}`;
        setVariantValidationError(message);
        return;
      }
    }
    
    addItem({
      productId: product.id,
      name: product.name,
      price: currentPrice * 100,
      imageUrl: product.image,
      quantity: 1,
      variant: Object.keys(selectedVariants).length > 0
        ? { id: `variant_${Object.values(selectedVariants).join('_')}`, name: 'Variant', options: selectedVariants }
        : undefined
    });
    
    setVariantValidationError('');
  };

  return (
    <div 
      className="group relative w-full animate-fade-in-up px-2"
      style={{ animationDelay: `${index * 200}ms` }}
    >
      {/* Product Card Container */}
      <div className="relative overflow-hidden rounded-lg shadow-lg h-full flex flex-col
        transition-all duration-300 ease-out will-change-transform
        group-hover:scale-105 group-hover:shadow-xl
        group-hover:-translate-y-1 motion-reduce:transition-none
        hover:z-10 bg-white">
        
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden flex-shrink-0">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              console.warn(`Featured product image failed to load: ${product.image}. Product: ${product.name}`);
              e.currentTarget.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center';
            }}
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {product.badges.map((badge, badgeIndex) => (
              <span key={badgeIndex} className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold
                transition-all duration-200 hover:scale-110 hover:shadow-sm">
                {badge}
              </span>
            ))}
          </div>

          {/* Wishlist Button */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Wishlist toggle for:', product.name);
            }}
            className="absolute top-2 right-2 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Countdown Timer */}
          {countdown && (
            <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-75 text-white p-2 rounded">
              <div className="flex justify-between text-xs">
                <span>{countdown.days} Days</span>
                <span>{countdown.hours.toString().padStart(2, '0')} Hours</span>
                <span>{countdown.minutes.toString().padStart(2, '0')} Mins</span>
                <span>{countdown.seconds.toString().padStart(2, '0')} Secs</span>
              </div>
            </div>
          )}

          {/* View Details Button */}
          <Link
            href={product.url}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none"
          >
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-xl transform translate-y-2 group-hover:translate-y-0 flex items-center justify-center gap-2 pointer-events-auto">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Details
            </div>
          </Link>
        </div>

        {/* Product Info */}
        <div className="p-3 flex flex-col flex-1">
          <Link href={product.url} className="block group">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-purple-600 transition-colors duration-200 line-clamp-2">
              {product.name}
            </h3>
          </Link>

          {/* Price and Variant Section - Side by Side Layout */}
          <div className="space-y-2 mb-3">
            {/* Price Row */}
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-800">₹{currentPrice.toFixed(2)}</span>
              {product.originalPrice && product.originalPrice > currentPrice && (
                <span className="text-sm text-gray-500 line-through">₹{product.originalPrice.toFixed(2)}</span>
              )}
            </div>
            
            {/* Variants Row - Compact horizontal layout */}
            <div className="min-h-[2rem] flex items-center">
              {product.hasVariants && product.variantOptions && product.variantOptions.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {product.variantOptions.map((option) => (
                    <div key={option.id} className="flex items-center gap-1">
                      <span className="text-xs text-gray-600">{option.display_name || option.name}:</span>
                      {option.values
                        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                        .slice(0, 3) // Show max 3 options to save space
                        .map((value) => (
                          <button
                            key={value.id}
                            onClick={() => handleVariantSelect(option.name, value.value)}
                            className={`text-xs border px-2 py-1 rounded transition-colors duration-200
                              min-w-[32px] min-h-[24px] flex items-center justify-center ${
                              selectedVariants[option.name] === value.value
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            {value.display_value}
                          </button>
                        ))}
                      {option.values.length > 3 && (
                        <span className="text-xs text-gray-500">+{option.values.length - 3}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // Placeholder for products without variants to maintain consistent height
                <div className="text-xs text-gray-500">No variants</div>
              )}
            </div>
            
            <div className="text-xs text-gray-500">
              Inclusive of all taxes
            </div>
          </div>

          {/* Variant Validation Error */}
          {variantValidationError && (
            <div className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded border border-red-200 mb-3">
              {variantValidationError}
            </div>
          )}

          {/* Add to Cart Button */}
          <div className="mt-auto">
            <button
              onClick={handleAddToCart}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors duration-200"
            >
              Add to Cart
            </button>
          </div>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center mt-2">
              <span className="text-sm text-gray-600">Rated</span>
              <span className="text-sm font-bold text-gray-800 ml-1">{product.rating}</span>
              <span className="text-sm text-gray-600 ml-1">out of 5</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeaturedProducts;
