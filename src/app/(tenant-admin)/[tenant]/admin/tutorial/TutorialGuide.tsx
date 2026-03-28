'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  CheckCircleIcon, 
  ArrowRightIcon,
  TagIcon,
  PhotoIcon,
  CubeIcon,
  LinkIcon,
  LightBulbIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const steps = [
  {
    id: 1,
    title: "Tag Your Products",
    description: "Add descriptive tags to your products to create collections",
    icon: TagIcon,
    details: [
      "Go to Products → Edit any product",
      "In the 'Tags' field, add descriptive words like: rain, waterproof, summer, casual, formal",
      "Separate multiple tags with commas",
      "Tags help customers find products and create dynamic collections"
    ],
    example: "Example tags: rain, waterproof, monsoon, outdoor, weather-resistant",
    link: "/senlysh/admin/products",
    linkText: "Go to Products"
  },
  {
    id: 2,
    title: "Create Hero CTAs",
    description: "Use tags to create dynamic call-to-action buttons in your hero carousel",
    icon: PhotoIcon,
    details: [
      "Go to Hero Carousel → Edit any slide",
      "In CTA Destination, select 'Product Tags'",
      "Choose an existing tag or type a new one",
      "The system will automatically create the correct link"
    ],
    example: "Tag: 'rain' → Creates link: /products?tag=rain",
    link: "/senlysh/admin/hero",
    linkText: "Go to Hero Carousel"
  },
  {
    id: 3,
    title: "Test Your Collections",
    description: "Verify that your tag-based collections work correctly",
    icon: LinkIcon,
    details: [
      "Visit your storefront",
      "Click on hero CTA buttons",
      "Check that products with matching tags appear",
      "If no products show, add the tag to more products"
    ],
    example: "Rain Collection CTA → Shows all products tagged 'rain'",
    link: "/",
    linkText: "View Storefront"
  }
]

const tips = [
  {
    icon: LightBulbIcon,
    title: "Smart Tagging Tips",
    content: [
      "Use consistent tag names (e.g., 'summer' not 'summer' and 'Summer')",
      "Think like your customers - what words would they search for?",
      "Use descriptive tags: 'waterproof', 'formal', 'casual', 'trendy'",
      "Group related products with the same tags"
    ]
  },
  {
    icon: ExclamationTriangleIcon,
    title: "Common Mistakes",
    content: [
      "Don't create too many similar tags (e.g., 'rain', 'rainy', 'rainwear')",
      "Make sure products actually have the tags you reference in CTAs",
      "Test your CTAs after creating them to ensure they work",
      "Use tags that make sense for your product categories"
    ]
  }
]

export function TutorialGuide() {
  const [activeStep, setActiveStep] = useState(1)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Overview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-blue-900 mb-3">How It Works</h2>
        <p className="text-blue-800 mb-4">
          Our system uses <strong>tags</strong> to create dynamic collections. Instead of managing complex filters, 
          you simply tag your products and use those tags in your hero carousel CTAs.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <TagIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-blue-700">1. Tag Products</p>
          </div>
          <div className="text-center">
            <PhotoIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-blue-700">2. Create CTAs</p>
          </div>
          <div className="text-center">
            <LinkIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-blue-700">3. Test Collections</p>
          </div>
        </div>
      </div>

      {/* Step-by-Step Guide */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Step-by-Step Guide</h2>
        
        <div className="space-y-6">
          {steps.map((step) => (
            <div key={step.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  activeStep === step.id ? 'bg-indigo-600' : 'bg-gray-200'
                }`}>
                  <step.icon className={`h-6 w-6 ${
                    activeStep === step.id ? 'text-white' : 'text-gray-600'
                  }`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">{step.title}</h3>
                    <button
                      onClick={() => setActiveStep(activeStep === step.id ? 0 : step.id)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      {activeStep === step.id ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>
                  
                  <p className="text-gray-600 mt-1">{step.description}</p>
                  
                  {activeStep === step.id && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">How to do it:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                          {step.details.map((detail, idx) => (
                            <li key={idx}>{detail}</li>
                          ))}
                        </ol>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm font-medium text-gray-900 mb-1">Example:</p>
                        <p className="text-sm text-gray-700">{step.example}</p>
                      </div>
                      
                      <a
                        href={step.link}
                        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        {step.linkText}
                        <ArrowRightIcon className="ml-1 h-4 w-4" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips and Best Practices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {tips.map((tip, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <tip.icon className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900 mb-3">{tip.title}</h3>
                <ul className="space-y-2">
                  {tip.content.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/senlysh/admin/products"
            className="flex items-center justify-center space-x-2 bg-white border border-gray-300 rounded-md px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <CubeIcon className="h-5 w-5" />
            <span>Manage Products</span>
          </Link>
          <Link
            href="/senlysh/admin/hero"
            className="flex items-center justify-center space-x-2 bg-white border border-gray-300 rounded-md px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <PhotoIcon className="h-5 w-5" />
            <span>Hero Carousel</span>
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center space-x-2 bg-white border border-gray-300 rounded-md px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <LinkIcon className="h-5 w-5" />
            <span>View Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

