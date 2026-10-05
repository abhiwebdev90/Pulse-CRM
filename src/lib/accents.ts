export const ACCENTS = {
  indigo: "#4f46e5",
  emerald: "#059669",
  rose: "#e11d48",
  amber: "#d97706",
  sky: "#0284c7",
  violet: "#7c3aed",
} as const;

export type Accent = keyof typeof ACCENTS;
