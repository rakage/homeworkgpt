import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

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

    // Get user profile to get customer ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.customer_id) {
      return NextResponse.json(
        { error: "No billing information found" },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const startingAfter = searchParams.get("starting_after");

    // Fetch invoices from Stripe
    const invoicesParams: Stripe.InvoiceListParams = {
      customer: profile.customer_id,
      limit: Math.min(limit, 100), // Cap at 100
      expand: ["data.payment_intent"],
    };

    if (startingAfter) {
      invoicesParams.starting_after = startingAfter;
    }

    const invoices = await stripe.invoices.list(invoicesParams);

    // Format invoice data for frontend
    const formattedInvoices = invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amount_paid: invoice.amount_paid,
      amount_due: invoice.amount_due,
      currency: invoice.currency,
      created: invoice.created,
      due_date: invoice.due_date,
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_pdf: invoice.invoice_pdf,
      period_start: invoice.period_start,
      period_end: invoice.period_end,
      subscription_id: invoice.subscription,
      payment_intent: invoice.payment_intent,
      lines: invoice.lines.data.map((line) => ({
        id: line.id,
        description: line.description,
        amount: line.amount,
        currency: line.currency,
        period_start: line.period?.start,
        period_end: line.period?.end,
        plan: line.plan
          ? {
              id: line.plan.id,
              nickname: line.plan.nickname,
              interval: line.plan.interval,
              amount: line.plan.amount,
            }
          : null,
      })),
    }));

    return NextResponse.json({
      invoices: formattedInvoices,
      has_more: invoices.has_more,
    });
  } catch (error) {
    console.error("Fetch invoices error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
