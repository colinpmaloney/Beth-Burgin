/**
 * Build the deployable site into dist/.
 *
 *   1. Tailwind compiles src/input.css -> assets/css/site.css (done by the npm script)
 *   2. This script copies the static files that get served into dist/
 *
 * dist/ is what Vercel (or Netlify, Cloudflare Pages, GitHub Pages) publishes.
 */
import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

// Everything the browser is allowed to see. Anything not listed stays out.
const entries = ["index.html", "assets", "robots.txt", "sitemap.xml", "404.html"];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const entry of entries) {
  const from = join(root, entry);
  if (!existsSync(from)) continue;
  await cp(from, join(dist, entry), { recursive: true });
}

console.log(`Built dist/ (${entries.filter((e) => existsSync(join(root, e))).join(", ")})`);
