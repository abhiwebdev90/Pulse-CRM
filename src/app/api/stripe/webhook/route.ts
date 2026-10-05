import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function setPlan(workspaceId: string | null | undefined, plan: "free" | "pro", subscriptionId: string | null) {
  if (!workspaceId) return;
  await createAdminClient()
    .from("workspaces")
    .update({ plan, stripe_subscription_id: subscriptionId })
    .eq("id", workspaceId);
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return new Response("Webhook not configured", { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      await setPlan(s.client_reference_id, "pro", typeof s.subscription === "string" ? s.subscription : null);
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const active = event.type === "customer.subscription.updated" && ["active", "trialing"].includes(sub.status);
      await setPlan(sub.metadata?.workspace_id, active ? "pro" : "free", active ? sub.id : null);
      break;
    }
  }
  return new Response("ok");
}
