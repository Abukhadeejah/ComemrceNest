'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ProductListItem } from '@/types/product'
import { HeartIcon, ShoppingBagIcon, EyeIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { useState } from 'react'
import { QuickViewModal } from './QuickViewModal'
import { generateProductBadges, getBadgeClassName, getBadgeStyle } from '@/utils/badges'
import { SITE_URLS } from '@/utils/site-urls'
import { useCart } from '@/lib/cart'


interface VariantCombination {
  product_id: string
  name: string | null
  price_cents: number
  stock: number | null
  sku: string | null
  attributes: Record<string, string>
}

interface ProductGridProps {
  products: ProductListItem[]
  variantCombinations?: VariantCombination[]
}

export function ProductGrid({ products, variantCombinations = [] }: ProductGridProps) {
  const [quickViewProduct, setQuickViewProduct] = useState<ProductListItem | null>(null)
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)

  // Get tenant key from URL path (most reliable approach)
  const getTenantKey = (): string | null => {
    if (typeof window !== 'undefined') {
      const pathSegments = window.location.pathname.split('/').filter(Boolean)
      if (pathSegments.length > 0 && (pathSegments[0] === 'bluebell' || pathSegments[0] === 'senlysh')) {
        return pathSegments[0]
      }
    }
    return null
  }

  const tenantKey = getTenantKey()

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-500 text-xl mb-4 font-medium">No products found</div>
        <p className="text-gray-400 max-w-md mx-auto">
          We couldn&apos;t find any products matching your criteria. Try adjusting your search or browse our categories.
        </p>
        <Link
          href={tenantKey ? SITE_URLS.products(tenantKey) : '/products'}
          className="inline-block mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
        >
          Browse All Products
        </Link>
      </div>
    )
  }

  const handleQuickView = (product: ProductListItem) => {
    setQuickViewProduct(product)
    setIsQuickViewOpen(true)
  }

  const closeQuickView = () => {
    setIsQuickViewOpen(false)
    setQuickViewProduct(null)
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
        {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onQuickView={handleQuickView}
          tenantKey={tenantKey}
          variantCombinations={variantCombinations}
        />
        ))}
      </div>

      {/* Quick View Modal */}
      {isQuickViewOpen && quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          isOpen={isQuickViewOpen}
          onClose={closeQuickView}
          variantCombinations={variantCombinations}
        />
      )}
    </>
  )
}

