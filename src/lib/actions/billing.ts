"use server";

import { redirect } from "next/navigation";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getContext } from "@/lib/workspace";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function ownerContext() {
  const ctx = await getContext();
  if (ctx.role !== "owner") redirect("/billing?error=owner");
  if (!stripeConfigured()) redirect("/billing?error=config");
  return ctx;
}

export async function startCheckout() {
  const { workspace, user } = await ownerContext();
  const stripe = getStripe();
  const admin = createAdminClient();

  const { data: ws } = await admin.from("workspaces").select("stripe_customer_id").eq("id", workspace.id).single();
  let customer = ws?.stripe_customer_id as string | null | undefined;
  if (!customer) {
    const c = await stripe.customers.create({ email: user.email, metadata: { workspace_id: workspace.id } });
    customer = c.id;
    await admin.from("workspaces").update({ stripe_customer_id: customer }).eq("id", workspace.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    client_reference_id: workspace.id,
    subscription_data: { metadata: { workspace_id: workspace.id } },
    success_url: `${appUrl()}/billing?success=1`,
    cancel_url: `${appUrl()}/billing`,
  });
  redirect(session.url!);
}

export async function openPortal() {
  const { workspace } = await ownerContext();
  const admin = createAdminClient();
  const { data: ws } = await admin.from("workspaces").select("stripe_customer_id").eq("id", workspace.id).single();
  if (!ws?.stripe_customer_id) redirect("/billing");

  const session = await getStripe().billingPortal.sessions.create({
    customer: ws.stripe_customer_id,
    return_url: `${appUrl()}/billing`,
  });
  redirect(session.url);
}
