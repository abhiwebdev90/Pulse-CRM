import { openPortal, startCheckout } from "@/lib/actions/billing";
import { stripeConfigured } from "@/lib/stripe";
import { getContext } from "@/lib/workspace";

const messages: Record<string, string> = {
  owner: "Only the workspace owner can manage billing.",
  config: "Stripe is not configured on this deployment (set the STRIPE_* env vars).",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const { supabase, workspace, role } = await getContext();
  const { count } = await supabase.from("clients").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id);
  const pro = workspace.plan === "pro";

  const plans = [
    { name: "Free", price: "$0", features: ["Up to 25 clients", "Pipeline + dashboard", "Team invites"], current: !pro },
    { name: "Pro", price: "$12 / month", features: ["Unlimited clients", "Everything in Free", "Priority support"], current: pro },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Billing</h1>
      {success && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Payment received. Your plan updates in a few seconds.</p>}
      {error && messages[error] && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{messages[error]}</p>}

      <p className="text-sm text-slate-500">
        Usage: {count ?? 0}
        {pro ? " clients" : " / 25 clients"}. Test mode: use card 4242 4242 4242 4242.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((p) => (
          <div key={p.name} className={`rounded-xl border p-5 ${p.current ? "border-brand-500" : "border-slate-200 dark:border-slate-800"}`}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{p.name}</h2>
              {p.current && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700">Current</span>}
            </div>
            <div className="mt-1 text-xl font-semibold">{p.price}</div>
            <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-400">
              {p.features.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {role === "owner" && stripeConfigured() && (
        <form action={pro ? openPortal : startCheckout}>
          <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500">
            {pro ? "Manage subscription" : "Upgrade to Pro"}
          </button>
        </form>
      )}
    </div>
  );
}
