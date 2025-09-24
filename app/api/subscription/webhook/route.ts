import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        const userId = subscription.metadata.user_id;
        const tier = subscription.metadata.tier;
        const billingCycle = subscription.metadata.billing_cycle;

        if (!userId || !tier || !billingCycle) {
          console.error("Missing metadata in subscription:", subscription.id);
          break;
        }

        // Get price information
        const price = subscription.items.data[0]?.price;
        const amount = price?.unit_amount || 0;

        // Get period dates from subscription items
        let periodStart: string | null = null;
        let periodEnd: string | null = null;

        const subscriptionWithDates = subscription as any; // Cast to access period dates

        if (
          subscriptionWithDates.current_period_start &&
          subscriptionWithDates.current_period_end
        ) {
          // Use subscription level dates if available
          periodStart = new Date(
            subscriptionWithDates.current_period_start * 1000
          ).toISOString();
          periodEnd = new Date(
            subscriptionWithDates.current_period_end * 1000
          ).toISOString();
        } else if (subscription.items.data[0]) {
          // Fallback to subscription item dates
          const item = subscription.items.data[0];
          if (item.current_period_start && item.current_period_end) {
            periodStart = new Date(
              item.current_period_start * 1000
            ).toISOString();
            periodEnd = new Date(item.current_period_end * 1000).toISOString();
          }
        }

        console.log("Subscription webhook data:", {
          userId,
          tier,
          billingCycle,
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          periodStart,
          periodEnd,
          subscription_level: {
            raw_start: subscriptionWithDates.current_period_start,
            raw_end: subscriptionWithDates.current_period_end,
          },
          item_level: subscription.items.data[0]
            ? {
                raw_start: subscription.items.data[0].current_period_start,
                raw_end: subscription.items.data[0].current_period_end,
              }
            : null,
        });

        // Prepare profile update data
        const profileUpdateData: any = {
          subscription_tier: tier,
          subscription_status: subscription.status,
          subscription_id: subscription.id,
          customer_id: subscription.customer as string,
        };

        // Only add period dates if they exist (don't overwrite with null)
        if (periodStart && periodEnd) {
          profileUpdateData.current_period_start = periodStart;
          profileUpdateData.current_period_end = periodEnd;
        }

        // Update user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .update(profileUpdateData)
          .eq("id", userId)
          .select();

        if (profileError) {
          console.error("Profile update error:", profileError);
        } else {
          console.log("Profile updated successfully:", profileData);
        }

        // Prepare subscription record data
        const subscriptionRecordData: any = {
          user_id: userId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          status: subscription.status,
          tier,
          billing_cycle: billingCycle,
          amount,
          currency: price?.currency || "usd",
        };

        // Only add period dates if they exist
        if (periodStart && periodEnd) {
          subscriptionRecordData.current_period_start = periodStart;
          subscriptionRecordData.current_period_end = periodEnd;
        }

        // Insert/update subscription record
        const { data: subscriptionData, error: subscriptionError } =
          await supabase.from("subscriptions").upsert(subscriptionRecordData, {
            onConflict: "stripe_subscription_id",
          });

        if (subscriptionError) {
          console.error("Subscription record error:", subscriptionError);
        } else {
          console.log("Subscription record updated:", subscriptionData);
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const userId = subscription.metadata.user_id;

        if (!userId) {
          console.error(
            "Missing user_id in subscription metadata:",
            subscription.id
          );
          break;
        }

        // Safely convert timestamp
        const subscriptionWithDates = subscription as any;
        const periodEnd = subscriptionWithDates.current_period_end
          ? new Date(
              subscriptionWithDates.current_period_end * 1000
            ).toISOString()
          : null;

        // Update user profile
        await supabase
          .from("profiles")
          .update({
            subscription_tier: null,
            subscription_status: "canceled",
            current_period_end: periodEnd,
          })
          .eq("id", userId);

        // Update subscription record
        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string;
        };

        if (invoice.subscription) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          const userId = subscription.metadata.user_id;

          if (userId) {
            console.log("Payment succeeded, updating subscription status:", {
              subscriptionId: subscription.id,
              userId,
              status: subscription.status,
            });

            // Update subscription status to active if payment succeeded
            const subscriptionWithDates = subscription as any;

            const profileUpdateData: any = {
              subscription_status: subscription.status, // This should be 'active' after payment
            };

            // Update period dates if available
            if (
              subscriptionWithDates.current_period_start &&
              subscriptionWithDates.current_period_end
            ) {
              profileUpdateData.current_period_start = new Date(
                subscriptionWithDates.current_period_start * 1000
              ).toISOString();
              profileUpdateData.current_period_end = new Date(
                subscriptionWithDates.current_period_end * 1000
              ).toISOString();
            }

            // Update user profile
            const { error: profileError } = await supabase
              .from("profiles")
              .update(profileUpdateData)
              .eq("id", userId);

            if (profileError) {
              console.error(
                "Profile update error on payment success:",
                profileError
              );
            }

            // Update subscription record
            const { error: subscriptionError } = await supabase
              .from("subscriptions")
              .update({
                status: subscription.status,
                updated_at: new Date().toISOString(),
              })
              .eq("stripe_subscription_id", subscription.id);

            if (subscriptionError) {
              console.error(
                "Subscription update error on payment success:",
                subscriptionError
              );
            }

            // Reset usage for the new period
            const currentMonth = new Date().toISOString().slice(0, 7) + "-01";

            await supabase.from("user_usage").upsert(
              {
                user_id: userId,
                month: currentMonth,
                requests_count: 0,
                tier: subscription.metadata.tier || "basic",
              },
              {
                onConflict: "user_id,month",
              }
            );
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string;
        };

        if (invoice.subscription) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          const userId = subscription.metadata.user_id;

          if (userId) {
            console.log("Invoice paid, ensuring subscription is active:", {
              invoiceId: invoice.id,
              subscriptionId: subscription.id,
              userId,
              subscriptionStatus: subscription.status,
            });

            // Update subscription status to active
            const { error: profileError } = await supabase
              .from("profiles")
              .update({
                subscription_status: subscription.status,
              })
              .eq("id", userId);

            if (profileError) {
              console.error(
                "Profile update error on invoice paid:",
                profileError
              );
            }

            // Update subscription record
            const { error: subscriptionError } = await supabase
              .from("subscriptions")
              .update({
                status: subscription.status,
                updated_at: new Date().toISOString(),
              })
              .eq("stripe_subscription_id", subscription.id);

            if (subscriptionError) {
              console.error(
                "Subscription update error on invoice paid:",
                subscriptionError
              );
            }
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string;
        };

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          const userId = subscription.metadata.user_id;

          if (userId) {
            // Update subscription status
            await supabase
              .from("profiles")
              .update({
                subscription_status: "past_due",
              })
              .eq("id", userId);
          }
        }
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // This event is handled when the subscription is created/updated
        // so we just log it for now
        console.log(`Checkout session completed: ${session.id}`);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // This event is handled when the subscription is created/updated
        // so we just log it for now
        console.log(`Payment intent succeeded: ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
