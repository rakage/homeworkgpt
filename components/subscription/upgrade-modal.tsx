"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Zap, Crown } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
}

const plans: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    price: {
      monthly: 9.99,
      yearly: 99.99,
    },
    features: [
      "100 requests per month",
      "Advanced citations",
      "File uploads up to 25MB",
      "Export capabilities",
      "Email support",
    ],
    icon: <Zap className="h-5 w-5" />,
  },
  {
    id: "plus",
    name: "Plus",
    price: {
      monthly: 29.99,
      yearly: 299.99,
    },
    features: [
      "Unlimited requests",
      "Priority processing",
      "Advanced analytics",
      "API access",
      "Priority support",
      "Custom integrations",
    ],
    popular: true,
    icon: <Crown className="h-5 w-5" />,
  },
];

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: string | null;
}

export function UpgradeModal({
  isOpen,
  onClose,
  currentTier,
}: UpgradeModalProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [loading, setLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const supabase = createClient();

  const handleUpgrade = async (planId: string) => {
    setLoading(true);
    setLoadingPlan(planId);

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Please log in to upgrade your subscription");
      }

      // Create checkout session
      const response = await fetch(
        "/api/subscription/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tier: planId,
            billing_cycle: billingCycle,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to start upgrade process"
      );
    } finally {
      setLoading(false);
      setLoadingPlan(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getYearlySavings = (plan: Plan) => {
    const monthlyTotal = plan.price.monthly * 12;
    const savings = monthlyTotal - plan.price.yearly;
    const percentage = Math.round((savings / monthlyTotal) * 100);
    return { amount: savings, percentage };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription className="text-center">
            Unlock more features and get unlimited access to Homework Help GPT
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center">
            <div className="bg-gray-100 p-1 rounded-lg flex">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === "monthly"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
                  billingCycle === "yearly"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Yearly
                <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs">
                  Save 20%
                </Badge>
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = currentTier === plan.id;
              const price = plan.price[billingCycle];
              const savings =
                billingCycle === "yearly" ? getYearlySavings(plan) : null;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border p-6 ${
                    plan.popular
                      ? "border-blue-500 ring-2 ring-blue-500 ring-opacity-20"
                      : "border-gray-200"
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                      Most Popular
                    </Badge>
                  )}

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {plan.icon}
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                    </div>

                    <div className="mb-4">
                      <span className="text-3xl font-bold">
                        {formatPrice(price)}
                      </span>
                      <span className="text-gray-600">
                        /{billingCycle === "monthly" ? "month" : "year"}
                      </span>

                      {savings && (
                        <div className="text-sm text-green-600 font-medium">
                          Save {formatPrice(savings.amount)} (
                          {savings.percentage}%)
                        </div>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6 text-left">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={loading || isCurrentPlan}
                      className={`w-full ${
                        plan.popular
                          ? "bg-blue-500 hover:bg-blue-600"
                          : "bg-gray-900 hover:bg-gray-800"
                      }`}
                    >
                      {loading && loadingPlan === plan.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : isCurrentPlan ? (
                        "Current Plan"
                      ) : (
                        `Upgrade to ${plan.name}`
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Features Comparison */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold mb-4 text-center">
              Why upgrade?
            </h4>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-500 mb-1">∞</div>
                <div className="text-sm font-medium">Unlimited Requests</div>
                <div className="text-xs text-gray-600">
                  Never hit limits again
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500 mb-1">⚡</div>
                <div className="text-sm font-medium">Priority Processing</div>
                <div className="text-xs text-gray-600">
                  Faster response times
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-500 mb-1">
                  🔧
                </div>
                <div className="text-sm font-medium">Advanced Features</div>
                <div className="text-xs text-gray-600">
                  API access & integrations
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
