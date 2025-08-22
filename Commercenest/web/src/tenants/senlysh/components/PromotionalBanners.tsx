import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface PromotionalBanner {
  title: string;
  subtitle: string;
  image: string;
  url: string;
}

interface PromotionalBannersProps {
  banners?: PromotionalBanner[];
  bgColor?: string;
}

const defaultBanners: PromotionalBanner[] = [
  {
    title: 'Classic Eye Glasses',
    subtitle: 'Discover timeless elegance',
    image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400&h=600&fit=crop',
    url: '/categories/glasses'
  },
  {
    title: 'Summer Collection',
    subtitle: 'Sale off 25%',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=600&fit=crop',
    url: '/categories/summer'
  },
  {
    title: 'Glasses & Sunglasses',
    subtitle: 'Sale off 25%',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=600&fit=crop',
    url: '/categories/sunglasses'
  }
];

const PromotionalBanners: React.FC<PromotionalBannersProps> = ({
  banners = defaultBanners,
  bgColor = "bg-white"
}) => {
  return (
    <section className={`py-16 ${bgColor}`}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {banners.map((banner) => (
            <Link key={banner.title} href={banner.url} className="group">
              <div className="relative overflow-hidden rounded-lg shadow-lg">
                <Image
                  src={banner.image}
                  alt={banner.title}
                  width={400}
                  height={600}
                  className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{banner.title}</h3>
                  <p className="text-white mb-4">{banner.subtitle}</p>
                  <div className="flex items-center text-white">
                    <span>Shop Now</span>
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromotionalBanners;
