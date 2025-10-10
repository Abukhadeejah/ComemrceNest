"use client"
import { useMemo, useState, useEffect } from 'react'
import { Playfair_Display } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700','800','900'] })

export type TestimonialItem = {
  initials: string
  name: string
  role: string
  quote: string
  rating?: number
}

type TestimonialsProps = {
  title?: string
  subtitle?: string
  items: TestimonialItem[]
}

export default function Testimonials({ title = 'What Our Clients Say', subtitle = 'Trusted by interior designers and homeowners worldwide', items }: TestimonialsProps) {
  const safeItems = useMemo(() => items.slice(0, 6), [items])
  const [currentSlide, setCurrentSlide] = useState(0)
  const totalSlides = 2

  // Auto-advance testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides)
    }, 8000)
    return () => clearInterval(interval)
  }, [totalSlides])

  const updateSlide = (slideIndex: number) => {
    setCurrentSlide(slideIndex)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
  }

  // Split items into 2 slides of 3 testimonials each
  const slide1Items = safeItems.slice(0, 3)
  const slide2Items = safeItems.slice(3, 6)

  const quoteIconColors = ['#DC2A38', '#FDCE59', '#01589D', '#4E302E', '#DC2A38', '#FDCE59']
  const borderColors = ['#DC2A38', '#FDCE59', '#01589D', '#4E302E', '#DC2A38', '#FDCE59']

  const renderTestimonialCard = (item: TestimonialItem, index: number) => (
    <div 
      key={item.name}
      className="bg-white p-10 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden"
      style={{ borderLeft: `6px solid ${borderColors[index]}` }}
    >
      <div 
        className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10"
        style={{ backgroundColor: `${borderColors[index]}10` }}
      ></div>
      <div className="relative z-10">
        <svg 
          className="w-12 h-12 mb-4 opacity-60" 
          fill="currentColor" 
          viewBox="0 0 24 24"
          style={{ color: quoteIconColors[index] }}
        >
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
        </svg>
        <p className="text-[#4E302E] text-xl mb-8 italic leading-relaxed font-light">
          {item.quote}
        </p>
      </div>
      <div className="flex items-center">
        <div className="w-16 h-16 bg-gradient-to-br from-[#4E302E] to-[#01589D] rounded-full flex items-center justify-center text-white font-bold text-lg mr-4 shadow-lg">
          {item.initials}
        </div>
        <div>
          <h4 className="font-bold text-[#01589D] text-lg">{item.name}</h4>
          <p className="text-[#4E302E] font-medium">{item.role}</p>
          <div className="flex mt-1">
            <span className="text-[#FDCE59]">★★★★★</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <section className="py-24 bg-gradient-to-br from-white via-gray-50 to-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg width="200" height="200" viewBox="0 0 200 200" className="w-full h-full">
          <pattern id="testimonial-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M20 5 Q15 15 20 25 Q25 15 20 5" fill="#DC2A38"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#testimonial-pattern)"/>
        </svg>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <h2 className={`${playfair.className} text-5xl md:text-7xl font-black text-[#01589D] mb-6 tracking-tight`}>
            {title}
          </h2>
          <div className="w-24 h-1 bg-[#FDCE59] mx-auto mb-6"></div>
          <p className="text-xl md:text-2xl text-[#4E302E] max-w-3xl mx-auto font-light leading-relaxed">
            {subtitle}
          </p>
        </div>
        
        {/* Testimonials Carousel */}
        <div className="relative overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {/* Testimonial Set 1 - First 3 cards */}
            <div className="w-full flex-shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {slide1Items.map((item, index) => renderTestimonialCard(item, index))}
              </div>
            </div>
            
            {/* Testimonial Set 2 - Next 3 cards */}
            <div className="w-full flex-shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {slide2Items.map((item, index) => renderTestimonialCard(item, index + 3))}
              </div>
            </div>
          </div>
          
          {/* Carousel Controls */}
          <div className="flex justify-center mt-12 space-x-4">
            <button 
              onClick={prevSlide}
              className="bg-[#01589D] hover:bg-[#DC2A38] text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <button 
              onClick={nextSlide}
              className="bg-[#01589D] hover:bg-[#DC2A38] text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
          
          {/* Carousel Indicators */}
          <div className="flex justify-center mt-6 space-x-2">
            {Array.from({ length: totalSlides }, (_, index) => (
              <button 
                key={index}
                onClick={() => updateSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-[#01589D]' 
                    : 'bg-[#01589D]/30'
                }`}
              ></button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
