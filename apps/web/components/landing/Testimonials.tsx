"use client";

import React, { useState, useEffect } from "react";
import { testimonials } from "@/data/testimonials";

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 3) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(
      (prev) => (prev - 3 + testimonials.length) % testimonials.length
    );
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 3) % testimonials.length);
  };

  const getVisibleTestimonials = () => {
    const visible = [];
    for (let i = 0; i < 3; i++) {
      visible.push(testimonials[(currentIndex + i) % testimonials.length]);
    }
    return visible;
  };

  return (
    <section className="py-24 bg-black relative overflow-hidden font-mono">
      {/* Technical Grid Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(to right, #333 1px, transparent 1px),
              linear-gradient(to bottom, #333 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Technical System Info */}
      <div className="absolute top-8 left-8 text-gray-400 text-xs font-mono z-20">
        <div>USER_FEEDBACK.exe</div>
        <div>VERSION: v1.5.2</div>
        <div>RECORDS: 06</div>
        <div>STATUS: VERIFIED</div>
      </div>

      <div className="absolute top-8 right-8 text-gray-400 text-xs font-mono z-20">
        <div>DATABASE: TESTIMONIALS</div>
        <div>AUTHENTICITY: 100%</div>
        <div>LAST_UPDATE: 2025.11.22</div>
      </div>

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="text-gray-500 text-xs font-mono mb-8"></div>

          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 uppercase tracking-wider">
            LO.QUE.DICEN.NUESTROS.USUARIOS
          </h2>

          <div className="text-gray-500 text-sm font-mono mb-8">
            <div>
              ════════════════════════════════════════════════════════════════════
            </div>
          </div>

          <p className="text-lg text-gray-300 max-w-4xl mx-auto uppercase tracking-wide leading-relaxed">
            &gt; ÚNETE A MILES DE PROFESIONALES, INVESTIGADORES
            <br />
            &gt; Y ESTUDIANTES QUE HAN TRANSFORMADO SU
            <br />
            &gt; EXPERIENCIA DE NETWORKING
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-30 bg-black border border-white text-white w-12 h-12 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-200 font-mono text-xl"
            aria-label="Previous testimonials"
          >
            ←
          </button>

          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-30 bg-black border border-white text-white w-12 h-12 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-200 font-mono text-xl"
            aria-label="Next testimonials"
          >
            →
          </button>

          {/* Testimonials Grid with Animation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {getVisibleTestimonials().map((testimonial, index) => (
              <div
                key={`${currentIndex}-${index}`}
                className="border border-gray-600 bg-black hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 relative group p-6"
                style={{
                  animation: "fadeInUp 0.5s ease-out forwards",
                  animationDelay: `${index * 0.1}s`,
                  opacity: 0,
                }}
              >
                {/* Corner markers */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white opacity-50 group-hover:opacity-100 transition-opacity"></div>

                {/* Header Info */}
                <div className="flex justify-between text-gray-400 text-xs mb-4 border-b border-gray-700 pb-3">
                  <span>{testimonial.author.id}</span>
                  {testimonial.verified && <span>[VERIFIED]</span>}
                </div>

                {/* User Avatar Photo */}
                <div className="mb-4 flex justify-center">
                  <div className="relative w-24 h-24">
                    {/* Corner markers for image */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white z-10"></div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white z-10"></div>
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white z-10"></div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white z-10"></div>

                    <img
                      src={testimonial.author.avatar}
                      alt={testimonial.author.name}
                      className="w-full h-full object-cover border border-gray-600 grayscale group-hover:grayscale-0 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* User Data */}
                <div className="space-y-2 mb-4">
                  <div>
                    <div className="text-gray-400 text-xs">NAME:</div>
                    <div className="text-white text-sm tracking-wider">
                      {testimonial.author.name}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 text-xs">HANDLE:</div>
                    <div className="text-gray-300 text-sm">
                      {testimonial.author.handle}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 text-xs">CLEARANCE:</div>
                    <div className="text-white text-sm">
                      {testimonial.author.clearance}
                    </div>
                  </div>
                </div>

                {/* Testimonial Text */}
                <div className="border-t border-gray-700 pt-4 mb-4">
                  <div className="text-gray-400 text-xs mb-2">FEEDBACK:</div>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    &gt; {testimonial.text}
                  </p>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-700 pt-3 flex justify-between text-gray-500 text-xs">
                  <span>TIMESTAMP: {testimonial.timestamp}</span>
                  <span>●</span>
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Indicators */}
          <div className="flex justify-center gap-3 mt-12">
            {[0, 3].map((startIndex) => (
              <button
                key={startIndex}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrentIndex(startIndex);
                }}
                className={`w-3 h-3 border transition-all duration-300 ${
                  currentIndex === startIndex
                    ? "bg-white border-white"
                    : "bg-transparent border-gray-600 hover:border-gray-400"
                }`}
                aria-label={`Go to testimonial set ${startIndex / 3 + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
