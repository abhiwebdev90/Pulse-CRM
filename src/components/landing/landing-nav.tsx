"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { id: "features", label: "Features" },
  { id: "how", label: "How it works" },
  { id: "tour", label: "Product tour" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
];

export function LandingNav({ signedIn = false }: { signedIn?: boolean }) {
  const [active, setActive] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Scroll-spy: the active link is the last section whose top has passed ~35% down the viewport.
  useEffect(() => {
    const update = () => {
      const line = window.innerHeight * 0.35;
      let current: string | null = null;
      for (const { id } of links) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      // Past the last section's end (e.g. final call to action / footer) nothing is highlighted.
      const last = document.getElementById(links[links.length - 1].id);
      if (last && last.getBoundingClientRect().bottom < line) current = null;
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Escape closes the mobile menu.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const linkClass = (id: string) =>
    `rounded-lg px-3 py-1.5 transition-colors ${
      active === id
        ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300"
        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/80">
      <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-lg font-semibold text-brand-600">
          PulseCRM
        </Link>
        <div className="hidden items-center gap-1 text-sm md:flex">
          {links.map(({ id, label }) => (
            <a key={id} href={`#${id}`} aria-current={active === id ? "true" : undefined} className={linkClass(id)}>
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <ThemeToggle />
          {signedIn ? (
            <Link href="/dashboard" className="rounded-lg bg-brand-600 px-3 py-2 font-medium text-white hover:bg-brand-500">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden rounded-lg px-3 py-2 hover:bg-slate-100 sm:block dark:hover:bg-slate-900">
                Sign in
              </Link>
              <Link href="/signup" className="rounded-lg bg-brand-600 px-3 py-2 font-medium text-white hover:bg-brand-500">
                Get started
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-400 dark:hover:bg-slate-900"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-slate-200 bg-white px-6 py-3 md:hidden dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-1 text-base">
            {links.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={() => setMenuOpen(false)}
                aria-current={active === id ? "true" : undefined}
                className={`${linkClass(id)} py-2.5`}
              >
                {label}
              </a>
            ))}
            {!signedIn && (
              <Link href="/login" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-slate-600 dark:text-slate-400">
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
