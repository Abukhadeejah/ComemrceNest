import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Category {
  name: string;
  image: string;
  url: string;
  count?: string;
  isTrending?: boolean;
  isNew?: boolean;
  hasSale?: boolean;
  salePercentage?: number;
  originalPrice?: string;
  salePrice?: string;
}

interface CategoryRow {
  title: string;
  categories: Category[];
  description?: string;
}

interface CategoriesSectionProps {
  title?: string;
  subtitle?: string;
  categoryRows?: CategoryRow[];
  bgColor?: string;
}

const defaultCategoryRows: CategoryRow[] = [
  {
    title: "Men&apos;s Fashion",
    description: "Discover the latest trends in men&apos;s clothing and accessories",
    categories: [
      { 
        name: 'T-Shirts', 
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop', 
        url: '/shop/men/t-shirts',
        count: '50+ Items',
        isTrending: true
      },
      { 
        name: 'Shirts', 
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop', 
        url: '/shop/men/shirts',
        count: '75+ Items',
        isNew: true
      },
      { 
        name: 'Jeans', 
        image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop', 
        url: '/shop/men/jeans',
        count: '40+ Items',
        hasSale: true,
        salePercentage: 30
      },
      { 
        name: 'Sweaters', 
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop', 
        url: '/shop/men/sweaters',
        count: '30+ Items',
        hasSale: true,
        salePercentage: 25
      },
      { 
        name: 'Jackets', 
        image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop', 
        url: '/shop/men/jackets',
        count: '25+ Items'
      },
      { 
        name: 'Shoes', 
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop', 
        url: '/shop/men/shoes',
        count: '60+ Items',
        isTrending: true
      }
    ]
  },
  {
    title: "Women&apos;s Fashion",
    description: "Explore stunning women&apos;s clothing, accessories, and footwear",
    categories: [
      { 
        name: 'Dresses', 
        image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop', 
        url: '/shop/women/dresses',
        count: '80+ Items',
        isTrending: true
      },
      { 
        name: 'Tops', 
        image: 'https://images.unsplash.com/photo-1592945403244-b3faa74b2c98?w=400&h=400&fit=crop', 
        url: '/shop/women/tops',
        count: '65+ Items',
        isNew: true
      },
      { 
        name: 'Skirts', 
        image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop', 
        url: '/shop/women/skirts',
        count: '45+ Items'
      },
      { 
        name: 'Jeans', 
        image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=400&fit=crop', 
        url: '/shop/women/jeans',
        count: '55+ Items',
        hasSale: true,
        salePercentage: 40
      },
      { 
        name: 'Shoes', 
        image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=400&fit=crop', 
        url: '/shop/women/shoes',
        count: '70+ Items',
        isTrending: true
      },
      { 
        name: 'Bags', 
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop', 
        url: '/shop/women/bags',
        count: '40+ Items',
        hasSale: true,
        salePercentage: 20
      }
    ]
  }
];

const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  title = "Shop by Category",
  subtitle = "Discover the latest trends in men&apos;s and women&apos;s fashion",
  categoryRows = defaultCategoryRows,
  bgColor = "bg-gray-50"
}) => {
  return (
    <section className={`py-12 sm:py-16 md:py-20 ${bgColor}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4">{title}</h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {/* Category Rows */}
        <div className="space-y-16 sm:space-y-20">
          {categoryRows.map((row, rowIndex) => (
            <div key={rowIndex} className="space-y-8">
              {/* Row Title */}
              <div className="text-center">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                  {row.title}
                </h3>
                {row.description && (
                  <p className="text-gray-600 text-lg mb-4">{row.description}</p>
                )}
                <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
              </div>

              {/* Categories Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
                {row.categories.map((category) => (
                  <Link key={category.name} href={category.url} className="group">
                    <div className="relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                      {/* Category Image */}
                      <div className="relative h-32 sm:h-40 md:h-48">
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                      </div>
                      
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {category.isTrending && (
                          <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold animate-pulse">
                            🔥 Trending
                          </span>
                        )}
                        {category.isNew && (
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                            ✨ New
                          </span>
                        )}
                        {category.hasSale && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                            {category.salePercentage}% OFF
                          </span>
                        )}
                      </div>

                      {/* Category Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                        <h4 className="text-white text-sm sm:text-base font-semibold mb-1">
                          {category.name}
                        </h4>
                        {category.count && (
                          <p className="text-white/80 text-xs sm:text-sm">
                            {category.count}
                          </p>
                        )}
                        {/* Price Info for Sale Items */}
                        {category.hasSale && category.salePercentage && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-yellow-300 text-xs font-semibold">
                              Up to {category.salePercentage}% off
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* View All Button for each row */}
              <div className="text-center">
                <Link 
                  href={rowIndex === 0 ? '/shop/men' : '/shop/women'}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  View All {rowIndex === 0 ? "Men&apos;s" : "Women&apos;s"} Fashion
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Value Section */}
        <div className="mt-16 sm:mt-20 bg-white rounded-2xl shadow-xl p-8 sm:p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Free Shipping</h4>
              <p className="text-gray-600">On orders above ₹999</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Easy Returns</h4>
              <p className="text-gray-600">30-day money back guarantee</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Secure Payment</h4>
              <p className="text-gray-600">100% secure checkout</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
