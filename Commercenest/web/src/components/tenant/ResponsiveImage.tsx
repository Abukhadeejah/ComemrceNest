'use client'

import React from 'react';
import Image from 'next/image';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  fill = false,
  width,
  height,
  className = '',
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  quality = 85,
  placeholder = 'empty',
  blurDataURL,
}) => {
  // Generate responsive srcSet for better performance
  const generateSrcSet = (baseSrc: string) => {
    // For external URLs, return as-is (Next.js handles optimization)
    if (baseSrc.startsWith('http')) {
      return undefined;
    }

    // For local images, Next.js handles responsive optimization automatically
    return undefined;
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        sizes={sizes}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  );
};

export default ResponsiveImage;





