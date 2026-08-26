#!/usr/bin/env node
/**
 * Instagram spec validator.
 *
 * Checks rendered slides against the Content Publishing API's actual limits,
 * so a rejection surfaces here rather than mid-publish. Sources for each rule
 * are recorded in content/INTEGRATION.md.
 *
 * Rules enforced:
 *   - JPEG only. The API rejects PNG outright.
 *   - <= 8MB per image.
 *   - Aspect ratio within [4:5, 1.91:1] inclusive. 1080x1350 sits exactly on
 *     the 4:5 boundary, so this compares with a small tolerance rather than a
 *     strict >, which a float comparison would fail.
 *   - <= 10 items per carousel (the API cap; the app itself allows 20).
 *   - Uniform dimensions within a carousel. Instagram crops every slide to the
 *     FIRST slide's ratio, so a mismatched slide is silently cut, not rejected.
 *
 * Usage: node business/scripts/validate-slides.js
 */

const fs = require('fs');
const path = require('path');

const IG = path.resolve(__dirname, '..', 'content', 'instagram');

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_CAROUSEL_ITEMS = 10;
const MIN_RATIO = 4 / 5;      // 0.8 portrait bound
const MAX_RATIO = 1.91;       // landscape bound
const EPS = 1e-6;

/** Read width/height from a JPEG's SOF marker. */
function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    // SOF0-SOF15, excluding DHT(c4), JPGA(c8), DAC(cc)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

function main() {
  const dir = path.join(IG, 'slides-jpeg');
  if (!fs.existsSync(dir)) {
    console.error('slides-jpeg/ missing — run render-slides.js first');
    process.exit(1);
  }

  const failures = [];
  const carousels = fs.readdirSync(dir).filter((d) => fs.statSync(path.join(dir, d)).isDirectory()).sort();
  let checked = 0;

  for (const id of carousels) {
    const files = fs.readdirSync(path.join(dir, id)).filter((f) => f.endsWith('.jpg')).sort();

    if (files.length > MAX_CAROUSEL_ITEMS) {
      failures.push(`${id}: ${files.length} items exceeds the API cap of ${MAX_CAROUSEL_ITEMS}`);
    }

    let first = null;
    for (const f of files) {
      const p = path.join(dir, id, f);
      const buf = fs.readFileSync(p);
      checked++;

      if (buf[0] !== 0xff || buf[1] !== 0xd8) {
        failures.push(`${id}/${f}: not a JPEG (the API rejects PNG)`);
        continue;
      }
      if (buf.length > MAX_BYTES) {
        failures.push(`${id}/${f}: ${(buf.length / 1e6).toFixed(1)}MB exceeds the 8MB cap`);
      }

      const size = jpegSize(buf);
      if (!size) {
        failures.push(`${id}/${f}: could not read dimensions`);
        continue;
      }
      const ratio = size.width / size.height;
      if (ratio < MIN_RATIO - EPS || ratio > MAX_RATIO + EPS) {
        failures.push(`${id}/${f}: ratio ${ratio.toFixed(3)} outside [${MIN_RATIO}, ${MAX_RATIO}]`);
      }

      if (!first) first = size;
      else if (size.width !== first.width || size.height !== first.height) {
        failures.push(
          `${id}/${f}: ${size.width}x${size.height} differs from slide 1 (${first.width}x${first.height}) — Instagram will crop it to match`
        );
      }
    }
  }

  console.log(`carousels   ${carousels.length}`);
  console.log(`images      ${checked}`);
  console.log(`failures    ${failures.length}`);
  if (failures.length) {
    console.log('');
    failures.forEach((f) => console.log(`  FAIL  ${f}`));
    process.exit(1);
  }
  console.log('\nall slides pass Instagram Content Publishing API specs');
}

if (require.main === module) main();
