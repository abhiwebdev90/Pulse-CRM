// Captures landing-page product screenshots (light + dark) from the running dev server.
// Usage: npm run dev   (in one terminal), then   npm run screenshots
// Logs in with the seeded demo account (DEMO_EMAIL / DEMO_PASSWORD from .env.local).
import { mkdirSync } from "node:fs";
import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

const BASE = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000";
const { DEMO_EMAIL: email, DEMO_PASSWORD: password } = process.env;
if (!email || !password) {
  console.error("Set DEMO_EMAIL and DEMO_PASSWORD (run with: node --env-file=.env.local scripts/screenshots.mjs)");
  process.exit(1);
}

const candidates = [
  process.env.BROWSER_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const executablePath = candidates.find((p) => existsSync(p));
if (!executablePath) {
  console.error("No Chrome/Edge found. Set BROWSER_PATH to a browser executable.");
  process.exit(1);
}

const shots = [
  { name: "dashboard", path: "/dashboard" },
  { name: "pipeline", path: "/pipeline" },
  { name: "clients", path: "/clients?sort=value_desc" },
];

mkdirSync("public/screens", { recursive: true });
const browser = await puppeteer.launch({ executablePath, headless: true });

try {
  for (const theme of ["light", "dark"]) {
    // Fresh context per theme so the earlier login session does not carry over.
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({ width: 1440, height: 680, deviceScaleFactor: 1.5 });
    await page.evaluateOnNewDocument((t) => localStorage.setItem("theme", t), theme);

    await page.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
    await page.type('input[name="email"]', email);
    await page.type('input[name="password"]', password);
    await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" }), page.click('button[type="submit"], form button')]);

    for (const { name, path } of shots) {
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle0" });
      // Hide the Next.js dev badge and let chart animations finish.
      await page.addStyleTag({ content: "nextjs-portal, [data-nextjs-toast] { display: none !important; }" });
      await new Promise((r) => setTimeout(r, 2200));
      const file = `public/screens/${name}-${theme}.webp`;
      await page.screenshot({ path: file, type: "webp", quality: 86 });
      console.log("saved", file);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
