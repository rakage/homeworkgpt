"use client";

import { useState } from "react";
import { Quote, Star } from "lucide-react";

const userCategories = ["Content Creators", "Writers", "SEO Specialists"];

const testimonial = {
  text: "WriteHuman has been a game-changer for our campaigns. The AI's ability to humanize text has deeply resonated with our audience.",
  author: "Alex K.",
  category: "Content Creator",
  rating: 5,
};

export function SocialProof() {
  const [activeCategory, setActiveCategory] = useState(userCategories[0]);

  return (
    <section className="section bg-white/50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="mb-4 text-ink">AI Writing that Resonates.</h2>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* User category tabs */}
          <div className="flex justify-center gap-2 mb-12">
            {userCategories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeCategory === category
                    ? "bg-primary text-white shadow-sm"
                    : "glass-panel text-muted hover:text-ink"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Testimonial card */}
          <div className="relative max-w-2xl mx-auto">
            <div className="card text-center relative">
              <Quote className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 text-primary bg-white rounded-full p-1 shadow-sm" />

              <div className="flex justify-center gap-1 mb-6 mt-4">
                {Array.from({ length: testimonial.rating }, (_, i) => (
                  <Star
                    key={`star-${testimonial.author}-${i}`}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              <blockquote className="text-xl text-ink mb-8 leading-relaxed font-medium">
                "{testimonial.text}"
              </blockquote>

              <div className="flex items-center justify-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ring-2 ring-primary/20"
                  style={{
                    background: `linear-gradient(135deg, var(--primary) 0%, var(--primary-soft) 100%)`,
                  }}
                >
                  {testimonial.author
                    .split(" ")
                    .map((name) => name[0])
                    .join("")}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-ink">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-muted">
                    {testimonial.category}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating trust indicators */}
            <div
              className="absolute -top-6 -right-6 glass-panel rounded-full p-3 animate-float"
              style={{ animationDelay: "1s" }}
            >
              <div className="text-center">
                <div className="text-lg font-bold text-primary">4.9</div>
                <div className="text-xs text-muted">Rating</div>
              </div>
            </div>

            <div
              className="absolute -bottom-6 -left-6 glass-panel rounded-full p-3 animate-float"
              style={{ animationDelay: "2s" }}
            >
              <div className="text-center">
                <div className="text-lg font-bold text-ink">50K+</div>
                <div className="text-xs text-muted">Users</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
