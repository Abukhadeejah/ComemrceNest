"use client"
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTenant } from '@/hooks/useTenant'
import { SITE_URLS } from '@/utils/site-urls'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'
import type { Product } from '@/types/product'
import { useCart } from '@/lib/cart'
import { PaymentLogos } from '@/components/PaymentLogos'

// Type for server response which may be partial
type ProductServerResponse = Partial<Product> & {
  id: string
  name: string
  pricecents: number
  currency?: string
  size_guide_type?: string | null
  productsizeguides?: {
    sizeguides: {
      id: string
      name: string
      category: string
      gender: string
      measurements: Record<string, Record<string, string>>
    }
  }[]
}

// Type for tenant config with additional properties
type TenantConfigWithExtras = {
  name?: string
  slug?: string
  [key: string]: unknown
}

interface VariantOptionValue {
  id: string
  value: string
  displayvalue: string
  colorhex: string | null | undefined
  imageurl: string | null | undefined
  sortorder: number
  priceadjustmentcents: number | null | undefined
  costadjustmentcents: number | null | undefined
}

interface VariantOptionData {
  id: string
  name: string
  displayname: string
  type: string
  variantoptionvalues: VariantOptionValue[]
}

interface VariantOption {
  variantoptions: VariantOptionData
}

interface ProductDetailProps {
  product: ProductServerResponse
  images: Record<string, unknown>[]
  variantOptions?: VariantOption[]
  variantCombinations?: Array<{
    id: string
    name: string
    pricecents: number
    stock: number
    sku: string
    attributes: Record<string, string>
  }>
  attributes?: Array<{
    id: string
    name: string
    values: Array<{ id: string; value: string }>
  }>
}

