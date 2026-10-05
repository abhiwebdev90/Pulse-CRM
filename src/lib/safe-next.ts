// Only allow same-site relative paths as a post-login destination (blocks open redirects like //evil.com).
export function safeNext(value: unknown, fallback = "/dashboard") {
  if (typeof value !== "string") return fallback;
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : fallback;
}
