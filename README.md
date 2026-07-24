# bethburgin.com

Marketing site for Beth Burgin, Certified Advanced Rolfer® in Wilmington, NC.

One static page, plain HTML and Tailwind CSS v4. No framework and nothing to run
at request time: about 40 KB of CSS and 5 KB of JavaScript, served as files.

## Running it locally

```bash
npm install
npm run dev      # rebuilds CSS on save
npm run serve    # serves at http://localhost:3000, in a second terminal
```

`npm run dev` watches `src/input.css` and writes `assets/css/site.css`. Edit
`index.html` and refresh.

## Building

```bash
npm run build
```

Minifies the CSS and assembles `dist/`, which is the whole deployable site.
`dist/` is gitignored because the host rebuilds it on every deploy.

## Deploying (free)

The site is static, so every option below has a free tier with plenty of room
for a practice site.

### Vercel

1. Push this repo to GitHub.
2. Open [vercel.com/new](https://vercel.com/new) and import the repository.
3. Vercel reads `vercel.json` and fills in the build settings by itself: build
   command `npm run build`, output directory `dist`. Click Deploy.

Pushes to the default branch redeploy automatically, and pull requests get
their own preview URL.

### Netlify or Cloudflare Pages

Same idea, entered by hand:

- Build command: `npm run build`
- Publish directory: `dist`

### Pointing bethburgin.com at it

In Vercel, go to Project, Settings, Domains, and add `bethburgin.com`. Vercel
then shows the exact DNS records to create at whichever registrar holds the
domain, usually an `A` record for the apex and a `CNAME` for `www`. HTTPS is
issued automatically once DNS resolves.

## Editing content

Everything lives in `index.html`. There's no CMS and no templating, so the text
you search for is the text on the page.

| To change         | Look for                                      |
| ----------------- | --------------------------------------------- |
| Prices            | `$140`, in the three cards under `#sessions`   |
| Phone number      | `+19107074793` and `(910) 707-4793`            |
| Email             | `rolferbeth@gmail.com`                         |
| Booking link      | `app.acuityscheduling.com`                     |
| Address, parking  | the `#visit` section                           |
| FAQ entries       | `<details class="faq-item">` blocks in `#faq`  |
| Testimonials      | the `#reviews` section                         |

The address, phone, and email also appear in the JSON-LD block at the top of
`index.html`. That block is what Google reads for the business listing, so
update both places together.

### Photos

Drop files into `assets/img/` using the names listed in
[`assets/img/README.md`](assets/img/README.md). The hero portrait falls back to
a styled placeholder when `beth-portrait.jpg` isn't there, so nothing looks
broken while you wait on photography.

## Fonts

Fraunces and Inter are served from `assets/fonts/` rather than loaded from
Google. That means one less third-party request and no visitor data leaving the
site. The `.woff2` files are committed. Re-run `npm run fonts` only if the
families or weights change.

## Project layout

```
index.html          the entire page
404.html            not-found page
src/input.css       Tailwind entry: theme colors, fonts, custom utilities
src/fonts.css       generated @font-face rules (npm run fonts)
assets/js/site.js   mobile menu, sticky header, scroll-spy, reveal animations
assets/fonts/       self-hosted woff2
assets/img/         photos and icons
scripts/build.mjs   assembles dist/
scripts/fonts.mjs   vendors the webfonts
vercel.json         build settings and cache headers
```

## Notes

- The nav works at every width. Below 1024px it's a slide-in drawer that traps
  focus, closes on Escape, and locks background scrolling. Above that it's a
  horizontal bar, and scroll-spy marks whichever section you're reading.
- Checked for layout overflow at ten widths between 320px and 1920px.
- `prefers-reduced-motion` turns off every animation and the smooth scrolling.
- The page works with JavaScript off. All the content is in the HTML, and the
  reveal animations only engage once JS confirms it's running.
