"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    id: "what-is-writehuman",
    q: "What is WriteHuman?",
    a: "An AI humanizer that transforms AI-generated content into natural, human-sounding writing.",
  },
  {
    id: "preserve-meaning",
    q: "Will my AI writing lose its original meaning?",
    a: "No. We preserve your message while improving tone, clarity, and flow.",
  },
  {
    id: "non-ai-writing",
    q: "Can I use it for non-AI writing?",
    a: "Yes, it enhances any text by improving readability and authenticity.",
  },
  {
    id: "word-limit",
    q: "What if my content exceeds the word limit?",
    a: "Split long content into chunks or upgrade for higher limits.",
  },
  {
    id: "compatibility",
    q: "What platforms and detectors are compatible?",
    a: "We test against popular detectors like GPTZero, Copyleaks, and Originality.",
  },
];

export function FAQ() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section className="section relative">
      <div className="absolute inset-0 bg-white/20" />
      <div className="container relative z-10">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="mb-6 text-ink font-extrabold tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="max-w-4xl mx-auto">
          {faqs.map((faq, index) => {
            const isOpen = openItems.includes(faq.id);

            return (
              <div
                key={faq.id}
                className="mb-6 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="card overflow-hidden">
                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="w-full p-8 text-left hover:bg-primary/5 transition-all duration-200 flex items-center justify-between group"
                  >
                    <h3 className="text-xl font-bold text-ink pr-6 group-hover:text-primary transition-colors">
                      {faq.q}
                    </h3>
                    <div className={`flex-none w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isOpen 
                        ? "bg-primary text-white" 
                        : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
                    }`}>
                      {isOpen ? (
                        <Minus className="w-5 h-5" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-8 pb-8 border-t border-border/20 bg-gray-50/50">
                      <div className="pt-6">
                        <p className="text-muted leading-relaxed text-lg">{faq.a}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
