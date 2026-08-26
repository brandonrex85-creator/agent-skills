#!/usr/bin/env node
/**
 * Instagram carousel builder.
 *
 * Instagram is visual and has no clickable links in captions, so the X/LinkedIn
 * approach (one text atom per post, link to the issue) does not transfer. Two
 * changes follow from that:
 *
 *   1. Post themed CAROUSELS, not single atoms. A cluster is already a theme —
 *      "six excuses that are technically true" is a stronger unit than six
 *      unrelated posts, and carousels get saved and re-shared, which single
 *      text cards do not.
 *   2. Every CTA routes to link-in-bio. Nothing else is clickable.
 *
 * Emits carousel definitions (slide copy + caption + hashtags). Rendering to
 * images is handled by render-slides.js.
 *
 * Usage: node business/scripts/build-instagram.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const CONTENT = path.join(ROOT, 'business', 'content');
const OUT = path.join(CONTENT, 'instagram');

// Instagram allows 20, but engagement drops off well before that and every
// extra slide is another thing to design. 8 keeps a carousel skimmable.
const MAX_BODY_SLIDES = 6;
const CAPTION_MAX = 2200;

const HASHTAGS = [
  '#softwareengineering',
  '#codequality',
  '#devlife',
  '#programming',
  '#techdebt',
];

function unquote(s) {
  return s.replace(/^["'‘“]|["'’”]$/g, '').trim();
}

function loadJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/** Cluster -> the headline that opens its carousel. */
const CAROUSEL_TITLES = {
  deferral: 'Every "we\'ll do it later" is a loan',
  'false-proxy': 'The excuses that are completely true',
  ceremony: '"That\'s overhead" — is it though?',
  triviality: '"It\'s too small to matter"',
  confidence: '"I already know"',
  delegation: '"Someone else handles that"',
};

const CAROUSEL_SUBTITLES = {
  deferral: 'Nobody is tracking the balance',
  'false-proxy': 'And still wrong. That\'s what makes them hard to argue with.',
  ceremony: 'Sometimes yes. Usually not for the reason given.',
  triviality: 'The threshold nobody defined',
  confidence: 'Confidence is not a verification method',
  delegation: 'The framework does not, in fact, handle it',
};

function buildCaption(cluster, brand, count, skills, part, totalParts) {
  // First ~125 chars are all that shows before "...more" — front-load the hook.
  const hook = `${CAROUSEL_TITLES[cluster.id]}\n\n`;
  // Parts of the same cluster must not share a caption — duplicate text across
  // posts reads as spam and gives a returning reader nothing new.
  const opener =
    totalParts > 1 && part > 1
      ? `More from the same cluster. ${count} of the 153 excuses we catalogued share this shape.`
      : `We catalogued 153 excuses engineers actually make, across 24 engineering disciplines.`;
  const middle =
    totalParts > 1 && part > 1
      ? `Part ${part} of ${totalParts}. Earlier parts are on the profile.`
      : `${count} of them share this exact shape — and they show up in ${skills} separate disciplines that never coordinated with each other.`;

  const body = [
    opener,
    ``,
    middle,
    ``,
    `Swipe for the ones we found. 👉`,
    ``,
    `Full breakdown in the newsletter — link in bio.`,
    ``,
    HASHTAGS.join(' '),
  ].join('\n');

  const caption = hook + body;
  return caption.length <= CAPTION_MAX ? caption : caption.slice(0, CAPTION_MAX - 1);
}

function main() {
  const atoms = loadJSON(path.join(CONTENT, 'atoms.json'));
  const clusters = loadJSON(path.join(CONTENT, 'clusters.json'));
  const brand = loadJSON(path.join(ROOT, 'business', 'brand.json'));

  const byId = new Map(atoms.atoms.map((a) => [a.id, a]));
  const carousels = [];

  for (const cluster of clusters.clusters) {
    const members = cluster.memberIds.map((id) => byId.get(id)).filter(Boolean);
    // Chunk large clusters so no carousel runs past the skimmable limit.
    // Build the surviving chunks first: a trailing chunk too thin to publish
    // must not be counted in "Part N of M", or the numbering promises a post
    // that never ships.
    const chunks = [];
    for (let i = 0; i < members.length; i += MAX_BODY_SLIDES) {
      const chunk = members.slice(i, i + MAX_BODY_SLIDES);
      if (chunk.length < 3) continue; // too thin to be worth a carousel
      chunks.push(chunk);
    }
    const totalParts = chunks.length;

    for (const [chunkIndex, chunk] of chunks.entries()) {
      const part = chunkIndex + 1;

      const slides = [
        {
          kind: 'cover',
          title: CAROUSEL_TITLES[cluster.id] || cluster.label,
          subtitle: CAROUSEL_SUBTITLES[cluster.id] || cluster.claim,
          kicker: totalParts > 1 ? `Part ${part} of ${totalParts}` : `${cluster.count} found`,
        },
        ...chunk.map((m) => ({
          kind: 'atom',
          lie: unquote(m.hook),
          reality: m.payoff,
          source: m.skill.replace(/-and-/g, ' & ').replace(/-/g, ' '),
        })),
        {
          kind: 'cta',
          title: 'The full analysis',
          subtitle: `153 excuses. 24 disciplines. One issue a week.`,
          action: 'Newsletter link in bio',
        },
      ];

      carousels.push({
        id: `${cluster.id}-${part}`,
        cluster: cluster.id,
        clusterLabel: cluster.label,
        part,
        totalParts,
        slideCount: slides.length,
        caption: buildCaption(cluster, brand, cluster.count, cluster.skills.length, part, totalParts),
        slides,
      });
    }
  }

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(
    path.join(OUT, 'carousels.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), brand: brand.brand, carousels }, null, 2) + '\n'
  );

  const overLimit = carousels.filter((c) => c.caption.length > CAPTION_MAX).length;
  const overSlides = carousels.filter((c) => c.slideCount > 20).length;

  console.log(`carousels        ${carousels.length}`);
  console.log(`total slides     ${carousels.reduce((n, c) => n + c.slideCount, 0)}`);
  console.log(`caption over cap ${overLimit}`);
  console.log(`slides over 20   ${overSlides}`);
  console.log('');
  for (const c of carousels) {
    console.log(`  ${c.id.padEnd(18)} ${String(c.slideCount).padStart(2)} slides  caption ${String(c.caption.length).padStart(4)}ch`);
  }
}

if (require.main === module) main();