function ProductCard({
  product,
  onQuickView,
  tenantKey,
  variantCombinations = []
}: {
  product: ProductListItem;
  onQuickView: (product: ProductListItem) => void;
  tenantKey: string | null;
  variantCombinations?: VariantCombination[];
}) {
  const { addItem } = useCart()
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [variantValidationError, setVariantValidationError] = useState<string>('')

  // Get variant options from the product data
  const variantOptions = product.product_variant_options || []

  // Calculate current price based on selected variants with priority
  const calculateCurrentPrice = () => {
    if (variantOptions.length > 0 && Object.keys(selectedVariants).length > 0) {
      const productVariants = variantCombinations.filter(vc => vc.product_id === product.id)
      if (productVariants.length > 0) {
        const matching = productVariants.find(combination => {
          const allMatch = Object.entries(selectedVariants).every(([optionName, selectedValueId]) => {
            const option = variantOptions.find(o => o.variant_options.name === optionName)?.variant_options
            if (!option) return false
            const optId = String(option.id)
            const attrVal = combination.attributes[optId] 
              || combination.attributes[optId.toLowerCase()] 
              || combination.attributes[optId.toUpperCase()]
              || combination.attributes[option.name]
            const selectedValueObj = option.variant_option_values.find(v => v.id === selectedValueId)
            const selectedValueCanonical = selectedValueObj?.id || selectedValueId
            const selectedValueText = selectedValueObj?.value
            const isMatch = (
              String(attrVal).toLowerCase() === String(selectedValueCanonical).toLowerCase() ||
              (selectedValueText ? String(attrVal).toLowerCase() === String(selectedValueText).toLowerCase() : false)
            )
            
            return isMatch
          })
          return allMatch
        })
        if (matching && matching.price_cents > 0) {
          return matching.price_cents
        }
      }
    }

    let currentPrice = product.price_cents
    variantOptions.forEach(option => {
      const variantOption = option.variant_options
      const selectedValueId = selectedVariants[variantOption.name]
      if (selectedValueId) {
        const optionValue = variantOption.variant_option_values.find(
          val => val.id === selectedValueId
        )
        if (optionValue?.price_adjustment_cents) {
          currentPrice += optionValue.price_adjustment_cents
        }
      }
    })
    
    return currentPrice
  }

  const currentPrice = calculateCurrentPrice()

  // Validation function to check if all required variants are selected
  const validateVariantSelection = (): { isValid: boolean; message: string } => {
    if (!variantOptions || variantOptions.length === 0) {
      return { isValid: true, message: '' }
    }

    const missingVariants: string[] = []
    
    variantOptions.forEach(option => {
      const variantOption = option.variant_options
      const selectedValue = selectedVariants[variantOption.name]
      
      if (!selectedValue) {
        missingVariants.push(variantOption.display_name || variantOption.name)
      }
    })

    if (missingVariants.length > 0) {
      const message = missingVariants.length === 1 
        ? `Please select ${missingVariants[0].toLowerCase()}`
        : `Please select ${missingVariants.join(', ').toLowerCase()}`
      
      return { isValid: false, message }
    }

    return { isValid: true, message: '' }
  }

  const handleAddToCart = () => {
    setVariantValidationError('')
    
    const validation = validateVariantSelection()
    if (!validation.isValid) {
      setVariantValidationError(validation.message)
      return
    }

    try {
      addItem({
        productId: String(product.id),
        name: String(product.name),
        price: currentPrice,
        imageUrl: product.hero_image_url || undefined,
        quantity: 1,
        variant: Object.keys(selectedVariants).length > 0
          ? { id: `variant_${Object.values(selectedVariants).join('_')}`, name: 'Variant', options: selectedVariants }
          : undefined,
      })
      
      setVariantValidationError('')
    } catch (e) {
      setVariantValidationError('Failed to add item to cart. Please try again.')
    }
  }

  // Generate badges using the new badge system
  const badgeConfig = {
    is_featured: product.is_featured ?? undefined,
    is_bestseller: product.is_bestseller ?? undefined,
    is_new_arrival: product.is_new_arrival ?? undefined,
    is_on_sale: product.is_on_sale ?? undefined,
    is_limited_edition: product.is_limited_edition ?? undefined,
    is_sold_out: product.is_sold_out ?? undefined,
    custom_badge_text: product.custom_badge_text ?? undefined,
    badge_color: product.badge_color ?? undefined,
    badge_priority: product.badge_priority ?? undefined,
    badge_display_until: product.badge_display_until ?? undefined,
    badge_display_from: product.badge_display_from ?? undefined,
    compare_at_price_cents: product.compare_at_price_cents ?? undefined,
    price_cents: product.price_cents,
    stock: product.stock,
    low_stock_threshold: product.low_stock_threshold ?? undefined
  }
  
  const badges = generateProductBadges(badgeConfig)

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsWishlisted(!isWishlisted)
  }

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickView(product)
  }



  return (
    <div className="group bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-gray-200 transform hover:-translate-y-1 flex flex-col min-h-[520px]">
      {/* Product Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {product.hero_image_url ? (
          <Image
            src={product.hero_image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {badges.map((badge, i) => (
            <span 
              key={i} 
              className={`text-xs px-2 py-1 rounded-full font-medium shadow-sm ${getBadgeClassName(badge, product.badge_color)}`}
              style={getBadgeStyle(badge, product.badge_color)}
            >
              {badge.icon && <span className="mr-1">{badge.icon}</span>}
              {badge.text}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <button 
            onClick={handleWishlistToggle}
            className="bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
          >
            {isWishlisted ? (
              <HeartSolidIcon className="w-4 h-4 text-red-500" />
            ) : (
              <HeartIcon className="w-4 h-4 text-gray-600 hover:text-red-500" />
            )}
          </button>

          <button 
            onClick={handleQuickViewClick}
            className="bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
          >
            <EyeIcon className="w-4 h-4 text-gray-600 hover:text-indigo-600" />
          </button>
        </div>

        {/* View Details Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
          <Link
            href={tenantKey ? SITE_URLS.productDetail(product.slug, tenantKey) : `/products/${product.slug}`}
            className="bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-auto"
          >
            View Details
          </Link>
        </div>

        {/* Stock Status Overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 flex flex-col flex-1 justify-between">
        <div className="flex-1">
          <Link href={tenantKey ? SITE_URLS.productDetail(product.slug, tenantKey) : `/products/${product.slug}`} className="block group">
            <h3 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors duration-200 line-clamp-2 mb-2 leading-tight min-h-[2rem]">
              {product.name}
            </h3>
          </Link>
        
          {/* Star Rating */}
          <div className="flex items-center mb-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-1">(4.8)</span>
            <span className="text-xs text-gray-400 ml-2">• 127 reviews</span>
          </div>
        
          {/* Price Section */}
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">
                ₹{(calculateCurrentPrice() / 100).toFixed(2)}
              </span>
              {product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents && (
                <span className="text-sm text-gray-500 line-through">
                  ₹{(product.compare_at_price_cents / 100).toFixed(2)}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Inclusive of all taxes
            </div>
            {Object.keys(selectedVariants).length > 0 && (
              <div className="text-xs text-indigo-600 font-medium mt-1">
                {Object.keys(selectedVariants).length === variantOptions.length ? 
                  'Price updated for selected variants' : 
                  'Select all variants to see final price'
                }
              </div>
            )}
          </div>

          {/* Variant Options Preview */}
          {variantOptions.length > 0 && (
            <div className="space-y-2 mb-3">
              {variantOptions.map((option) => {
                const variantOption = option.variant_options
                return (
                  <div key={variantOption.id} className="flex flex-col gap-1">
                    <span className="text-xs text-gray-600 font-medium">
                      {variantOption.display_name || variantOption.name}:
                    </span>
                    <div className="flex gap-1 flex-wrap">
                      {variantOption.variant_option_values
                        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                        .map((value) => (
                          <button
                            key={value.id}
                            onClick={() => {
                              setSelectedVariants(prev => ({
                                ...prev,
                                [variantOption.name]: value.id
                              }))
                              setVariantValidationError('')
                            }}
                            className={`text-xs px-2 py-1 border rounded transition-colors duration-200 ${
                              selectedVariants[variantOption.name] === value.id
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            {value.display_value || value.value}
                          </button>
                        ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Variant Validation Error */}
          {variantValidationError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-2 mb-3">
              <div className="flex items-center">
                <svg className="h-4 w-4 text-red-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-800 text-xs font-medium">{variantValidationError}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {product.stock > 0 ? (
                <span className="text-xs text-green-600 font-medium">
                  {product.stock} in stock
                </span>
              ) : (
                <span className="text-xs text-red-600 font-medium">
                  Out of stock
                </span>
              )}
            </div>
            
            {/* View Details Button */}
            <Link
              href={tenantKey ? SITE_URLS.productDetail(product.slug, tenantKey) : `/products/${product.slug}`}
              className="bg-indigo-600 text-white text-sm py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center space-x-1"
            >
              <span>View Details</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
