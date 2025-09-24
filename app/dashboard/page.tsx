import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DashboardUpgradeButton,
  LimitUpgradeButton,
} from "@/components/subscription/upgrade-button";
import { CalendarDays, CreditCard, Settings, Users } from "lucide-react";

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get user profile and subscription details
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get current month usage
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
  const { data: usage } = await supabase
    .from("user_usage")
    .select("*")
    .eq("user_id", user.id)
    .eq("month", currentMonth)
    .single();

  // Get subscription limits
  const { data: limits } = await supabase
    .from("subscription_limits")
    .select("*")
    .eq("tier", profile?.subscription_tier || "free")
    .single();

  const usageCount = usage?.requests_count || 0;
  const usageLimit = limits?.monthly_requests || 10;
  const usagePercentage =
    usageLimit === -1 ? 0 : (usageCount / usageLimit) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">
                Welcome back, {profile?.full_name || user.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge
                variant={
                  profile?.subscription_status === "active"
                    ? "default"
                    : "secondary"
                }
                className="px-3 py-1"
              >
                {profile?.subscription_tier?.toUpperCase() || "FREE"} Plan
              </Badge>
              <DashboardUpgradeButton
                currentTier={profile?.subscription_tier}
              />
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Usage Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Usage
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usageCount}
                {usageLimit !== -1 && ` / ${usageLimit}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {usageLimit === -1
                  ? "Unlimited requests"
                  : "Requests this month"}
              </p>
              {usageLimit !== -1 && (
                <Progress value={usagePercentage} className="mt-2" />
              )}
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Subscription
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profile?.subscription_tier?.charAt(0).toUpperCase() +
                  profile?.subscription_tier?.slice(1) || "Free"}
              </div>
              <p className="text-xs text-muted-foreground">
                Status: {profile?.subscription_status || "inactive"}
              </p>
            </CardContent>
          </Card>

          {/* Next Billing */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Next Billing
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profile?.current_period_end
                  ? new Date(profile.current_period_end).toLocaleDateString()
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {profile?.current_period_end
                  ? "Renewal date"
                  : "No active subscription"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your recent homework help requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  No recent activity. Start by submitting a homework question!
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" size="sm">
                  New Homework Request
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  View All Requests
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  Account Settings
                </Button>
                <Button variant="outline" className="w-full" size="sm" asChild>
                  <a href="/billing">Billing & Subscription</a>
                </Button>
              </CardContent>
            </Card>

            {/* Usage Warning */}
            {usageLimit !== -1 && usagePercentage > 80 && (
              <LimitUpgradeButton
                currentTier={profile?.subscription_tier}
                message={`You've used ${usagePercentage.toFixed(
                  0
                )}% of your monthly limit. Upgrade to get unlimited access.`}
              />
            )}

            {/* Upgrade Prompt for Free Users */}
            {(!profile?.subscription_tier ||
              profile?.subscription_tier === "free") && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-800">
                    Unlock Premium Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-700 mb-3">
                    Get unlimited requests, priority support, and advanced
                    features with our premium plans.
                  </p>
                  <DashboardUpgradeButton
                    currentTier={profile?.subscription_tier}
                    className="w-full"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
