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
import {
  CreditCard,
  Download,
  Calendar,
  DollarSign,
  FileText,
  Settings,
} from "lucide-react";
import { BillingManagement } from "@/components/subscription/billing-management";
import { UpgradeButton } from "@/components/subscription/upgrade-button";
import { InvoiceList } from "@/components/billing/invoice-list";
import { FixStatusButton } from "@/components/subscription/fix-status-button";

export default async function BillingPage() {
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
    .select("*, subscription_id")
    .eq("id", user.id)
    .single();

  // Get subscription records
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Get current month usage
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
  const { data: usage } = await supabase
    .from("user_usage")
    .select("*")
    .eq("user_id", user.id)
    .eq("month", currentMonth)
    .single();

  const currentSubscription = subscriptions?.[0];
  const hasActiveSubscription = profile?.subscription_status === "active";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Billing & Invoices
              </h1>
              <p className="text-gray-600">
                Manage your subscription and view billing history
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <a href="/dashboard">← Back to Dashboard</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Current Plan & Usage */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {profile?.subscription_tier?.charAt(0).toUpperCase() +
                        profile?.subscription_tier?.slice(1) || "Free"}{" "}
                      Plan
                    </h3>
                    <p className="text-gray-600">
                      {hasActiveSubscription
                        ? `Billing cycle: ${
                            currentSubscription?.billing_cycle || "monthly"
                          }`
                        : "No active subscription"}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={hasActiveSubscription ? "default" : "secondary"}
                    >
                      {profile?.subscription_status?.toUpperCase() || "FREE"}
                    </Badge>
                    {currentSubscription?.amount && (
                      <p className="text-lg font-bold mt-1">
                        ${(currentSubscription.amount / 100).toFixed(2)}
                        <span className="text-sm text-gray-600">
                          /
                          {currentSubscription.billing_cycle === "yearly"
                            ? "year"
                            : "month"}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {hasActiveSubscription && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Current Period</p>
                      <p className="font-medium">
                        {profile?.current_period_start
                          ? new Date(
                              profile.current_period_start
                            ).toLocaleDateString()
                          : "N/A"}
                        {" - "}
                        {profile?.current_period_end
                          ? new Date(
                              profile.current_period_end
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Next Billing</p>
                      <p className="font-medium">
                        {profile?.current_period_end
                          ? new Date(
                              profile.current_period_end
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                )}

                {!hasActiveSubscription && (
                  <div className="pt-4 border-t space-y-3">
                    {profile?.subscription_status === "incomplete" &&
                      profile?.subscription_id && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800 mb-2">
                            Your subscription payment is pending. Click below to
                            sync the latest status.
                          </p>
                          <FixStatusButton
                            currentStatus={profile?.subscription_status}
                          />
                        </div>
                      )}
                    <UpgradeButton
                      currentTier={profile?.subscription_tier}
                      className="w-full"
                    >
                      Upgrade to Premium
                    </UpgradeButton>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Usage This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {usage?.requests_count || 0}
                    </p>
                    <p className="text-sm text-gray-600">Requests Made</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {profile?.subscription_tier === "plus"
                        ? "∞"
                        : profile?.subscription_tier === "basic"
                        ? "100"
                        : "10"}
                    </p>
                    <p className="text-sm text-gray-600">Monthly Limit</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      $
                      {currentSubscription?.amount
                        ? (currentSubscription.amount / 100).toFixed(2)
                        : "0.00"}
                    </p>
                    <p className="text-sm text-gray-600">Current Bill</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Invoices
                </CardTitle>
                <CardDescription>
                  View and download your billing history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InvoiceList limit={5} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Billing Management */}
          <div className="space-y-6">
            {/* Billing Management */}
            <BillingManagement />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {hasActiveSubscription ? (
                  <>
                    <Button variant="outline" className="w-full" asChild>
                      <a
                        href="/api/subscription/create-portal-session"
                        target="_blank"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Manage Payment Methods
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Download Latest Invoice
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Calendar className="mr-2 h-4 w-4" />
                      View Usage History
                    </Button>
                  </>
                ) : (
                  <>
                    <UpgradeButton
                      currentTier={profile?.subscription_tier}
                      className="w-full"
                    >
                      Start Subscription
                    </UpgradeButton>
                    <Button variant="outline" className="w-full" disabled>
                      <FileText className="mr-2 h-4 w-4" />
                      No invoices available
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Help & Support */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Have questions about your billing or need to make changes to
                  your plan?
                </p>
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
                <Button variant="ghost" className="w-full">
                  View Documentation
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
