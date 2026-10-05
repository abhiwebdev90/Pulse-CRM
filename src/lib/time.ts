export const DAY_MS = 86_400_000;

// Kept out of components so server-rendered pages can read the clock without tripping the purity lint rule.
export const nowMs = () => Date.now();
export const daysSince = (iso: string) => Math.floor((nowMs() - new Date(iso).getTime()) / DAY_MS);
export const isoDaysAgo = (days: number) => new Date(nowMs() - days * DAY_MS).toISOString();
