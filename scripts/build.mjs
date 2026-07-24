/**
 * Build the deployable site into dist/.
 *
 *   1. Tailwind compiles src/input.css -> assets/css/site.css (done by the npm script)
 *   2. This script copies the static files that get served into dist/
 *
 * dist/ is what Vercel (or Netlify, Cloudflare Pages, GitHub Pages) publishes.
 */
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

// Everything the browser is allowed to see. Anything not listed stays out.
const entries = ["index.html", "assets", "robots.txt", "sitemap.xml", "llms.txt", "404.html"];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const entry of entries) {
  const from = join(root, entry);
  if (!existsSync(from)) continue;
  await cp(from, join(dist, entry), { recursive: true });
}

// The hero photo is optional. When it isn't in the repo, drop the <img> and
// show the placeholder directly: leaving the tag in would 404 on every visit
// and put a red line in the console, which reads as a broken site.
//
// The filename is read out of the markup rather than hardcoded here, so
// changing the src in index.html is all it takes to point at a different file.
const page = join(dist, "index.html");
let html = await readFile(page, "utf8");

const block = html.match(/[ \t]*<!-- portrait:start -->[\s\S]*?<!-- portrait:end -->\n/);
const src = block ? block[0].match(/src="([^"]+)"/) : null;
const hasPortrait = !!src && existsSync(join(root, src[1].replace(/^\//, "")));

if (block && !hasPortrait) {
  html = html.replace(block[0], "").replace(/(id="portrait-fallback")\s+hidden/, "$1");
  await writeFile(page, html);
}

console.log(
  `Built dist/ (${entries.filter((e) => existsSync(join(root, e))).join(", ")})` +
    (hasPortrait ? ` with hero photo ${src[1]}` : " without a hero photo, showing the placeholder")
);
