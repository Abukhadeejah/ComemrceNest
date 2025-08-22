import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Brand {
  name: string;
  image: string;
}

interface BrandCarouselProps {
  title?: string;
  brands?: Brand[];
  seeAllUrl?: string;
  bgColor?: string;
}

const defaultBrands: Brand[] = [
  { name: 'Nike', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop' },
  { name: 'Adidas', image: 'https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=200&h=200&fit=crop' },
  { name: 'Puma', image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=200&h=200&fit=crop' },
  { name: 'Reebok', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=200&h=200&fit=crop' },
  { name: 'Under Armour', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop' },
  { name: 'New Balance', image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=200&h=200&fit=crop' }
];

const BrandCarousel: React.FC<BrandCarouselProps> = ({
  title = "Shop by Brands",
  brands = defaultBrands,
  seeAllUrl = "/shop",
  bgColor = "bg-white"
}) => {
  return (
    <section className={`py-16 ${bgColor}`}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">{title}</h2>
        <div className="relative">
          <div className="grid grid-cols-6 gap-8">
            {brands.map((brand) => (
              <div key={brand.name} className="text-center">
                <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                  <Image
                    src={brand.image}
                    alt={brand.name}
                    width={200}
                    height={200}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                  <p className="text-sm font-medium text-gray-800">{brand.name}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute top-1/2 left-4 transform -translate-y-1/2">
            <button className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100">
              <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
            <button className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100">
              <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        <div className="text-center mt-8">
          <Link href={seeAllUrl} className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium">
            <span>See All</span>
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BrandCarousel;
