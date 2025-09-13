import React from 'react';
import Link from 'next/link';

interface FeatureIcon {
  icon: string;
  title: string;
  description: string;
  href?: string;
}

interface FeatureIconsProps {
  features?: FeatureIcon[];
  bgColor?: string;
}

const defaultFeatures: FeatureIcon[] = [
  { icon: '🚚', title: 'Free Shipping', description: 'Enjoy Free Shipping Across India!', href: '/senlysh/shipping' },
  { icon: '🕐', title: 'Support 12/7', description: 'We support 12h a day', href: '/senlysh/contact' },
  { icon: '💰', title: 'Cash Back Reward', description: 'Up to 50% for member', href: '/senlysh/rewards' },
  { icon: '🔒', title: 'Payment Secure', description: 'We ensure secure payment', href: '/senlysh/security' },
  { icon: '🎁', title: 'Discount', description: 'Up to 40% for member', href: '/senlysh/sale' }
];

const FeatureIcons: React.FC<FeatureIconsProps> = ({
  features = defaultFeatures,
  bgColor = "bg-gray-50"
}) => {
  return (
    <section className={`py-16 ${bgColor}`}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {features.map((feature) => (
            <Link key={feature.title} href={feature.href || "#"} className="text-center group">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureIcons;
