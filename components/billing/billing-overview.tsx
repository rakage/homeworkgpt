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
import {
  CreditCard,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { UpgradeButton } from "@/components/subscription/upgrade-button";

interface BillingData {
  profile: {
    subscription_tier: string | null;
    subscription_status: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    customer_id: string | null;
  };
  usage: {
    requests_count: number;
    tier: string;
  } | null;
  subscription: {
    amount: number;
    currency: string;
    billing_cycle: string;
    status: string;
  } | null;
}

export function BillingOverview() {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Authentication required");
      }

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(
          "subscription_tier, subscription_status, current_period_start, current_period_end, customer_id"
        )
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw new Error("Failed to fetch profile data");
      }

      // Get current month usage
      const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
      const { data: usage } = await supabase
        .from("user_usage")
        .select("requests_count, tier")
        .eq("user_id", user.id)
        .eq("month", currentMonth)
        .single();

      // Get current subscription
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("amount, currency, billing_cycle, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);

      setBillingData({
        profile,
        usage,
        subscription: subscriptions?.[0] || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "past_due":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "canceled":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getUsagePercentage = () => {
    if (!billingData?.usage) return 0;

    const limit =
      billingData.profile.subscription_tier === "plus"
        ? -1
        : billingData.profile.subscription_tier === "basic"
        ? 100
        : 10;

    if (limit === -1) return 0; // Unlimited

    return Math.min((billingData.usage.requests_count / limit) * 100, 100);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-pulse text-gray-500">
            Loading billing information...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!billingData) return null;

  const { profile, usage, subscription } = billingData;
  const hasActiveSubscription = profile.subscription_status === "active";
  const usagePercentage = getUsagePercentage();

  return (
    <div className="space-y-6">
      {/* Plan Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(profile.subscription_status)}
            Plan Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">
                {profile.subscription_tier?.charAt(0).toUpperCase() +
                  profile.subscription_tier?.slice(1) || "Free"}{" "}
                Plan
              </h3>
              <p className="text-sm text-gray-600">
                {hasActiveSubscription
                  ? "Active subscription"
                  : "No active subscription"}
              </p>
            </div>
            <Badge
              variant={hasActiveSubscription ? "default" : "secondary"}
              className="text-xs"
            >
              {profile.subscription_status?.toUpperCase() || "FREE"}
            </Badge>
          </div>

          {subscription && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="font-semibold">
                  {formatCurrency(subscription.amount, subscription.currency)}
                  <span className="text-sm text-gray-600">
                    /
                    {subscription.billing_cycle === "yearly" ? "year" : "month"}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Next Billing</p>
                <p className="font-semibold">
                  {profile.current_period_end
                    ? new Date(profile.current_period_end).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Requests Made</span>
              <span className="font-semibold">
                {usage?.requests_count || 0}
                {profile.subscription_tier !== "plus" && (
                  <span className="text-gray-600">
                    {" / "}
                    {profile.subscription_tier === "basic" ? "100" : "10"}
                  </span>
                )}
              </span>
            </div>

            {profile.subscription_tier !== "plus" && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    usagePercentage > 80
                      ? "bg-red-500"
                      : usagePercentage > 60
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
            )}

            {usagePercentage > 80 && profile.subscription_tier !== "plus" && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  You've used {usagePercentage.toFixed(0)}% of your monthly
                  limit
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!hasActiveSubscription ? (
            <UpgradeButton
              currentTier={profile.subscription_tier}
              className="w-full"
            >
              Start Subscription
            </UpgradeButton>
          ) : (
            <>
              <Button className="w-full" asChild>
                <a
                  href="/api/subscription/create-portal-session"
                  target="_blank"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Billing
                </a>
              </Button>
              <UpgradeButton
                currentTier={profile.subscription_tier}
                variant="outline"
                className="w-full"
              >
                Change Plan
              </UpgradeButton>
            </>
          )}

          <Button variant="outline" className="w-full" asChild>
            <a href="/billing">
              <Calendar className="mr-2 h-4 w-4" />
              View Billing History
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
