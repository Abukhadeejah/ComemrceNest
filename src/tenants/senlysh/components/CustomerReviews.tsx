import React from 'react';
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


  return (
    <section className={`py-16 ${bgColor}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">{subtitle}</p>
          <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
        </div>
        
        {/* Horizontal Scrollable Container */}
        <div className="relative">
          <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-6
            scroll-smooth snap-x snap-mandatory
            [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {reviews.map((review, index) => (
              <div key={index} className="flex-shrink-0 w-80 sm:w-96 md:w-[500px] snap-start">
                <div className="bg-white p-8 rounded-lg shadow-lg text-center h-full">
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

          {/* Scroll Indicators */}
          <div className="flex justify-center mt-6 space-x-2">
            {reviews.map((_, index) => (
              <div key={index} className="w-2 h-2 bg-gray-300 rounded-full"></div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;
