"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Check,
  ChevronsUpDown,
  CreditCard,
  KanbanSquare,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { Avatar } from "@/components/avatar";
import { CommandPalette } from "@/components/command-palette";
import { Popover } from "@/components/popover";
import { Shortcuts } from "@/components/shortcuts";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@/lib/actions/auth";
import { switchWorkspace } from "@/lib/actions/workspace";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/activity", label: "Activity", icon: ListChecks },
  { href: "/team", label: "Team", icon: UsersRound },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

type Props = {
  user: { name: string; email: string };
  workspace: { id: string; name: string; plan: string };
  workspaces: { id: string; name: string; plan: string; role: string }[];
  followUps: { id: string; name: string; days: number }[];
  followUpTotal: number;
  children: React.ReactNode;
};

function WorkspaceSwitcher({ workspace, workspaces, collapsed }: Pick<Props, "workspace" | "workspaces"> & { collapsed: boolean }) {
  const router = useRouter();
  return (
    <Popover
      label="Switch workspace"
      align="left"
      className="w-full"
      trigger={
        <span className="flex w-full items-center gap-2 rounded-lg p-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-900">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-semibold text-white">
            {workspace.name[0]?.toUpperCase()}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{workspace.name}</span>
                <span className="block text-xs uppercase text-slate-500">{workspace.plan}</span>
              </span>
              <ChevronsUpDown size={14} className="text-slate-400" />
            </>
          )}
        </span>
      }
    >
      {(close) => (
        <>
          <div className="px-2 py-1 text-xs font-medium text-slate-500">Workspaces</div>
          {workspaces.map((w) => (
            <button
              key={w.id}
              onClick={async () => {
                close();
                if (w.id !== workspace.id) {
                  await switchWorkspace(w.id);
                  router.refresh();
                }
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="min-w-0 flex-1 truncate">{w.name}</span>
              <span className="text-xs text-slate-500">{w.role}</span>
              {w.id === workspace.id && <Check size={14} className="text-brand-600" />}
            </button>
          ))}
        </>
      )}
    </Popover>
  );
}

export function AppShell({ user, workspace, workspaces, followUps, followUpTotal, children }: Props) {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);

  const nav = (isCollapsed: boolean, onNavigate?: () => void) => (
    <nav className="flex flex-1 flex-col gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = path === href || path.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            title={label}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isCollapsed ? "justify-center" : ""} ${
              active
                ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
            }`}
          >
            <Icon size={17} className="shrink-0" />
            {!isCollapsed && label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col gap-4 border-r border-slate-200 p-3 transition-[width] duration-200 md:flex dark:border-slate-800 ${
          collapsed ? "w-[68px]" : "w-60"
        }`}
      >
        <WorkspaceSwitcher workspace={workspace} workspaces={workspaces} collapsed={collapsed} />
        {nav(collapsed)}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <><PanelLeftClose size={17} /> Collapse</>}
        </button>
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col gap-4 bg-white p-3 shadow-xl dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <span className="px-2 text-lg font-semibold text-brand-600">PulseCRM</span>
              <button onClick={() => setDrawer(false)} aria-label="Close menu" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-900">
                <X size={18} />
              </button>
            </div>
            <WorkspaceSwitcher workspace={workspace} workspaces={workspaces} collapsed={false} />
            {nav(false, () => setDrawer(false))}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-slate-200 bg-white/80 px-4 py-2.5 backdrop-blur md:px-8 dark:border-slate-800 dark:bg-slate-950/80">
          <button onClick={() => setDrawer(true)} aria-label="Open menu" className="rounded-lg p-2 hover:bg-slate-100 md:hidden dark:hover:bg-slate-900">
            <Menu size={18} />
          </button>
          <CommandPalette />
          <div className="flex-1" />
          <Shortcuts />
          <ThemeToggle />

          <Popover
            label="Notifications"
            trigger={
              <span className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
                <Bell size={18} />
                {followUpTotal > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                    {followUpTotal > 99 ? "99+" : followUpTotal}
                  </span>
                )}
              </span>
            }
          >
            {(close) => (
              <div className="w-72">
                <div className="px-2 py-1 text-xs font-medium text-slate-500">Needs follow-up (no contact in 14+ days)</div>
                {followUps.length === 0 ? (
                  <p className="p-3 text-sm text-slate-500">You&apos;re all caught up.</p>
                ) : (
                  followUps.map((f) => (
                    <Link
                      key={f.id}
                      href={`/clients/${f.id}`}
                      onClick={close}
                      className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <span className="truncate">{f.name}</span>
                      <span className="shrink-0 text-xs text-amber-600">{f.days}d ago</span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </Popover>

          <Popover
            label="Account menu"
            trigger={
              <span className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                <Avatar name={user.name} size={30} />
                <span className="hidden max-w-32 truncate text-sm sm:block">{user.name}</span>
              </span>
            }
          >
            {(close) => (
              <>
                <div className="px-2 py-1.5">
                  <div className="truncate text-sm font-medium">{user.name}</div>
                  <div className="truncate text-xs text-slate-500">{user.email}</div>
                </div>
                <Link href="/settings" onClick={close} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Settings size={15} /> Settings
                </Link>
                <form action={logout}>
                  <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                    <LogOut size={15} /> Sign out
                  </button>
                </form>
              </>
            )}
          </Popover>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
