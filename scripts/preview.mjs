/**
 * Bundle the built site into one self-contained HTML file.
 *
 * Used for sharing a clickable preview somewhere that can't serve the asset
 * folder (a Claude artifact, an email attachment, a USB stick). Fonts become
 * data URIs, CSS and JS are inlined, and the two pieces that need a network
 * (the map embed and the portrait photo) fall back to what they already fall
 * back to when they fail.
 *
 * Run `npm run build` first, then `npm run preview`. Output: preview.html
 */
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

let html = await readFile(join(dist, "index.html"), "utf8");
let css = await readFile(join(dist, "assets", "css", "site.css"), "utf8");
const js = await readFile(join(dist, "assets", "js", "site.js"), "utf8");

// Latin only. The copy is English, and carrying latin-ext would roughly double
// the file for characters this page never renders.
for (const face of ["fraunces-latin", "fraunces-italic-latin", "inter-latin"]) {
  const b64 = (await readFile(join(dist, "assets", "fonts", `${face}.woff2`))).toString("base64");
  css = css.replaceAll(`/assets/fonts/${face}.woff2`, `data:font/woff2;base64,${b64}`);
}

// Drop the subsets we didn't inline, so the browser isn't asked for missing files.
css = css.replace(/@font-face\{[^}]*\/assets\/fonts\/[^}]*\}/g, "");

const title = html.match(/<title>([\s\S]*?)<\/title>/)[1];

// Keep only what lives inside <body>, since the artifact host supplies the shell.
let body = html.slice(html.indexOf("<body"), html.lastIndexOf("</body>"));
body = body.slice(body.indexOf(">") + 1);

// Nothing serves /assets/img here, so every referenced image becomes a data
// URI. Files that don't exist are left alone: their onerror handlers already do
// the right thing (the portrait swaps in its placeholder, the hero texture
// removes itself).
const MIME = { webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", svg: "image/svg+xml" };

for (const ref of new Set(body.match(/\/assets\/img\/[\w.-]+/g) ?? [])) {
  const ext = ref.split(".").pop().toLowerCase();
  if (!MIME[ext]) continue;
  try {
    const b64 = (await readFile(join(dist, ref.replace(/^\//, "")))).toString("base64");
    body = body.replaceAll(ref, `data:${MIME[ext]};base64,${b64}`);
  } catch {
    console.warn(`  missing, left to its fallback: ${ref}`);
  }
}

// Cross-origin frames are blocked here. The styled fallback underneath is the
// whole point of that markup, so just let it show.
body = body.replace(/<iframe[\s\S]*?<\/iframe>/g, "");

// The script is inlined below, so drop the tag that points at the file.
body = body.replace(/<script src="\/assets\/js\/site\.js"[^>]*><\/script>/, "");

// Vercel serves the analytics and speed-insights scripts; anywhere else they
// are a guaranteed 404.
body = body.replace(/[ \t]*<script defer src="\/_vercel\/[^"]*"><\/script>\n/g, "");

const out = `<title>${title}</title>
<style>
/* The site commits to one light palette. Pin the scheme so a dark host
   shell can't half-apply its own. */
:root, :root[data-theme="dark"], :root[data-theme="light"] { color-scheme: light; }
html, body { background: #fafafa; }

${css}
</style>

${body}

<script>
${js}
</script>
`;

await writeFile(join(root, "preview.html"), out);
console.log(`preview.html written, ${(out.length / 1024).toFixed(0)} KB`);
