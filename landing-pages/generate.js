#!/usr/bin/env node
/*
 * Local-SEO landing page generator for What The Flowers.
 *
 * Reads: ../config.json, data/areas.json, data/occasions.json
 * Writes: dist/<occasion>/<area>.html  (one page per occasion × area)
 *         dist/index.html              (hub linking every page)
 *         dist/sitemap.xml             (for Google Search Console)
 *         dist/robots.txt
 *
 * Run:  node landing-pages/generate.js
 *
 * These pages are a standalone microsite. Host them on a subdomain
 * (e.g. flowers.whattheflowers.co.uk) that points at Google, and every
 * "Order online" / "Call" button funnels the visitor to your live
 * FloristWindow shop today. When you move to Shopify, the same pages
 * become Shopify pages — nothing here is wasted.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(__dirname, "dist");

const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "config.json"), "utf8"));
const areas = JSON.parse(fs.readFileSync(path.join(__dirname, "data/areas.json"), "utf8"));
const occasions = JSON.parse(fs.readFileSync(path.join(__dirname, "data/occasions.json"), "utf8"));

const DAYS = "Monday to Saturday";

// --- helpers ---------------------------------------------------------------

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Fill {area}, {phone}, {cutOff} etc. in a copy string.
function fill(str, area) {
  return str
    .replace(/\{area\}/g, area.name)
    .replace(/\{postcodes\}/g, area.postcodes)
    .replace(/\{phone\}/g, cfg.phone)
    .replace(/\{cutOff\}/g, cfg.cutOffTime)
    .replace(/\{days\}/g, DAYS);
}

// Deterministic "random" so copy varies between pages but stays stable
// across rebuilds (no duplicate-content penalty, no churn in git).
function pick(list, seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff;
  return list[Math.abs(h) % list.length];
}

const url = (occ, area) => `${cfg.siteUrl}/${occ.slug}/${area.slug}.html`;

// --- shared CSS (inlined so each page is fully self-contained) -------------

const CSS = `
/* ---- WTF! brand: black, hot magenta, electric yellow, cyan pops ---- */
:root{
  --bg:#ffffff; --ink:#0c0c10; --muted:#54545f;
  --pink:#ff1f8e; --yellow:#ffe500; --cyan:#1fc8dd; --orange:#ff7a1a;
  --line:#ececf1; --card:#ffffff; --bar:#0a0a0c; --bar-ink:#ffffff;
  --btn-ink:#ffffff;
  --maxw:940px;
}
@media (prefers-color-scheme:dark){
  :root{--bg:#0c0c10;--ink:#f5f5f7;--muted:#a6a6b2;--line:#232330;
    --card:#16161d;--bar:#000000;--btn-ink:#0a0a0c}
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);
  font:400 17px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
h1,h2,h3{font-family:"Arial Black","Helvetica Neue",Arial,sans-serif;font-weight:900;
  line-height:1.02;letter-spacing:-.01em;text-transform:uppercase;color:var(--ink);text-wrap:balance;margin:0 0 .35em}
h1{font-size:clamp(2.1rem,6vw,3.6rem)}
h2{font-size:clamp(1.5rem,3.4vw,2.2rem);margin-top:0}
a{color:var(--pink)}
.wrap{max-width:var(--maxw);margin:0 auto;padding:0 22px}
.eyebrow{font-size:.78rem;letter-spacing:.2em;text-transform:uppercase;color:var(--pink);font-weight:800;margin:0 0 .7em}
mark{background:var(--yellow);color:#0a0a0c;padding:0 .12em}
.bar{background:var(--bar);color:var(--bar-ink)}
.bar a{color:var(--bar-ink);text-decoration:none}
.bar .wrap{display:flex;flex-wrap:wrap;gap:8px 20px;align-items:center;justify-content:space-between;padding-top:13px;padding-bottom:13px}
.wtf{font-family:"Arial Black",Arial,sans-serif;font-weight:900;font-size:1.5rem;letter-spacing:-.02em;font-style:italic}
.wtf .w{color:var(--pink)}.wtf .t{color:var(--cyan)}.wtf .f{color:var(--yellow)}.wtf .b{color:var(--orange)}
.bar .tel{font-weight:800;letter-spacing:.02em}
.strip{height:6px;background:linear-gradient(90deg,var(--pink) 0 25%,var(--yellow) 25% 50%,var(--cyan) 50% 75%,var(--orange) 75% 100%)}
.hero{background:var(--bar);color:#fff;padding:60px 0 52px;position:relative;overflow:hidden}
.hero h1{color:#fff}
.hero .eyebrow{color:var(--yellow)}
.hero .lede{font-size:1.22rem;color:#e7e7ee;max-width:58ch}
.hero .blob{position:absolute;border-radius:50%;filter:blur(6px);opacity:.9;z-index:0}
.hero>.wrap{position:relative;z-index:1}
.cta-row{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}
.btn{display:inline-block;padding:15px 30px;border-radius:999px;text-decoration:none;font-weight:800;
  font-size:1.02rem;text-transform:uppercase;letter-spacing:.03em;border:2.5px solid transparent}
.btn-primary{background:var(--pink);color:#fff}
.btn-primary:hover{background:var(--yellow);color:#0a0a0c}
.btn-ghost{background:transparent;color:#fff;border-color:#fff}
.hero .btn-ghost:hover{background:#fff;color:#0a0a0c}
section{padding:46px 0;border-bottom:1px solid var(--line)}
.grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
.card{background:var(--card);border:2px solid var(--ink);border-radius:16px;padding:18px 20px;
  box-shadow:5px 5px 0 var(--pink)}
.card:nth-child(2){box-shadow:5px 5px 0 var(--cyan)}
.card:nth-child(3){box-shadow:5px 5px 0 var(--yellow)}
.card:nth-child(4){box-shadow:5px 5px 0 var(--orange)}
.card h3{font-size:1.05rem;margin:0 0 .3em}
.ticks{list-style:none;padding:0;margin:0;display:grid;gap:14px}
.ticks li{padding-left:34px;position:relative}
.ticks li::before{content:"✸";position:absolute;left:0;color:var(--pink);font-size:1.2rem;line-height:1.2}
.faq{border-top:2px solid var(--line);padding:18px 0}
.faq:first-of-type{border-top:0}
.faq h3{font-size:1.05rem;color:var(--ink);margin:0 0 .3em}
.faq p{margin:0;color:var(--muted)}
.chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}
.chip{font-size:.92rem;font-weight:700;text-decoration:none;background:var(--card);
  border:2px solid var(--ink);padding:7px 15px;border-radius:999px;color:var(--ink)}
.chip:hover{background:var(--pink);border-color:var(--pink);color:#fff}
footer{background:var(--bar);color:#e7e7ee;padding:38px 0;font-size:.95rem}
footer a{color:var(--yellow)}
.foot-grid{display:flex;flex-wrap:wrap;gap:24px;justify-content:space-between}
`;

// --- page template ---------------------------------------------------------

function page({ title, description, canonical, body, jsonld }) {
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(canonical)}">
<style>${CSS}</style>
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join("\n")}
</head>
<body>
<div class="bar"><div class="wrap">
  <a href="${esc(cfg.siteUrl)}/index.html" class="wtf" aria-label="${esc(cfg.businessName)} home"><span class="w">W</span><span class="t">T</span><span class="f">F</span><span class="b">!</span></a>
  <a class="tel" href="tel:${esc(cfg.phoneLink)}">☎ ${esc(cfg.phone)}</a>
</div></div>
<div class="strip"></div>
${body}
<div class="strip"></div>
<footer><div class="wrap foot-grid">
  <div>
    <span class="wtf"><span class="w">W</span><span class="t">T</span><span class="f">F</span><span class="b">!</span></span> · ${esc(cfg.businessName)}<br>
    ${esc(cfg.addressStreet)}, ${esc(cfg.addressLocality)}, ${esc(cfg.addressPostcode)}<br>
    <a href="tel:${esc(cfg.phoneLink)}">${esc(cfg.phone)}</a> · ${esc(cfg.openingHours)} · ${esc(cfg.instagram)}
  </div>
  <div>
    <a href="${esc(cfg.orderUrl)}">Order online</a><br>
    <a href="${esc(cfg.siteUrl)}/index.html">All delivery areas</a>
  </div>
</div></footer>
</body>
</html>`;
}

// --- build one occasion × area page ----------------------------------------

function buildPage(occ, area) {
  const seed = occ.slug + area.slug;
  const title = `${occ.name} in ${area.name} | ${cfg.businessName} Blackpool`;
  const description = fill(
    `Fresh ${occ.short} hand-tied in Blackpool and delivered to ${area.name} (${area.postcodes}). Order online or call ${cfg.phone}. Same-day available — order by ${cfg.cutOffTime}.`,
    area
  );
  const canonical = url(occ, area);

  const openers = [
    fill(occ.intro, area),
    `Looking for ${occ.short} delivered to ${area.name}? ${fill(occ.intro, area)}`,
    `${area.name} ${occ.short}, done properly. ${fill(occ.intro, area)}`,
  ];
  const opener = pick(openers, seed);

  // related links: same occasion, nearby areas + same area, other occasions
  const otherAreas = areas.filter((a) => a.slug !== area.slug).slice(0, 8);
  const otherOccs = occasions.filter((o) => o.slug !== occ.slug);

  const body = `
<header class="hero">
  <span class="blob" style="width:230px;height:230px;background:var(--pink);top:-60px;right:-40px"></span>
  <span class="blob" style="width:150px;height:150px;background:var(--cyan);bottom:-50px;left:8%"></span>
  <span class="blob" style="width:90px;height:90px;background:var(--yellow);top:40px;right:26%"></span>
  <div class="wrap">
  <p class="eyebrow">${esc(occ.name)} · ${esc(area.name)} ${esc(area.postcodes)}</p>
  <h1>${esc(occ.name)}<br>delivered to ${esc(area.name)}</h1>
  <p class="lede">${esc(opener)} ${esc(cfg.slogan)}</p>
  <div class="cta-row">
    <a class="btn btn-primary" href="${esc(cfg.orderUrl)}">Order online</a>
    <a class="btn btn-ghost" href="tel:${esc(cfg.phoneLink)}">Call ${esc(cfg.phone)}</a>
  </div>
</div></header>

<section><div class="wrap">
  <h2>Popular ${esc(occ.short)} for ${esc(area.name)}</h2>
  <div class="grid">
    ${occ.bouquets
      .map(
        (b) => `<div class="card"><h3>${esc(b)}</h3>
        <p style="margin:0;color:var(--muted)">Hand-tied fresh to order.</p></div>`
      )
      .join("\n    ")}
  </div>
  <div class="cta-row"><a class="btn btn-primary" href="${esc(cfg.orderUrl)}">Shop the collection</a></div>
</div></section>

<section><div class="wrap">
  <h2>Not your nan's daisies</h2>
  <ul class="ticks">
    <li><strong>Bold, vivid, unmistakably WTF!</strong> We do bright, funky and full-of-attitude — flowers people actually stop and stare at.</li>
    <li><strong>Same-day delivery to ${esc(area.name)}.</strong> Order by ${esc(cfg.cutOffTime)}, ${esc(DAYS)}, and we'll deliver today (${esc(area.note)}).</li>
    <li><strong>Hand-tied in Blackpool.</strong> Every bouquet is made by us on ${esc(cfg.addressStreet)} — never boxed in a warehouse.</li>
    <li><strong>A handwritten card, free.</strong> Add your message at checkout and we'll write it by hand.</li>
  </ul>
</div></section>

<section><div class="wrap">
  <h2>Flower delivery to ${esc(area.name)}</h2>
  <p style="color:var(--muted);max-width:62ch">We deliver ${esc(occ.short)} across ${esc(area.name)} and the postcodes ${esc(area.postcodes)}, ${esc(area.note)}. Delivery from £${esc(cfg.deliveryFeeFrom)}. Need it today? Place your order by ${esc(cfg.cutOffTime)} and we'll take care of the rest.</p>
  <h3 style="font-family:Georgia,serif;color:var(--green)">We also deliver to</h3>
  <div class="chips">
    ${otherAreas.map((a) => `<a class="chip" href="${esc(url(occ, a))}">${esc(occ.short)} ${esc(a.name)}</a>`).join("\n    ")}
  </div>
</div></section>

<section><div class="wrap">
  <h2>Questions about ${esc(occ.short)} in ${esc(area.name)}</h2>
  ${occ.faqs
    .map(
      ([q, a]) => `<div class="faq"><h3>${esc(fill(q, area))}</h3><p>${esc(fill(a, area))}</p></div>`
    )
    .join("\n  ")}
</div></section>

<section style="border-bottom:0"><div class="wrap">
  <h2>More flowers for ${esc(area.name)}</h2>
  <div class="chips">
    ${otherOccs.map((o) => `<a class="chip" href="${esc(url(o, area))}">${esc(o.name)}</a>`).join("\n    ")}
  </div>
</div></section>`;

  const jsonld = [
    {
      "@context": "https://schema.org",
      "@type": "Florist",
      name: cfg.businessName,
      image: cfg.orderUrl,
      telephone: cfg.phone,
      url: canonical,
      priceRange: "££",
      address: {
        "@type": "PostalAddress",
        streetAddress: cfg.addressStreet,
        addressLocality: cfg.addressLocality,
        addressRegion: cfg.addressRegion,
        postalCode: cfg.addressPostcode,
        addressCountry: "GB",
      },
      areaServed: { "@type": "Place", name: `${area.name}, ${area.postcodes}` },
      makesOffer: occ.bouquets.map((b) => ({ "@type": "Offer", itemOffered: { "@type": "Product", name: `${b} — ${occ.name}` } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: occ.faqs.map(([q, a]) => ({
        "@type": "Question",
        name: fill(q, area),
        acceptedAnswer: { "@type": "Answer", text: fill(a, area) },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${cfg.siteUrl}/index.html` },
        { "@type": "ListItem", position: 2, name: occ.name, item: `${cfg.siteUrl}/${occ.slug}/` },
        { "@type": "ListItem", position: 3, name: area.name, item: canonical },
      ],
    },
  ];

  return page({ title, description, canonical, body, jsonld });
}

// --- hub / index page ------------------------------------------------------

function buildIndex() {
  const body = `
<header class="hero">
  <span class="blob" style="width:250px;height:250px;background:var(--pink);top:-70px;right:-50px"></span>
  <span class="blob" style="width:160px;height:160px;background:var(--cyan);bottom:-60px;left:6%"></span>
  <span class="blob" style="width:100px;height:100px;background:var(--yellow);top:30px;right:24%"></span>
  <div class="wrap">
  <p class="eyebrow">Blackpool &amp; the Fylde coast</p>
  <h1>Flowers with attitude,<br>delivered same-day</h1>
  <p class="lede">${esc(cfg.tagline)} on ${esc(cfg.addressStreet)}. Bright, bold, hand-tied bouquets for every occasion. ${esc(cfg.slogan)}</p>
  <div class="cta-row">
    <a class="btn btn-primary" href="${esc(cfg.orderUrl)}">Order online</a>
    <a class="btn btn-ghost" href="tel:${esc(cfg.phoneLink)}">Call ${esc(cfg.phone)}</a>
  </div>
</div></header>
${occasions
  .map(
    (occ) => `<section><div class="wrap">
  <h2>${esc(occ.name)}</h2>
  <div class="chips">
    ${areas.map((a) => `<a class="chip" href="${esc(url(occ, a))}">${esc(a.name)}</a>`).join("\n    ")}
  </div>
</div></section>`
  )
  .join("\n")}`;

  const jsonld = [
    {
      "@context": "https://schema.org",
      "@type": "Florist",
      name: cfg.businessName,
      telephone: cfg.phone,
      url: `${cfg.siteUrl}/index.html`,
      priceRange: "££",
      address: {
        "@type": "PostalAddress",
        streetAddress: cfg.addressStreet,
        addressLocality: cfg.addressLocality,
        addressRegion: cfg.addressRegion,
        postalCode: cfg.addressPostcode,
        addressCountry: "GB",
      },
    },
  ];

  return page({
    title: `${cfg.businessName} — Flower Delivery in Blackpool & the Fylde Coast`,
    description: `Local Blackpool florist on ${cfg.addressStreet}. Same-day hand-tied flowers delivered across Blackpool, Cleveleys, Poulton, Lytham St Annes and more. Order online or call ${cfg.phone}.`,
    canonical: `${cfg.siteUrl}/index.html`,
    body,
    jsonld,
  });
}

// --- write everything ------------------------------------------------------

function writeFile(rel, content) {
  const full = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

fs.rmSync(OUT, { recursive: true, force: true });

const urls = [`${cfg.siteUrl}/index.html`];
let count = 0;
for (const occ of occasions) {
  for (const area of areas) {
    writeFile(`${occ.slug}/${area.slug}.html`, buildPage(occ, area));
    urls.push(url(occ, area));
    count++;
  }
}
writeFile("index.html", buildIndex());

// sitemap + robots
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(u)}</loc><changefreq>weekly</changefreq></url>`).join("\n")}
</urlset>`;
writeFile("sitemap.xml", sitemap);
writeFile("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${cfg.siteUrl}/sitemap.xml\n`);

console.log(`✓ Generated ${count} landing pages + index across ${occasions.length} occasions × ${areas.length} areas`);
console.log(`✓ sitemap.xml (${urls.length} urls) + robots.txt`);
console.log(`→ Output: landing-pages/dist/`);
