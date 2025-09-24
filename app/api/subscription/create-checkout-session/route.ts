import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

// Price mapping for different tiers and billing cycles
const PRICE_MAP = {
  basic: {
    monthly: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID || "price_basic_monthly",
    yearly: process.env.STRIPE_BASIC_YEARLY_PRICE_ID || "price_basic_yearly",
  },
  plus: {
    monthly: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID || "price_plus_monthly",
    yearly: process.env.STRIPE_PLUS_YEARLY_PRICE_ID || "price_plus_yearly",
  },
};

export async function POST(request: NextRequest) {
  try {
    const { priceId, billing_cycle, tier } = await request.json();

    // Support both old format (priceId) and new format (tier + billing_cycle)
    let finalPriceId = priceId;
    let finalTier = tier;
    let finalBillingCycle = billing_cycle;

    if (!finalPriceId && tier && billing_cycle) {
      // New format: derive priceId from tier and billing_cycle
      if (!PRICE_MAP[tier as keyof typeof PRICE_MAP]) {
        return NextResponse.json(
          { error: "Invalid tier specified" },
          { status: 400 }
        );
      }

      finalPriceId =
        PRICE_MAP[tier as keyof typeof PRICE_MAP][
          billing_cycle as "monthly" | "yearly"
        ];
      finalTier = tier;
      finalBillingCycle = billing_cycle;
    } else if (finalPriceId && !tier) {
      // Old format: derive tier from priceId (for backwards compatibility)
      const tierEntry = Object.entries(PRICE_MAP).find(([, prices]) =>
        Object.values(prices).includes(finalPriceId)
      );

      if (tierEntry) {
        finalTier = tierEntry[0];
        finalBillingCycle = Object.entries(tierEntry[1]).find(
          ([, id]) => id === finalPriceId
        )?.[0];
      }
    }

    if (!finalPriceId || !finalTier || !finalBillingCycle) {
      return NextResponse.json(
        {
          error:
            "Missing or invalid parameters: tier and billing_cycle are required",
        },
        { status: 400 }
      );
    }

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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Create or get Stripe customer
    let customerId = profile.customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile.full_name,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      customerId = customer.id;

      // Update profile with customer ID
      await supabase
        .from("profiles")
        .update({ customer_id: customerId })
        .eq("id", user.id);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&upgrade=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?upgrade=cancelled`,
      metadata: {
        user_id: user.id,
        tier: finalTier,
        billing_cycle: finalBillingCycle,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          tier: finalTier,
          billing_cycle: finalBillingCycle,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: "required",
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      tier: finalTier,
      billing_cycle: finalBillingCycle,
    });
  } catch (error) {
    console.error("Checkout session creation error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
