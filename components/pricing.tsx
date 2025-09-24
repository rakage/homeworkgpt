"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { CustomSwitch } from "./ui/custom-switch";

const plans = [
  {
    name: "Basic",
    badge: "",
    savingsBadge: "Save 33%",
    note: "Best for light users",
    price_monthly: 18,
    price_yearly: 12,
    features: [
      "80 humanizer requests/month",
      "600 words per request",
      "Access to Enhanced Model",
      "Basic customer support",
    ],
  },
  {
    name: "Pro",
    badge: "BEST VALUE",
    savingsBadge: "Save 33%",
    note: "Best for most users",
    price_monthly: 27,
    price_yearly: 18,
    features: [
      "200 humanizer requests/month",
      "1200 words per request",
      "Access to Enhanced Model",
      "Priority access to new features",
      "Priority customer support",
    ],
    highlighted: true,
  },
  {
    name: "Ultra",
    badge: "",
    savingsBadge: "Save 25%",
    note: "Best for power users",
    price_monthly: 48,
    price_yearly: 36,
    features: [
      "Unlimited requests per month",
      "3000 words per request",
      "Access to Enhanced Model",
      "Priority access to new features",
      "Priority customer support",
    ],
  },
];

export function Pricing() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <section className="section relative">
      <div className="absolute inset-0 bg-white/20" />
      <div className="container relative z-10">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="mb-6 text-ink font-extrabold tracking-tight">
            Choose the plan that's right for you.
          </h2>

          {/* Billing toggle */}
          <div className="inline-flex items-center bg-gray-200 rounded-2xl p-1">
            <button
              onClick={() => setIsYearly(false)}
              className={`relative px-6 py-2.5 rounded-xl text-base font-semibold transition-all duration-300 ${
                !isYearly ? "bg-white text-gray-900 shadow-md" : "text-gray-700"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`relative px-6 py-2.5 rounded-xl text-base font-semibold transition-all duration-300 flex items-center gap-2 ${
                isYearly ? "bg-white text-gray-900 shadow-md" : "text-gray-700"
              }`}
            >
              <span>Yearly</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-yellow-300 text-gray-900">
                Save 33%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative p-8 rounded-2xl bg-white animate-fade-in-up ${
                plan.highlighted
                  ? "ring-2 ring-purple-500 scale-105"
                  : "shadow-lg"
              }`}
              style={{
                animationDelay: `${index * 0.1}s`,
                boxShadow: plan.highlighted
                  ? "0 20px 40px rgba(147, 51, 234, 0.25)"
                  : "0 10px 30px rgba(0, 0, 0, 0.1)",
              }}
            >
              {/* Badges */}
              {plan.badge && (
                <div
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-1.5 text-xs font-bold rounded-full shadow-md z-10"
                >
                  {plan.badge}
                </div>
              )}
              {isYearly && plan.savingsBadge && (
                <div
                  className={`absolute -top-4 ${plan.badge ? 'right-4' : 'left-1/2 transform -translate-x-1/2'} bg-green-500 text-white px-3 py-1.5 text-xs font-bold rounded-full shadow-md z-10`}
                >
                  {plan.savingsBadge}
                </div>
              )}

              {/* Plan header */}
              <div className="text-center mb-8 mt-6">
                <h3 className="text-2xl font-extrabold text-ink mb-2 tracking-tight">
                  {plan.name}
                </h3>
                <p className="text-muted font-medium">{plan.note}</p>
              </div>

              {/* Pricing */}
              <div className="text-center mb-10">
                <div className="flex items-baseline justify-center">
                  <span className="text-3xl font-extrabold text-ink">$</span>
                  <span className="text-5xl font-extrabold text-ink tracking-tight">
                    {isYearly ? plan.price_yearly : plan.price_monthly}
                  </span>
                </div>
                <div className="text-sm text-muted font-medium mt-2">
                  Per month{isYearly ? ", billed annually" : ""}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-5 mb-10">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-4">
                    <div className="flex-none w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center mt-0.5">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-muted text-base leading-relaxed font-medium">
                      {feature.includes("Enhanced Model") && (
                        <span className="text-primary font-bold mr-1">
                          New!
                        </span>
                      )}
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                className={`w-full py-4 text-base font-semibold ${
                  plan.highlighted ? "btn-primary" : "btn-outline"
                }`}
              >
                Subscribe
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