export function ProductDetail({ 
  product, 
  images, 
  variantOptions = [], 
  variantCombinations = [],
  attributes = [],
}: ProductDetailProps) {
  const { addItem } = useCart()
  const tenant = useTenant()
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [activeTab, setActiveTab] = useState('description')
  const [variantValidationError, setVariantValidationError] = useState<string>('')
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [showDeliveryReturns, setShowDeliveryReturns] = useState(false)
  const [showAskQuestion, setShowAskQuestion] = useState(false)
  const [sizeGuideImageUrl, setSizeGuideImageUrl] = useState<string | null>(() => {
    const uploadedUrl = (product as Record<string, unknown>)?.size_guide_type as string | undefined
    if (uploadedUrl && uploadedUrl.trim().length > 0) return uploadedUrl
    if (product.product_size_guides && Array.isArray(product.product_size_guides) && product.product_size_guides.length > 0) {
      const firstGuide = product.product_size_guides[0] as unknown as { size_guide_id?: string }
      return firstGuide?.size_guide_id || null
    }
    return null
  })
  const hasSizeGuide = Boolean(sizeGuideImageUrl) || Boolean(product.product_size_guides?.length) || Boolean(product.productsizeguides?.length)
  const [peopleViewing, setPeopleViewing] = useState(29)



  const calculateCurrentPrice = () => {
    // Ensure we have a valid base price
    const basePrice = product.pricecents || 0
    if (!basePrice || isNaN(basePrice)) {
      console.warn('Invalid product price:', product.pricecents, 'for product:', product.name)
      return 0
    }

    let currentPrice = basePrice

    // Priority 1: Check for direct variant combination price
    if (variantCombinations && variantCombinations.length > 0 && Object.keys(selectedVariants).length > 0) {
      // Find matching variant combination based on selected variants
      const matchingCombination = variantCombinations.find((combination) => {
        // Check if all selected variants match this combination's attributes
        return Object.entries(selectedVariants).every(([optionName, selectedValue]) => {
          // Find the option ID for this option name
          const option = variantOptions?.find((opt) => opt.variantoptions.name === optionName)
          if (!option) return false

          // Find the value ID for this value
          const value = option.variantoptions.variantoptionvalues.find((v) => v.value === selectedValue)
          if (!value) return false

          // Check if this combination has this option-value pair
          return combination.attributes[option.variantoptions.id] === value.id
        })
      })

      if (matchingCombination && matchingCombination.pricecents > 0) {
        return matchingCombination.pricecents
      }
    }

    // Priority 2: Fallback to base price + adjustments
    variantOptions?.forEach((option) => {
      const variantOption = option.variantoptions
      const selectedValue = selectedVariants[variantOption.name]
      if (selectedValue) {
        const optionValue = variantOption.variantoptionvalues.find((val) => val.value === selectedValue)
        if (optionValue?.priceadjustmentcents) {
          currentPrice += optionValue.priceadjustmentcents
        }
      }
    })

    return currentPrice
  }

  // Validation function to check if all required variants are selected
  const validateVariantSelection = (): { isValid: boolean; message: string } => {
    // If no variants exist for this product, validation passes
    if (!variantOptions || variantOptions.length === 0) {
      return { isValid: true, message: '' }
    }

    const missingVariants: string[] = []
    variantOptions.forEach((option) => {
      const variantOption = option.variantoptions
      const selectedValue = selectedVariants[variantOption.name]
      if (!selectedValue) {
        missingVariants.push(variantOption.displayname || variantOption.name)
      }
    })

    if (missingVariants.length > 0) {
      const message =
        missingVariants.length === 1
          ? `Please select ${missingVariants[0].toLowerCase()}`
          : `Please select ${missingVariants.join(', ').toLowerCase()}`
      return { isValid: false, message }
    }

    return { isValid: true, message: '' }
  }

  const currentPrice = calculateCurrentPrice()
  const hasDiscount = product.compare_at_price_cents && product.compare_at_price_cents > product.pricecents

  const allImages =
    product.hero_image_url
      ? [product.hero_image_url, ...images.map((img: Record<string, unknown>) => img.url as string)]
      : images.map((img: Record<string, unknown>) => img.url as string)

  // Auto-scroll images
  useEffect(() => {
    if (!isAutoScrolling || allImages.length <= 1) return

    const interval = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % allImages.length)
    }, 3000) // Change image every 3 seconds

    return () => clearInterval(interval)
  }, [isAutoScrolling, allImages.length])

  // Generate random people viewing count
  useEffect(() => {
    const generateRandomViewing = () => {
      const min = 15
      const max = 45
      const randomCount = Math.floor(Math.random() * (max - min + 1)) + min
      setPeopleViewing(randomCount)
    }

    // Generate initial count
    generateRandomViewing()

    // Update every 10-30 seconds
    const interval = setInterval(
      generateRandomViewing,
      Math.random() * 20000 + 10000 // Random interval between 10-30 seconds
    )

    return () => clearInterval(interval)
  }, [])

  const handleImageSelect = (index: number) => {
    setActiveImage(index)
    setIsAutoScrolling(false) // Stop auto-scrolling when user manually selects
  }

  const handleAddToCart = () => {
    // Clear any previous validation errors
    setVariantValidationError('')

    // Validate variant selection
    const validation = validateVariantSelection()
    if (!validation.isValid) {
      setVariantValidationError(validation.message)
      return
    }

    try {
      addItem({
        productId: String(product.id),
        name: String(product.name),
        price: currentPrice, // Use calculated current price
        imageUrl: (allImages[0] as string) || undefined,
        quantity,
        variant:
          Object.keys(selectedVariants).length > 0
            ? {
                id: Object.values(selectedVariants).join(','),
                name: 'Variant',
                options: selectedVariants,
              }
            : undefined,
      })
    } catch (e) {
      // Handle error
    }
  }

  const handleBuyNow = () => {
    // Clear any previous validation errors
    setVariantValidationError('')

    // Validate variant selection
    const validation = validateVariantSelection()
    if (!validation.isValid) {
      setVariantValidationError(validation.message)
      return
    }

    try {
      // Add to cart first
      addItem({
        productId: String(product.id),
        name: String(product.name),
        price: currentPrice, // Use calculated current price
        imageUrl: (allImages[0] as string) || undefined,
        quantity,
        variant:
          Object.keys(selectedVariants).length > 0
            ? {
                id: Object.values(selectedVariants).join(','),
                name: 'Variant',
                options: selectedVariants,
              }
            : undefined,
      })
      // Redirect to checkout
      window.location.href = '/checkout'
    } catch (e) {
      // Handle error
    }
  }

  try {
    return (
      <div className="bg-white">
        {/* Breadcrumb */}
        <div className="px-4 py-3 border-b border-gray-200">
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <Link href={SITE_URLS.home(tenant.key)} className="hover:text-gray-700">
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div
                className="aspect-square relative overflow-hidden rounded-lg bg-gray-100"
                onMouseEnter={() => setIsAutoScrolling(false)}
                onMouseLeave={() => setIsAutoScrolling(true)}
              >
                {allImages[activeImage] ? (
                  <Image
                    src={allImages[activeImage] as string}
                    alt={String(product.name)}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {allImages.length > 1 && (
                <div className="flex space-x-2">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => handleImageSelect(index)}
                      className={`w-16 h-16 rounded border-2 overflow-hidden transition-colors ${
                        activeImage === index
                          ? 'border-blue-500'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Image
                        src={image as string}
                        alt={`${String(product.name)} ${index + 1}`}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="bg-white rounded-lg p-6 space-y-6" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
              {/* Product Title */}
              <div>
                <h1 className="text-2xl font-bold text-black mb-4">{String(product.name)}</h1>
              </div>

              {/* Price Section */}
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-3xl font-bold text-gray-900">
                    ₹{currentPrice && !isNaN(currentPrice) ? (currentPrice / 100).toFixed(2) : '0.00'}
                  </span>
                  {hasDiscount && (
                    <span className="text-xl text-gray-500 line-through">
                      ₹{((product.compare_at_price_cents || 0) / 100).toFixed(2)}
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded">
                      {Math.round(((((product.compare_at_price_cents || 0) - currentPrice) / (product.compare_at_price_cents || 1)) * 100))}% OFF
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Inclusive of all taxes
                </div>
                {Object.keys(selectedVariants).length > 0 && (
                  <div className="text-sm text-indigo-600 font-medium">
                    {Object.keys(selectedVariants).length === (variantOptions?.length || 0) ? 
                      'Price updated for selected variants' : 
                      'Select all variants to see final price'
                    }
                  </div>
                )}
              </div>

              {/* Stock Status */}
              <div className="text-black font-normal mb-4">In stock</div>

              {/* Variant Selection */}
              {variantOptions && variantOptions.length > 0 && (
                <div className="space-y-4 mb-6">
                  {variantOptions.map((option, optionIndex) => {
                    try {
                      const variantOption = option?.variantoptions
                      if (!variantOption || !variantOption.variantoptionvalues) {
                        return null
                      }

                      return (
                        <div key={`${optionIndex}-${variantOption.id as unknown}`} className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            {variantOption.displayname || variantOption.name}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {variantOption.variantoptionvalues
                              .sort((a, b) => a.sortorder - b.sortorder)
                              .map((value) => (
                                <button
                                  key={value.id}
                                  onClick={() => {
                                    setSelectedVariants((prev) => ({
                                      ...prev,
                                      [variantOption.name]: value.value,
                                    }))
                                    // Clear validation error when user makes a selection
                                    setVariantValidationError('')
                                  }}
                                  className={`px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                                    selectedVariants[variantOption.name] === value.value
                                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                  }`}
                                  style={{
                                    backgroundColor:
                                      variantOption.type === 'color' && value.colorhex ? value.colorhex : undefined,
                                  }}
                                >
                                  {variantOption.type === 'color' && value.colorhex ? (
                                    <span className="sr-only">{value.displayvalue}</span>
                                  ) : (
                                    value.displayvalue
                                  )}
                                </button>
                              ))}
                          </div>
                        </div>
                      )
                    } catch (error) {
                      return null
                    }
                  })}
                </div>
              )}

              {/* Quantity Selector */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">Quantity</label>
                  <div className="flex items-center border border-gray-300 rounded-md h-10">
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 px-3 py-2 text-center border-0 focus:ring-0 focus:outline-none h-full"
                      min={1}
                    />
                    <div className="flex flex-col h-full">
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-2 py-1 text-gray-600 hover:text-gray-900 border-l border-gray-300 h-1/2 flex items-center justify-center"
                      >
                        +
                      </button>
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-2 py-1 text-gray-600 hover:text-gray-900 border-l border-gray-300 h-1/2 flex items-center justify-center"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Variant Validation Error */}
              {variantValidationError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-red-800 text-sm font-medium">{variantValidationError}</span>
                  </div>
                </div>
              )}



              {/* Action Buttons - KEPT BUT OPTIONAL */}
              <div className="flex space-x-3">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-md font-medium hover:bg-orange-600 transition-colors"
                >
                  ADD TO CART
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 bg-green-500 text-white py-3 px-6 rounded-md font-medium hover:bg-green-600 transition-colors"
                >
                  BUY NOW
                </button>
              </div>

              {/* Social Proof */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">👁️</span>
                  <span className="font-bold">{peopleViewing} people</span>
                  <span className="text-gray-600">are viewing this right now</span>
                </div>
              </div>

              {/* Quick Links */}
              <div className="flex space-x-4">
                {hasSizeGuide && (
                  <>
                    {sizeGuideImageUrl && (
                      <button
                        onClick={() => setShowSizeGuide(true)}
                        title="View Size Guide"
                        className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => setShowSizeGuide(true)}
                      className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <span>Size Guide</span>
                    </button>
                  </>
                )}
                {!hasSizeGuide && (
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <span>Size guide unavailable</span>
                  </div>
                )}
                <button
                  onClick={() => setShowDeliveryReturns(true)}
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <span>Delivery & Returns</span>
                </button>
                <button
                  onClick={() => setShowAskQuestion(true)}
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <QuestionMarkCircleIcon className="w-4 h-4" />
                  <span>Ask a Question</span>
                </button>
              </div>

              {/* Social Sharing */}
              <div className="text-center">
                <div className="flex justify-center space-x-4 mb-4">
                  {/* X (Twitter) */}
                  <button className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </button>
                  {/* Facebook */}
                  <button className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </button>
                  {/* Pinterest */}
                  <button className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z" />
                    </svg>
                  </button>
                  {/* Email */}
                  <button className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Guaranteed Safe Checkout */}
              <PaymentLogos />
            </div>
          </div>

          {/* Product Tabs */}
          <div className="border-t border-gray-200 mt-8">
            <div className="py-4">
              <div className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`text-sm font-medium pb-2 ${
                    activeTab === 'description'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Description
                </button>
                <button
                  onClick={() => setActiveTab('additional')}
                  className={`text-sm font-medium pb-2 ${
                    activeTab === 'additional'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Additional information
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`text-sm font-medium pb-2 ${
                    activeTab === 'reviews'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Reviews (0)
                </button>
              </div>
            </div>

            <div className="pb-6">
              {activeTab === 'description' && (
                <div className="text-gray-700">
                  <p>
                    {product.description ||
                      'This premium product offers exceptional quality and style. Perfect for your wardrobe essentials.'}
                  </p>
                </div>
              )}
              {activeTab === 'additional' && (
                <div className="text-gray-700">
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 font-medium">Brand</td>
                        <td className="py-2">{product.brand ? String(product.brand) : 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-medium">Quantity</td>
                        <td className="py-2">{product.stock || 'N/A'}</td>
                      </tr>
                      {attributes && attributes.length > 0 && (
                        <>
                          {attributes.map((attr) => (
                            <tr key={attr.id} className="border-b">
                              <td className="py-2 font-medium">{attr.name}</td>
                              <td className="py-2">{attr.values.map((v) => v.value).join(', ')}</td>
                            </tr>
                          ))}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === 'reviews' && (
                <div className="text-gray-700">
                  <div className="text-center py-8">
                    <p className="text-lg font-medium mb-4">0.00</p>
                    <div className="flex justify-center space-x-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className="w-5 h-5 text-gray-300" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">0 reviews</p>
                    <p className="text-sm text-gray-500 mt-4">There are no reviews yet.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          <div className="border-t border-gray-200 py-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Related Products</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Placeholder for related products */}
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center">
                  <span className="text-gray-400">Related Product {i}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Size Guide Modal */}
        {showSizeGuide && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-serif">
                  Size Guide
                </h3>
                <button
                  onClick={() => setShowSizeGuide(false)}
                  className="text-gray-500 hover:text-gray-700 ml-4"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Show uploaded size guide image if available */}
              {sizeGuideImageUrl ? (
                <div className="space-y-4">
                  <img
                    src={sizeGuideImageUrl}
                    alt="Size Guide"
                    className="w-full max-w-2xl mx-auto rounded-lg border border-gray-200"
                  />
                  <p className="text-center text-sm text-gray-600">
                    {(tenant as TenantConfigWithExtras)?.name || 'Store'} Size Guide
                  </p>
                </div>
              ) : product.productsizeguides && product.productsizeguides.length > 0 ? (
                /* Fallback to dynamic size guide table if available */
                <div className="overflow-hidden">
                  {product.productsizeguides.map((productSizeGuide, index) => {
                    const sizeGuide = productSizeGuide.sizeguides
                    return (
                      <div key={`${sizeGuide.id}-${index}`} className="mb-8">
                        <div className="mb-4">
                          <h4 className="text-lg font-semibold text-gray-900">{sizeGuide.name}</h4>
                          <p className="text-sm text-gray-600">
                            {sizeGuide.category} {sizeGuide.gender}
                          </p>
                        </div>
                        <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="text-left py-3 px-4 font-semibold border-r border-gray-200">Size</th>
                              {Object.keys(sizeGuide.measurements).map((measurement) => (
                                <th
                                  key={measurement}
                                  className="text-left py-3 px-4 font-semibold border-r border-gray-200 last:border-r-0"
                                >
                                  {measurement}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {Object.keys(sizeGuide.measurements[Object.keys(sizeGuide.measurements)[0]]).map(
                              (size) => (
                                <tr key={size} className="border-b border-gray-100 last:border-b-0">
                                  <td className="py-3 px-4 bg-gray-50 font-medium border-r border-gray-200">
                                    {size}
                                  </td>
                                  {Object.keys(sizeGuide.measurements).map((measurement) => (
                                    <td
                                      key={measurement}
                                      className="py-3 px-4 border-r border-gray-200 last:border-r-0"
                                    >
                                      {sizeGuide.measurements[measurement][size] || '-'}
                                    </td>
                                  ))}
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* Fallback to static size guide if no image or dynamic guides */
                <div className="overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold bg-gray-50">Size</th>
                        <th className="text-left py-3 px-4 font-semibold">Length</th>
                        <th className="text-left py-3 px-4 font-semibold">Width</th>
                        <th className="text-left py-3 px-4 font-semibold">Sleeve</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4 bg-gray-50 font-medium">S</td>
                        <td className="py-3 px-4">69</td>
                        <td className="py-3 px-4">53</td>
                        <td className="py-3 px-4">62</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4 bg-gray-50 font-medium">M</td>
                        <td className="py-3 px-4">71</td>
                        <td className="py-3 px-4">56</td>
                        <td className="py-3 px-4">63</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4 bg-gray-50 font-medium">L</td>
                        <td className="py-3 px-4">74</td>
                        <td className="py-3 px-4">58</td>
                        <td className="py-3 px-4">65</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4 bg-gray-50 font-medium">XL</td>
                        <td className="py-3 px-4">76</td>
                        <td className="py-3 px-4">61</td>
                        <td className="py-3 px-4">66</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 bg-gray-50 font-medium">XXL</td>
                        <td className="py-3 px-4">79</td>
                        <td className="py-3 px-4">64</td>
                        <td className="py-3 px-4">67</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-6 text-center text-sm text-gray-500">
                {(tenant as TenantConfigWithExtras)?.slug || 'store'}
              </div>
            </div>
          </div>
        )}

        {/* Delivery & Returns Modal */}
        {showDeliveryReturns && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Delivery & Returns</h3>
                <button
                  onClick={() => setShowDeliveryReturns(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Delivery</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Free delivery on orders over ₹999</li>
                    <li>• Standard delivery: 3-5 business days</li>
                    <li>• Express delivery: 1-2 business days</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Returns</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 30-day return policy</li>
                    <li>• Free return shipping</li>
                    <li>• Items must be unworn with tags</li>
                  </ul>
                </div>
              </div>
              <div className="text-center">
                <button
                  onClick={() => setShowDeliveryReturns(false)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ask a Question Modal */}
        {showAskQuestion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Ask About Product</h3>
                <button
                  onClick={() => setShowAskQuestion(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                  <input
                    type="text"
                    value={String(product.name)}
                    readOnly
                    className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="What you want to ask?"
                  />
                </div>
                <div className="text-center">
                  <button
                    onClick={() => setShowAskQuestion(false)}
                    className="bg-gray-800 text-white px-8 py-3 rounded-md hover:bg-gray-900 transition-colors"
                  >
                    SEND
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  } catch (error) {
    return (
      <div className="bg-white min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Details</h1>
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-700">
              There was an error loading the product details. Please try refreshing the page.
            </p>
          </div>
          <div className="bg-gray-50 rounded-md p-4">
            <h2 className="text-lg font-semibold mb-2">{product?.name || 'Product'}</h2>
            <p className="text-gray-600">
              Price: {product?.pricecents ? (product.pricecents / 100).toFixed(0) : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    )
  }
}
