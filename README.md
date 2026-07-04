# WTF! — What The Flowers · growth toolkit

Two standalone tools to grow reach and sales for **What The Flowers**, Blackpool —
built to work *alongside* the current FloristWindow site now, and lift straight
into **Shopify** later with zero rewrite. Both are on-brand: bright, bold, black +
hot-pink + electric-yellow — not your nan's daisies.

Nothing here touches your live shop or payment system. Every button funnels the
visitor to `whattheflowers.co.uk` to order, or to the phone.

---

## 1. Local-SEO landing pages  (`/landing-pages`)

A generator that builds **180 pages** — one for every *occasion × Blackpool-area*
combination (e.g. "Same-Day Flowers in Bispham", "Funeral Flowers in Cleveleys").
This is how national chains out-rank local shops in Google; these pages let you
beat them on genuine local relevance.

Each page has: a unique title & meta description, local copy, `Florist` +
`FAQPage` + `BreadcrumbList` schema markup, internal links, and same-day CTAs.
The build also emits `sitemap.xml` and `robots.txt` for Google Search Console.

```bash
node landing-pages/generate.js      # → landing-pages/dist/
```

**Edit the content** without touching code:
- `config.json` — phone, address, order URL, cut-off time, brand slogan
- `landing-pages/data/areas.json` — the areas/postcodes you deliver to
- `landing-pages/data/occasions.json` — occasions, bouquets, copy, FAQs

**Go live:** host `landing-pages/dist/` on a subdomain (e.g.
`flowers.whattheflowers.co.uk`) via Netlify, Cloudflare Pages or GitHub Pages
(all free for static files), then submit `sitemap.xml` in Google Search Console.

## 2. "Find your WTF! Moment" quiz  (`/choose-quiz`)

A self-contained bouquet finder: 4 quick questions (who / occasion / budget /
vibe) → 3 tailored recommendations, each with *Order online* and *Call* buttons.
It removes the "I don't know what to pick" drop-off that loses sales.

- One file, no dependencies, no external requests — open `choose-quiz/index.html`
  in any browser.
- Edit `ORDER_URL` / `PHONE` at the top of the `<script>`, and the `CATALOGUE`
  array to match your real bouquets and prices.
- **Go live now:** host the file on the same subdomain and link to it from your
  Facebook/Instagram bio. **Later on Shopify:** paste it into a page or a custom
  Liquid section — it just works.

---

### Roadmap (easy next builds)
Occasion reminder emails · abandoned-basket nudges · auto-drafted Google/Instagram
posts · a same-day postcode checker · a corporate/subscription order form.
