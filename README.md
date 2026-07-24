# bethburgin.com

Marketing site for **Beth Burgin**, Certified Advanced Rolfer® — Wilmington, NC.

A single static page built with plain HTML and Tailwind CSS v4. No framework, no
runtime dependencies, ~40 KB of CSS and ~5 KB of JavaScript. It deploys as static
files anywhere.

## Running it locally

```bash
npm install
npm run dev      # rebuilds CSS on save
npm run serve    # serves the site at http://localhost:3000 (separate terminal)
```

`npm run dev` watches `src/input.css` and writes `assets/css/site.css`. Edit
`index.html` and refresh.

## Building

```bash
npm run build
```

Minifies the CSS and assembles `dist/` — that folder is the whole deployable
site. `dist/` is gitignored; the host rebuilds it on each deploy.

## Deploying (free)

The site is static, so every option below has a free tier that comfortably
covers a practice site.

### Vercel — recommended

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Vercel reads `vercel.json` and fills in the build settings on its own — build
   command `npm run build`, output directory `dist`. Click **Deploy**.

Every push to the default branch redeploys automatically. Pull requests get
their own preview URL.

### Netlify or Cloudflare Pages

Same idea, set manually:

- **Build command:** `npm run build`
- **Publish directory:** `dist`

### Pointing bethburgin.com at it

In Vercel: **Project → Settings → Domains → Add** `bethburgin.com`. Vercel shows
the exact DNS records to create at whichever registrar holds the domain
(usually an `A` record for the apex and a `CNAME` for `www`). HTTPS is issued
automatically once DNS resolves.

## Editing content

Everything lives in `index.html` — there's no CMS and no build-time templating,
so the text you search for is the text on the page.

| To change            | Look for                                        |
| -------------------- | ----------------------------------------------- |
| Prices               | `$140` (three pricing cards in `#sessions`)     |
| Phone number         | `+19107074793` and `(910) 707-4793`             |
| Email                | `rolferbeth@gmail.com`                          |
| Booking link         | `app.acuityscheduling.com`                      |
| Address / parking    | the `#visit` section                            |
| FAQ entries          | `<details class="faq-item">` blocks in `#faq`   |
| Testimonials         | the `#reviews` section                          |

The address, phone, and email are also repeated in the JSON-LD block at the top
of `index.html`, which is what Google reads for the map/business listing —
update both places together.

### Photos

Drop files into `assets/img/` using the names in
[`assets/img/README.md`](assets/img/README.md). The hero portrait falls back to
a styled placeholder if `beth-portrait.jpg` isn't there, so nothing breaks
while you wait on photography.

## Fonts

Fraunces and Inter are self-hosted from `assets/fonts/` rather than loaded from
Google — one less third-party request, and no visitor data leaves the site. The
`.woff2` files are committed. Re-run `npm run fonts` only if the families or
weights change.

## Project layout

```
index.html          the entire page
404.html            not-found page
src/input.css       Tailwind entry — theme colors, fonts, custom utilities
src/fonts.css       generated @font-face rules (npm run fonts)
assets/js/site.js   mobile menu, sticky header, scroll-spy, reveal animations
assets/fonts/       self-hosted woff2
assets/img/         photos and icons
scripts/build.mjs   assembles dist/
scripts/fonts.mjs   vendors the webfonts
vercel.json         build settings and cache headers
```

## Notes

- Nav works at every width: a slide-in drawer under 1024px with focus trapping,
  Escape to close, and background scroll lock; a horizontal bar above it with
  scroll-spy highlighting the current section.
- Verified for layout overflow from 320px to 1920px.
- Respects `prefers-reduced-motion` — all animation and smooth scrolling is
  disabled for visitors who ask for it.
- Works without JavaScript: content is all in the HTML, and the reveal
  animations only engage once JS confirms it's running.
