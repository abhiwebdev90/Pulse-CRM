export const STATUSES = ["New", "Contacted", "Proposal Sent", "Won", "Lost"] as const;
export type Status = (typeof STATUSES)[number];

export const ACTIVITY_TYPES = ["Call", "Email", "Meeting", "Note"] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export type Client = {
  id: string;
  workspace_id: string;
  owner_id: string | null;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  status: Status;
  value: number;
  last_contact: string;
  created_at: string;
  updated_at: string;
};

export type Activity = {
  id: string;
  type: ActivityType;
  note: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
};

export const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
