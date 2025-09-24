"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, Loader2, Star } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface PricingTier {
  name: string;
  description: string;
  features: string[];
  pricing: {
    monthly: number;
    yearly: number;
  };
  popular?: boolean;
  stripePriceIds: {
    monthly: string;
    yearly: string;
  };
}

const pricingTiers: PricingTier[] = [
  {
    name: "Basic",
    description: "Essential features for individual users",
    features: [
      "Core functionality access",
      "100 requests per month",
      "Email support",
      "Basic analytics",
      "Standard response time",
    ],
    pricing: {
      monthly: 9.99,
      yearly: 99.99,
    },
    stripePriceIds: {
      monthly: "price_basic_monthly", // Replace with actual Stripe price ID
      yearly: "price_basic_yearly",
    },
  },
  {
    name: "Plus",
    description: "Advanced features for power users",
    features: [
      "All Basic features",
      "Unlimited requests",
      "Priority support",
      "Advanced analytics",
      "API access",
      "Export capabilities",
      "Priority response time",
    ],
    pricing: {
      monthly: 29.99,
      yearly: 299.99,
    },
    popular: true,
    stripePriceIds: {
      monthly: "price_plus_monthly", // Replace with actual Stripe price ID
      yearly: "price_plus_yearly",
    },
  },
];

interface PricingCardsProps {
  onSubscriptionStart?: () => void;
}

export function PricingCards({ onSubscriptionStart }: PricingCardsProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleSubscribe = async (tier: PricingTier) => {
    setLoadingTier(tier.name);
    onSubscriptionStart?.();

    try {
      const priceId = isYearly
        ? tier.stripePriceIds.yearly
        : tier.stripePriceIds.monthly;

      const response = await fetch(
        "/api/subscription/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            priceId,
            billingCycle: isYearly ? "yearly" : "monthly",
            tier: tier.name.toLowerCase(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error("Stripe failed to load");
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("Subscription error:", error);
      alert("Failed to start subscription. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  };

  const calculateSavings = (monthly: number, yearly: number) => {
    const monthlyCost = monthly * 12;
    const savings = monthlyCost - yearly;
    const percentage = Math.round((savings / monthlyCost) * 100);
    return { amount: savings, percentage };
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-gray-600 mb-6">
          Select the perfect plan for your homework help needs
        </p>

        <div className="flex items-center justify-center space-x-4 mb-8">
          <Label
            htmlFor="billing-toggle"
            className={`${!isYearly ? "font-medium" : ""}`}
          >
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <Label
            htmlFor="billing-toggle"
            className={`${isYearly ? "font-medium" : ""}`}
          >
            Yearly
          </Label>
          {isYearly && (
            <Badge variant="secondary" className="ml-2">
              Save up to 17%
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {pricingTiers.map((tier) => {
          const savings = calculateSavings(
            tier.pricing.monthly,
            tier.pricing.yearly
          );
          const currentPrice = isYearly
            ? tier.pricing.yearly
            : tier.pricing.monthly;
          const isLoading = loadingTier === tier.name;

          return (
            <Card
              key={tier.name}
              className={`relative ${
                tier.popular ? "border-blue-500 shadow-lg scale-105" : ""
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-3 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">
                  {tier.name}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {tier.description}
                </CardDescription>

                <div className="mt-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold">${currentPrice}</span>
                    <span className="text-gray-500 ml-1">
                      /{isYearly ? "year" : "month"}
                    </span>
                  </div>

                  {isYearly && (
                    <div className="mt-2">
                      <span className="text-sm text-green-600 font-medium">
                        Save ${savings.amount} ({savings.percentage}%) annually
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(tier)}
                  disabled={isLoading}
                  className={`w-full ${
                    tier.popular
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-gray-900 hover:bg-gray-800"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Get ${tier.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center mt-8 text-sm text-gray-600">
        <p>All plans include a 14-day free trial. Cancel anytime.</p>
        <p className="mt-2">
          Need a custom plan?{" "}
          <a href="/contact" className="text-blue-600 hover:underline">
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
}
