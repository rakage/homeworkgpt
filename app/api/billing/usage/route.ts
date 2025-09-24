import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get("months") || "6");

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Format dates for database query
    const startMonth = startDate.toISOString().slice(0, 7) + "-01";
    const endMonth = endDate.toISOString().slice(0, 7) + "-01";

    // Get usage history
    const { data: usageHistory, error: usageError } = await supabase
      .from("user_usage")
      .select("month, requests_count, tier")
      .eq("user_id", user.id)
      .gte("month", startMonth)
      .lte("month", endMonth)
      .order("month", { ascending: true });

    if (usageError) {
      console.error("Usage fetch error:", usageError);
      return NextResponse.json(
        { error: "Failed to fetch usage data" },
        { status: 500 }
      );
    }

    // Get user profile for current tier info
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    // Fill in missing months with zero usage
    const filledUsage = [];
    const currentDate = new Date(startMonth);
    const endDateObj = new Date(endMonth);

    while (currentDate <= endDateObj) {
      const monthKey = currentDate.toISOString().slice(0, 7) + "-01";
      const existingData = usageHistory?.find(
        (item) => item.month === monthKey
      );

      filledUsage.push({
        month: monthKey,
        requests_count: existingData?.requests_count || 0,
        tier: existingData?.tier || profile?.subscription_tier || "free",
        formatted_month: currentDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        }),
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Calculate summary statistics
    const totalRequests = filledUsage.reduce(
      (sum, item) => sum + item.requests_count,
      0
    );
    const averageMonthly = totalRequests / filledUsage.length;
    const currentMonth =
      filledUsage[filledUsage.length - 1]?.requests_count || 0;

    // Get tier limits for context
    const tierLimits = {
      free: 10,
      basic: 100,
      plus: -1, // unlimited
    };

    const currentTier = profile?.subscription_tier || "free";
    const currentLimit = tierLimits[currentTier as keyof typeof tierLimits];

    return NextResponse.json({
      usage_history: filledUsage,
      summary: {
        total_requests: totalRequests,
        average_monthly: Math.round(averageMonthly),
        current_month: currentMonth,
        current_tier: currentTier,
        current_limit: currentLimit,
        usage_percentage:
          currentLimit === -1
            ? 0
            : Math.round((currentMonth / currentLimit) * 100),
      },
    });
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
