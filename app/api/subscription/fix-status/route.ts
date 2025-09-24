import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(request: NextRequest) {
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

    // Get user's profile with subscription info
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("subscription_id, customer_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.subscription_id) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Get the latest subscription status from Stripe
    const subscription = await stripe.subscriptions.retrieve(
      profile.subscription_id
    );

    console.log("Fixing subscription status:", {
      subscriptionId: subscription.id,
      currentStatus: subscription.status,
      userId: user.id,
    });

    // Get period dates
    const subscriptionWithDates = subscription as any;
    let periodStart: string | null = null;
    let periodEnd: string | null = null;

    if (
      subscriptionWithDates.current_period_start &&
      subscriptionWithDates.current_period_end
    ) {
      periodStart = new Date(
        subscriptionWithDates.current_period_start * 1000
      ).toISOString();
      periodEnd = new Date(
        subscriptionWithDates.current_period_end * 1000
      ).toISOString();
    }

    // Update profile with correct status
    const profileUpdateData: any = {
      subscription_status: subscription.status,
      subscription_tier: subscription.metadata.tier,
    };

    if (periodStart && periodEnd) {
      profileUpdateData.current_period_start = periodStart;
      profileUpdateData.current_period_end = periodEnd;
    }

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update(profileUpdateData)
      .eq("id", user.id);

    if (profileUpdateError) {
      console.error("Profile update error:", profileUpdateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    // Update subscription record
    const price = subscription.items.data[0]?.price;
    const subscriptionRecordData: any = {
      status: subscription.status,
      tier: subscription.metadata.tier,
      billing_cycle: subscription.metadata.billing_cycle,
      amount: price?.unit_amount || 0,
      currency: price?.currency || "usd",
      updated_at: new Date().toISOString(),
    };

    if (periodStart && periodEnd) {
      subscriptionRecordData.current_period_start = periodStart;
      subscriptionRecordData.current_period_end = periodEnd;
    }

    const { error: subscriptionUpdateError } = await supabase
      .from("subscriptions")
      .update(subscriptionRecordData)
      .eq("stripe_subscription_id", subscription.id);

    if (subscriptionUpdateError) {
      console.error("Subscription update error:", subscriptionUpdateError);
      return NextResponse.json(
        { error: "Failed to update subscription record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription_status: subscription.status,
      message: `Subscription status updated to: ${subscription.status}`,
    });
  } catch (error) {
    console.error("Fix subscription status error:", error);
    return NextResponse.json(
      { error: "Failed to fix subscription status" },
      { status: 500 }
    );
  }
}
