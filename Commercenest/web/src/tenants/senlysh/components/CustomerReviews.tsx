import React, { useState } from 'react';
import Image from 'next/image';

interface Review {
  text: string;
  name: string;
  role: string;
  avatar?: string;
}

interface CustomerReviewsProps {
  title?: string;
  subtitle?: string;
  reviews?: Review[];
  bgColor?: string;
}

const defaultReviews: Review[] = [
  {
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.",
    name: "John Doe",
    role: "CEO"
  },
  {
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.",
    name: "John Doe",
    role: "CEO"
  },
  {
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.",
    name: "John Doe",
    role: "CEO"
  }
];

const CustomerReviews: React.FC<CustomerReviewsProps> = ({
  title = "Customers Review",
  subtitle = "WHAT BUYERS SAY",
  reviews = defaultReviews,
  bgColor = "bg-white"
}) => {
  const [currentReview, setCurrentReview] = useState(0);

  const nextReview = () => {
    setCurrentReview((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentReview((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  return (
    <section className={`py-16 ${bgColor}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">{subtitle}</p>
          <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
        </div>
        <div className="relative max-w-4xl mx-auto">
          <div className="relative overflow-hidden">
            <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentReview * 100}%)` }}>
              {reviews.map((review, index) => (
                <div key={index} className="w-full flex-shrink-0 px-4">
                  <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                    <div className="flex justify-center mb-4">
                      <Image
                        src={review.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face&${index}`}
                        alt={review.name}
                        width={100}
                        height={100}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    </div>
                    <p className="text-gray-600 mb-6 italic">&ldquo;{review.text}&rdquo;</p>
                    <div>
                      <p className="font-semibold text-gray-800">{review.name}</p>
                      <p className="text-sm text-gray-500">{review.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={prevReview}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100"
          >
            <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextReview}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100"
          >
            <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="flex justify-center mt-6 space-x-2">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentReview(index)}
                className={`w-3 h-3 rounded-full ${
                  index === currentReview ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;
