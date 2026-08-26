#!/usr/bin/env node
/**
 * Slide renderer — carousel definitions to Instagram-ready PNGs.
 *
 * Renders each slide at 1080x1350 (4:5), which occupies more vertical feed
 * space than square and is the strongest default for carousels.
 *
 * Design constraints driving the layout:
 *   - Legible at thumbnail size. Feed scroll is the first filter, so the cover
 *     slide's headline is set large enough to read at ~150px wide.
 *   - The lie and the correction must be visually distinct. Colour and scale
 *     carry that split, not a label.
 *   - No text within 60px of any edge: Instagram crops previews unpredictably.
 *
 * Usage: node business/scripts/render-slides.js [--carousel <id>] [--limit N]
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const CONTENT = path.join(ROOT, 'business', 'content');
const IG = path.join(CONTENT, 'instagram');
const FONT = path.join(ROOT, 'business', 'assets', 'fonts', 'InterVariable.woff2');

const W = 1080;
const H = 1350;

const C = {
  bg: '#0B0E14',
  bgAlt: '#11151F',
  ink: '#F2F5F9',
  muted: '#8A94A6',
  accent: '#FFB020', // the lie — warm, draws the eye first
  rule: '#232A38',
};

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Scale the headline down as it gets longer, so long lies still fit the box. */
function fitSize(text, base, min, perChar) {
  return Math.max(min, Math.round(base - text.length * perChar));
}

function slideHTML(slide, ctx, fontDataUri) {
  const chrome = `
    <div class="brand">${esc(ctx.brand)}</div>
    <div class="pager">${ctx.index + 1} / ${ctx.total}</div>`;

  let body;
  if (slide.kind === 'cover') {
    const size = fitSize(slide.title, 108, 62, 0.9);
    body = `
      <div class="stack">
        <div class="kicker">${esc(slide.kicker)}</div>
        <h1 style="font-size:${size}px">${esc(slide.title)}</h1>
        <div class="sub">${esc(slide.subtitle)}</div>
      </div>
      <div class="swipe">swipe →</div>`;
  } else if (slide.kind === 'atom') {
    const size = fitSize(slide.lie, 86, 46, 0.55);
    body = `
      <div class="stack">
        <div class="label">The excuse</div>
        <div class="lie" style="font-size:${size}px">&ldquo;${esc(slide.lie)}&rdquo;</div>
        <div class="rule"></div>
        <div class="label">What's actually true</div>
        <div class="reality">${esc(slide.reality)}</div>
      </div>
      <div class="source">${esc(slide.source)}</div>`;
  } else {
    body = `
      <div class="stack">
        <div class="kicker">${esc(ctx.brand)}</div>
        <h1 style="font-size:96px">${esc(slide.title)}</h1>
        <div class="sub">${esc(slide.subtitle)}</div>
        <div class="cta">${esc(slide.action)}</div>
      </div>`;
  }

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:'Inter';src:url(${fontDataUri}) format('woff2');
      font-weight:100 900;font-display:block}
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:${W}px;height:${H}px}
    body{
      background:${slide.kind === 'atom' ? C.bg : C.bgAlt};
      color:${C.ink};
      font-family:'Inter',system-ui,sans-serif;
      font-feature-settings:'ss01','cv05';
      padding:88px 76px;
      display:flex;flex-direction:column;justify-content:space-between;
      -webkit-font-smoothing:antialiased;
    }
    .brand{position:absolute;top:60px;left:76px;font-size:26px;font-weight:700;
      letter-spacing:-0.01em;color:${C.muted}}
    .pager{position:absolute;top:60px;right:76px;font-size:24px;font-weight:600;
      color:${C.muted};font-variant-numeric:tabular-nums}
    .stack{margin-top:40px;flex:1;display:flex;flex-direction:column;justify-content:center}
    .kicker{font-size:30px;font-weight:700;color:${C.accent};letter-spacing:0.06em;
      text-transform:uppercase;margin-bottom:34px}
    h1{font-weight:800;line-height:1.04;letter-spacing:-0.035em}
    .sub{margin-top:38px;font-size:40px;line-height:1.35;color:${C.muted};font-weight:400;max-width:88%}
    .label{font-size:24px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;
      color:${C.muted};margin-bottom:26px}
    .lie{font-weight:800;line-height:1.1;letter-spacing:-0.03em;color:${C.accent}}
    .rule{height:2px;background:${C.rule};margin:56px 0 44px}
    .reality{font-size:42px;line-height:1.4;font-weight:400;color:${C.ink}}
    .source{font-size:24px;color:${C.muted};font-weight:600;letter-spacing:0.02em}
    .swipe{font-size:30px;color:${C.muted};font-weight:600}
    .cta{margin-top:56px;font-size:38px;font-weight:700;color:${C.accent}}
  </style></head><body>${chrome}${body}</body></html>`;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(path.join(IG, 'carousels.json'), 'utf8'));
  const fontDataUri = `data:font/woff2;base64,${fs.readFileSync(FONT).toString('base64')}`;

  const only = process.argv.includes('--carousel')
    ? process.argv[process.argv.indexOf('--carousel') + 1]
    : null;
  const limitArg = process.argv.indexOf('--limit');
  let carousels = only ? data.carousels.filter((c) => c.id === only) : data.carousels;
  if (limitArg !== -1) carousels = carousels.slice(0, parseInt(process.argv[limitArg + 1], 10));

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

  let count = 0;
  for (const carousel of carousels) {
    const dir = path.join(IG, 'slides', carousel.id);
    fs.mkdirSync(dir, { recursive: true });
    for (const [i, slide] of carousel.slides.entries()) {
      const html = slideHTML(slide, { brand: data.brand, index: i, total: carousel.slides.length }, fontDataUri);
      await page.setContent(html, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(dir, `${String(i + 1).padStart(2, '0')}.png`) });
      count++;
    }
    console.log(`  ${carousel.id.padEnd(18)} ${carousel.slides.length} slides`);
  }
  await browser.close();
  console.log(`\nrendered ${count} slides across ${carousels.length} carousels`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
