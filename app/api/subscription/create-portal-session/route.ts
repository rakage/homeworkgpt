import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

async function createPortalSession(request: NextRequest) {
  const supabase = createServerSupabaseClient();

  // Verify user is authenticated
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

  // Get user's customer ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.customer_id) {
    return NextResponse.json(
      {
        error: "No billing account found. Please create a subscription first.",
      },
      { status: 404 }
    );
  }

  // Get return URL from query params or default to billing page
  const { searchParams } = new URL(request.url);
  const returnUrl =
    searchParams.get("return_url") ||
    `${process.env.NEXT_PUBLIC_SITE_URL}/billing`;

  // Create Stripe portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.customer_id,
    return_url: returnUrl,
  });

  return NextResponse.json({ url: session.url });
}

export async function GET(request: NextRequest) {
  try {
    const result = await createPortalSession(request);

    // For GET requests, redirect directly to the portal
    if (result.status === 200) {
      const data = await result.json();
      return NextResponse.redirect(data.url);
    }

    return result;
  } catch (error) {
    console.error("Portal session creation error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return await createPortalSession(request);
  } catch (error) {
    console.error("Portal session creation error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
