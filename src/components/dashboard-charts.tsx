"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Props = {
  byStatus: { status: string; count: number }[];
  trend: { month: string; total: number }[];
};

const card = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40";
const axis = { fontSize: 11, fill: "currentColor", opacity: 0.6 } as const;
const tooltipStyle = {
  background: "var(--chart-tip-bg)",
  color: "var(--chart-tip-fg)",
  border: "1px solid var(--chart-tip-border)",
  borderRadius: 8,
  fontSize: 12,
  boxShadow: "0 4px 16px rgb(0 0 0 / 0.12)",
} as const;

function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 text-center dark:border-slate-700">
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-xs text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export function DashboardCharts({ byStatus, trend }: Props) {
  const hasLeads = byStatus.some((s) => s.count > 0);
  const hasRevenue = trend.some((t) => t.total > 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={card}>
        <h2 className="mb-3 text-sm font-medium">Leads by stage</h2>
        {hasLeads ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStatus} margin={{ left: -16, right: 4, top: 4 }}>
                <defs>
                  <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.55} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.12} />
                <XAxis dataKey="status" tick={axis} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "currentColor", opacity: 0.06 }} />
                <Bar dataKey="count" name="Leads" fill="url(#barFill)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty title="No leads yet" hint="Add your first client and the stage breakdown will appear here." />
        )}
      </div>

      <div className={card}>
        <h2 className="mb-3 text-sm font-medium">Won revenue, last 6 months</h2>
        {hasRevenue ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: -8, right: 8, top: 4 }}>
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.12} />
                <XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`$${Number(v).toLocaleString()}`, "Won"]} />
                <Area type="monotone" dataKey="total" stroke="#059669" strokeWidth={2.5} fill="url(#areaFill)" dot={{ r: 3, fill: "#059669" }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty title="No won revenue yet" hint="Move a deal to Won and your revenue trend will show up here." />
        )}
      </div>
    </div>
  );
}
