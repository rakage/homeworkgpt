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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoice_id");

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
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

    // Fetch the specific invoice
    const invoice = await stripe.invoices.retrieve(invoiceId);

    // Verify the invoice belongs to this customer
    if (invoice.customer !== profile.customer_id) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Return the PDF URL for download
    if (invoice.invoice_pdf) {
      return NextResponse.json({
        download_url: invoice.invoice_pdf,
        invoice_number: invoice.number,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        date: invoice.created,
      });
    } else {
      return NextResponse.json(
        { error: "PDF not available for this invoice" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Download invoice error:", error);
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to download invoice" },
      { status: 500 }
    );
  }
}
