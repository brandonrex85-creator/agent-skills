# Ginger & Lime — website

A static, dependency-free website for Ginger & Lime, a health food restaurant
and juice bar in Palm Harbor, Florida. Plain HTML, one stylesheet, one small
JavaScript file — no build step, no framework, no server-side code. It runs
anywhere that can serve files.

## Pages

| File | Page |
|---|---|
| `index.html` | Home — hero, hours/address strip, what we make, story teaser, photo strip |
| `menu.html` | Full menu: sandwiches & wraps, bowls, fresh squeezed juices, smoothies |
| `gallery.html` | Photo gallery with a keyboard-accessible lightbox |
| `about.html` | Our Story |
| `visit.html` | Hours, address, map, phone, social links |

Ordering is **not** built into the site. Every page carries an "Order Pickup"
band linking out to DoorDash and UberEats, plus a click-to-call phone link.

## Preview it locally

```bash
cd ginger-and-lime
python3 -m http.server 8000   # then open http://localhost:8000
```

## Before it goes live

1. **Add the photos.** Drop the supplied images into `assets/img/` using the
   filenames listed in [`assets/img/README.md`](assets/img/README.md). Missing
   photos render as a labelled placeholder rather than a broken image, so the
   site is deployable at any point.
2. **Swap in the real logo.** `assets/img/logo-mark.svg` and `favicon.svg` are
   placeholders drawn in the house palette — see the same README.
3. **Set the domain.** The site is written against the placeholder
   `https://www.gingerandlime.example`, used in the canonical tags, social
   share tags, `sitemap.xml` and `robots.txt`. Once the domain is purchased,
   replace it everywhere in one pass:

   ```bash
   grep -rl "www.gingerandlime.example" . \
     | xargs sed -i '' 's|https://www.gingerandlime.example|https://YOURDOMAIN.com|g'
   ```

   (On Linux, drop the `''` after `-i`.)
4. **Review the Our Story copy.** `about.html` is drafted placeholder copy
   written from the brief. It reads as true to the restaurant, but nobody at
   Ginger & Lime has confirmed it — have the owner approve or rewrite it
   before launch.

## Deploying

The whole site is static files, so any of these work with zero configuration —
point them at the `ginger-and-lime/` folder:

- **Netlify / Cloudflare Pages / Vercel** — drag-and-drop the folder, or
  connect the repository and set the publish directory to `ginger-and-lime`.
  All three issue a free HTTPS certificate and let you attach the domain once
  it is purchased.
- **GitHub Pages** — publish the folder from the repository settings.
- **Traditional hosting** — upload the folder contents by FTP.

## Menu content

Prices and descriptions are transcribed from the two menu board photos in the
brief: 10 sandwiches & wraps, 5 bowls, 8 juices and 7 smoothies.

**Flatbreads and açaí bowls are intentionally not on the menu page** — they
were not priced at build time. Their photos do appear in the gallery. To add
them once pricing is confirmed, copy an existing `<li class="menu-item">`
block in `menu.html` and edit the name, description and price; add the
category to the sticky `menu-nav` list at the top of the same file if it needs
its own section.

## Editing notes

- The header and footer are duplicated in each HTML file (the normal trade-off
  for a no-build static site). Change one, change all five — search for
  `<header class="site-header"` and `<footer class="site-footer"`.
- Business details that appear in several places: phone `(727) 210-7536`,
  address `30617 US Hwy 19 N, Palm Harbor, FL 34684`, hours
  `10:30 AM – 7:00 PM` daily. `grep -rn "210-7536" .` finds every instance.
- Hours also live in two machine-readable places: the `openingHoursSpecification`
  block of the JSON-LD in `index.html` and `visit.html` (this is what Google
  reads), and the open/closed badge logic in `assets/js/site.js`, which is set
  to America/New_York so it is correct for out-of-state visitors. Update all
  three if the hours ever change.
- Colors are CSS custom properties at the top of `assets/css/styles.css` —
  sage, terracotta, cream and wood tones pulled from the logo illustration.

## What was built in

- Responsive from 320px up; mobile navigation, mobile-first spacing, tap-sized
  controls.
- Accessibility: skip link, semantic landmarks, visible focus rings, labelled
  interactive controls, alt text on every photo, `prefers-reduced-motion`
  support, and a lightbox that closes on Escape and moves with arrow keys.
- SEO: per-page titles and descriptions, canonical URLs, Open Graph and
  Twitter cards, `sitemap.xml`, `robots.txt`, and `Restaurant` structured data
  with address, phone, hours and social profiles so the hours can surface in
  Google and Maps results.
- Performance: no frameworks, no trackers, lazy-loaded images and map, one
  23KB stylesheet and one 5KB script. Fonts load from Google Fonts and fall
  back to system serif/sans if unavailable.
- A print stylesheet, so the menu page prints cleanly on two columns.
