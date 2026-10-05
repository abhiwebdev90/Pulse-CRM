import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  Clock,
  Download,
  KanbanSquare,
  Moon,
  Play,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Reveal } from "@/components/landing/reveal";
import { ScreenFrame } from "@/components/landing/screen-frame";
import { ProductTour } from "@/components/landing/product-tour";
import { LandingNav } from "@/components/landing/landing-nav";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "PulseCRM: a CRM for freelancers and agencies",
  description: "Track leads, run your pipeline and close deals with your whole team in one secure workspace.",
};

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-medium text-white shadow-sm hover:bg-brand-500";
const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900";
const section = "scroll-mt-20 px-6 py-20";
const eyebrow = "text-sm font-semibold uppercase tracking-wide text-brand-600";
const h2 = "mt-2 text-3xl font-bold tracking-tight sm:text-4xl";

const stack = ["Next.js", "Supabase", "Stripe", "Tailwind CSS", "TypeScript"];

const features = [
  { icon: KanbanSquare, title: "Drag-and-drop pipeline", text: "Move deals across stages, reorder within a stage and see the value of every column.", wide: true },
  { icon: BarChart3, title: "A dashboard that answers questions", text: "Revenue, win rate and trends compared with the previous period, plus who needs a follow-up.", wide: true },
  { icon: UsersRound, title: "Teams and roles", text: "Invite teammates as admins or members. Owners control access." },
  { icon: ShieldCheck, title: "Private by design", text: "Every workspace is isolated at the database level, not just hidden in the UI." },
  { icon: Search, title: "Instant search", text: "Press Ctrl K to jump to any client or page." },
  { icon: Download, title: "Your data, portable", text: "Export any filtered client list to CSV in one click." },
  { icon: Moon, title: "Light, dark, your colour", text: "Dark mode and a per-workspace accent colour out of the box." },
];

const steps = [
  ["Create a workspace", "Sign up in seconds. Your workspace is ready, with nothing to configure."],
  ["Add your clients", "Add leads one by one, then track every call, email and meeting on their timeline."],
  ["Close more deals", "Work the pipeline, follow up on stale deals and watch your win rate climb."],
];

const useCases = [
  ["Freelancers", "Stop losing leads in your inbox. Keep every conversation and next step in one place."],
  ["Agencies", "Give the whole team one shared view of the pipeline and who owns each deal."],
  ["Small sales teams", "Track targets, spot stalled deals early and keep forecasts honest."],
];

