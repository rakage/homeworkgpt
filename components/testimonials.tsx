"use client";

import { useState } from "react";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    category: "Content Creators",
    quote: "WriteHuman has been a game-changer for our campaigns. The AI's ability to humanize text has deeply resonated with our audience.",
    author: "Alex K.",
    role: "Content Marketing Manager",
    avatar: "/api/placeholder/64/64"
  },
  {
    category: "Writers",
    quote: "As a professional writer, I was skeptical at first. But WriteHuman consistently produces natural, engaging content that passes every AI detector.",
    author: "Maria S.",
    role: "Freelance Writer",
    avatar: "/api/placeholder/64/64"
  },
  {
    category: "SEO Specialists",
    quote: "Our content now ranks better and engages users more effectively. The human-like quality is exactly what search engines reward.",
    author: "David R.",
    role: "SEO Director",
    avatar: "/api/placeholder/64/64"
  }
];

export function Testimonials() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="section relative">
      <div className="absolute inset-0 bg-white/40" />
      <div className="container relative z-10">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="mb-6 text-ink font-extrabold tracking-tight">
            AI Writing that Resonates.
          </h2>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="inline-flex items-center bg-gray-200 rounded-2xl p-1">
            {testimonials.map((testimonial, index) => (
              <button
                key={testimonial.category}
                onClick={() => setActiveTab(index)}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === index
                    ? "bg-white text-gray-900 shadow-md"
                    : "text-gray-700"
                }`}
              >
                {testimonial.category}
              </button>
            ))}
          </div>
        </div>

        {/* Testimonial Content */}
        <div className="max-w-4xl mx-auto">
          <div 
            className="card p-12 text-center relative overflow-hidden animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            {/* Background decoration */}
            <div 
              className="absolute inset-0 opacity-3"
              style={{
                background: `radial-gradient(circle at center, var(--primary-soft) 0%, transparent 70%)`,
              }}
            />
            
            {/* Quote icon */}
            <div className="relative z-10 mb-8">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Quote className="w-10 h-10 text-primary" />
              </div>
            </div>

            {/* Quote text */}
            <blockquote className="relative z-10 text-2xl md:text-3xl font-medium text-ink mb-10 leading-relaxed">
              "{testimonials[activeTab].quote}"
            </blockquote>

            {/* Author */}
            <div className="relative z-10 flex items-center justify-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-soft p-0.5">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {testimonials[activeTab].author.charAt(0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-left">
                <div className="font-bold text-ink text-lg">
                  {testimonials[activeTab].author}
                </div>
                <div className="text-muted font-medium">
                  {testimonials[activeTab].role}
                </div>
              </div>
            </div>

            {/* Rating stars */}
            <div className="relative z-10 flex justify-center gap-1 mt-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-accent text-accent" />
              ))}
            </div>

            {/* Decorative elements */}
            <div className="absolute top-8 right-8 w-8 h-8 rounded-full bg-accent/20 animate-float" />
            <div 
              className="absolute bottom-8 left-8 w-6 h-6 rounded-full bg-primary/20 animate-float"
              style={{ animationDelay: "1s" }}
            />
          </div>
        </div>

        {/* Tab indicators */}
        <div className="flex justify-center gap-3 mt-8 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                activeTab === index
                  ? "bg-primary"
                  : "bg-muted/30 hover:bg-muted/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}