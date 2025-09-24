"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CreditCard,
  Calendar,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  subscription_tier: string | null;
  subscription_status: string | null;
  subscription_id: string | null;
  customer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
}

interface Subscription {
  id: string;
  tier: string;
  billing_cycle: string;
  amount: number;
  currency: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
}

export function BillingManagement() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("User not authenticated");
        return;
      }

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      setProfile(profileData);

      // Get active subscription
      if (profileData.subscription_id) {
        const { data: subData, error: subError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("stripe_subscription_id", profileData.subscription_id)
          .eq("status", "active")
          .single();

        if (!subError && subData) {
          setSubscription(subData);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!profile?.customer_id) {
      setError("No customer ID found");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch("/api/subscription/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: profile.customer_id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create portal session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to open billing portal"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpgrade = async () => {
    setIsUpdating(true);
    try {
      // Redirect to subscription page for upgrade
      window.location.href = "/auth/subscribe";
    } catch (err) {
      setError("Failed to redirect to upgrade page");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "usd") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Current Subscription
          </CardTitle>
          <CardDescription>
            Manage your subscription and billing information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile?.subscription_tier ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold capitalize">
                    {profile.subscription_tier} Plan
                  </h3>
                  <p className="text-sm text-gray-600">
                    {subscription?.billing_cycle === "yearly"
                      ? "Billed yearly"
                      : "Billed monthly"}
                  </p>
                </div>
                <Badge
                  variant={
                    profile.subscription_status === "active"
                      ? "default"
                      : profile.subscription_status === "past_due"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {profile.subscription_status}
                </Badge>
              </div>

              {subscription && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <DollarSign className="mr-2 h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">
                        {formatCurrency(
                          subscription.amount,
                          subscription.currency
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        per{" "}
                        {subscription.billing_cycle === "yearly"
                          ? "year"
                          : "month"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Next billing</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(subscription.current_period_end)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Started</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(subscription.current_period_start)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleManageBilling}
                  disabled={isUpdating}
                  variant="outline"
                >
                  {isUpdating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Manage Billing
                </Button>

                {profile.subscription_tier === "basic" && (
                  <Button onClick={handleUpgrade} disabled={isUpdating}>
                    Upgrade to Plus
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">
                No Active Subscription
              </h3>
              <p className="text-gray-600 mb-4">
                You're currently on the free plan with limited features.
              </p>
              <Button onClick={handleUpgrade} disabled={isUpdating}>
                Subscribe Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View your past invoices and payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            {profile?.subscription_tier ? (
              <p>
                For detailed billing history, please use the "Manage Billing"
                portal above.
              </p>
            ) : (
              <p>No billing history available.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Features</CardTitle>
          <CardDescription>
            Compare what's included in each plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Free</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• 10 requests per month</li>
                <li>• Basic features</li>
                <li>• Email support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Basic</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• 100 requests per month</li>
                <li>• All core features</li>
                <li>• Priority email support</li>
                <li>• Basic analytics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Plus</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Unlimited requests</li>
                <li>• All features</li>
                <li>• Priority support</li>
                <li>• Advanced analytics</li>
                <li>• API access</li>
                <li>• Export capabilities</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