const plans = [
  {
    name: "Free",
    price: "$0",
    note: "For getting started",
    perks: ["Up to 25 clients", "Pipeline, dashboard and activity log", "Team invites and roles", "CSV export"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Pro",
    price: "$12",
    note: "per month, per workspace",
    perks: ["Unlimited clients", "Everything in Free", "Priority support", "Workspace accent colours"],
    cta: "Go Pro",
    featured: true,
  },
];

const faqs = [
  ["Is my data separate from other workspaces?", "Yes. Row-level security in the database restricts every query to workspaces you belong to, so other teams' data is never returned to you."],
  ["Can I invite my team?", "Yes. Owners and admins can invite teammates by email link and choose whether they join as an admin or a member."],
  ["What happens when I reach 25 clients on Free?", "You can keep using everything you have. To add more clients, upgrade to Pro for unlimited."],
  ["Can I export my data?", "Yes. Export any filtered clients list to CSV from the Clients page."],
  ["Is this a real product?", "PulseCRM is a demo project that showcases a complete SaaS build. Use the demo account to explore it."],
];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const signedIn = !!user;

  return (
    <div>
      <LandingNav signedIn={signedIn} />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pb-8 pt-16 text-center sm:pt-24">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-72 max-w-3xl rounded-full bg-brand-200/50 blur-3xl dark:bg-brand-900/30" />
          <div className="relative mx-auto max-w-3xl">
            <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-900 dark:bg-brand-950 dark:text-brand-300">
              Free to start · No credit card
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
              The CRM freelancers and agencies <span className="text-brand-600">actually enjoy</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-400">
              Track leads, log conversations and close deals, with your whole team working from one secure workspace.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {signedIn ? (
                <Link href="/dashboard" className={btnPrimary}>Open dashboard <ArrowRight size={16} /></Link>
              ) : (
                <>
                  <Link href="/signup" className={btnPrimary}>Start free <ArrowRight size={16} /></Link>
                  <Link href="/login" className={btnGhost}>
                    <Play size={14} className="fill-current" /> Try the live demo
                  </Link>
                </>
              )}
            </div>
            {!signedIn && (
              <p className="mt-3 text-sm text-slate-500">
                Free plan, no credit card. The demo needs no signup: tap &ldquo;Try the demo&rdquo; on the next screen.
              </p>
            )}
          </div>
          <div className="relative mx-auto mt-14 max-w-4xl">
            {/* Floating highlights; decorative, hidden on small screens and for reduced motion. */}
            <div aria-hidden className="float-slow absolute -left-6 top-10 z-10 hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-sm shadow-xl lg:flex dark:border-slate-700 dark:bg-slate-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950">
                <Check size={15} />
              </span>
              <span>
                <span className="block font-medium">Deal won</span>
                <span className="block text-xs text-slate-500">$7,400 · Acme Studio</span>
              </span>
            </div>
            <div aria-hidden className="float-slower absolute -right-6 bottom-16 z-10 hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-sm shadow-xl lg:flex dark:border-slate-700 dark:bg-slate-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950">
                <Clock size={15} />
              </span>
              <span>
                <span className="block font-medium">3 follow-ups due</span>
                <span className="block text-xs text-slate-500">No contact in 14+ days</span>
              </span>
            </div>
            <ScreenFrame name="dashboard" alt="PulseCRM dashboard with revenue stats and charts" priority />
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-y border-slate-200 px-6 py-8 dark:border-slate-800">
          <p className="text-center text-xs font-medium uppercase tracking-wide text-slate-500">Built with modern, proven tools</p>
          <ul className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-medium text-slate-500">
            {stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>

        {/* Features */}
        <section id="features" className={section}>
          <Reveal className="mx-auto max-w-6xl">
            <p className={eyebrow}>Features</p>
            <h2 className={h2}>Everything you need to run your pipeline</h2>
            <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
              The essentials of a CRM without the bloat, designed to be fast to learn and pleasant to use every day.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, text, wide }) => (
                <div
                  key={title}
                  className={`rounded-2xl border border-slate-200 p-6 transition duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 ${wide ? "lg:col-span-2" : ""}`}
                >
                  <span className="inline-flex rounded-lg bg-brand-50 p-2.5 text-brand-600 dark:bg-brand-950">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* How it works */}
        <section id="how" className={`${section} bg-slate-50 dark:bg-slate-900/40`}>
          <Reveal className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className={eyebrow}>How it works</p>
              <h2 className={h2}>Up and running in three steps</h2>
            </div>
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map(([title, text], i) => (
                <li key={title} className="text-center md:text-left">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 font-semibold text-white">{i + 1}</span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{text}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>

        {/* Product tour */}
        <section id="tour" className={section}>
          <Reveal className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <p className={eyebrow}>Product tour</p>
              <h2 className={h2}>See it in action</h2>
            </div>
            <ProductTour />
          </Reveal>
        </section>

        {/* Use cases */}
        <section className={`${section} bg-slate-50 dark:bg-slate-900/40`}>
          <Reveal className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className={eyebrow}>Who it&apos;s for</p>
              <h2 className={h2}>Made for small, fast-moving teams</h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {useCases.map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Pricing */}
        <section id="pricing" className={section}>
          <Reveal className="mx-auto max-w-4xl">
            <div className="text-center">
              <p className={eyebrow}>Pricing</p>
              <h2 className={h2}>Simple, honest pricing</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400">Start free. Upgrade when you outgrow it.</p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {plans.map((p) => (
                <div
                  key={p.name}
                  className={`flex flex-col rounded-2xl border p-8 transition duration-200 hover:-translate-y-1 ${p.featured ? "border-brand-500 shadow-lg shadow-brand-600/10" : "border-slate-200 dark:border-slate-800"}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{p.name}</h3>
                    {p.featured && <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">Most popular</span>}
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{p.price}</span>
                  </div>
                  <p className="text-sm text-slate-500">{p.note}</p>
                  <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                    {p.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2">
                        <Check size={16} className="mt-0.5 shrink-0 text-brand-600" /> {perk}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className={`mt-8 ${p.featured ? btnPrimary : btnGhost}`}>{p.cta}</Link>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* FAQ */}
        <section id="faq" className={`${section} bg-slate-50 dark:bg-slate-900/40`}>
          <Reveal className="mx-auto max-w-2xl">
            <div className="text-center">
              <p className={eyebrow}>FAQ</p>
              <h2 className={h2}>Questions, answered</h2>
            </div>
            <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">
              {faqs.map(([q, a]) => (
                <details key={q} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                    {q}
                    <span className="text-xl text-slate-400 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Final CTA */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-4xl rounded-3xl bg-brand-600 px-6 py-14 text-center text-white">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to bring order to your pipeline?</h2>
            <p className="mx-auto mt-3 max-w-lg text-brand-100">Create a free workspace in under a minute, or explore the demo first.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {signedIn ? (
                <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-medium text-brand-700 hover:bg-brand-50">
                  Open dashboard <ArrowRight size={16} />
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-medium text-brand-700 hover:bg-brand-50">
                    Start free <ArrowRight size={16} />
                  </Link>
                  <Link href="/login" className="inline-flex items-center justify-center rounded-lg border border-white/40 px-5 py-3 text-sm font-medium hover:bg-white/10">
                    Try the demo
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 px-6 py-10 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-lg font-semibold text-brand-600">PulseCRM</div>
            <p className="mt-1 max-w-xs text-sm text-slate-500">A demo SaaS project built with Next.js, Supabase and Stripe test mode.</p>
          </div>
          <div className="flex gap-12 text-sm">
            <div className="space-y-2">
              <div className="font-medium">Product</div>
              <a href="#features" className="block text-slate-500 hover:text-slate-900 dark:hover:text-slate-100">Features</a>
              <a href="#pricing" className="block text-slate-500 hover:text-slate-900 dark:hover:text-slate-100">Pricing</a>
              <a href="#faq" className="block text-slate-500 hover:text-slate-900 dark:hover:text-slate-100">FAQ</a>
            </div>
            <div className="space-y-2">
              <div className="font-medium">Account</div>
              <Link href="/login" className="block text-slate-500 hover:text-slate-900 dark:hover:text-slate-100">Sign in</Link>
              <Link href="/signup" className="block text-slate-500 hover:text-slate-900 dark:hover:text-slate-100">Create account</Link>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-6xl text-xs text-slate-400">Demo project. Sample data only; no real customers or payments.</p>
      </footer>
    </div>
  );
}
