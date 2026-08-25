#!/usr/bin/env node
/**
 * Social post formatter.
 *
 * Turns extracted atoms into platform-ready post text. Two formats from one
 * source, so the platform decision stays cheap to defer:
 *
 *   x         — hard 280-char budget, hook on line 1, payoff after a break
 *   linkedin  — longer, framed for an eng-leader reader, no character pressure
 *
 * Posts are emitted in calendar order so the output lines up with the schedule.
 * Nothing here publishes; it writes files a human reviews and sends.
 *
 * Usage: node business/scripts/format-social.js [--limit N]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const CONTENT = path.join(ROOT, 'business', 'content');
const OUT = path.join(CONTENT, 'social');

const X_LIMIT = 280;

function loadJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/** Skill slug -> human-readable topic, for post framing. */
function topic(skill) {
  return skill.replace(/-and-/g, ' & ').replace(/-/g, ' ');
}

/** Strip the surrounding quotes the source tables use on rationalizations. */
function unquote(s) {
  return s.replace(/^["'\u2018\u201c]|["'\u2019\u201d]$/g, '').trim();
}

function formatX(atom) {
  const hook = unquote(atom.hook);
  if (atom.type === 'rationalization') {
    // The lie, then the correction. The line break is the beat.
    const body = `"${hook}"\n\n${atom.payoff}`;
    return body.length <= X_LIMIT ? body : null;
  }
  const body = `${topic(atom.skill)} — red flag:\n\n${hook}`;
  return body.length <= X_LIMIT ? body : null;
}

function formatLinkedIn(atom, brand) {
  const hook = unquote(atom.hook);
  if (atom.type === 'rationalization') {
    return [
      `"${hook}"`,
      '',
      `${atom.payoff}`,
      '',
      `One of ${brand.counts.rationalizations} rationalizations we catalogued across ${brand.counts.skills} engineering disciplines.`,
    ].join('\n');
  }
  return [
    `A red flag in ${topic(atom.skill)}:`,
    '',
    hook,
    '',
    `If you're seeing this in review, it's worth stopping on.`,
  ].join('\n');
}

function main() {
  const atomsPath = path.join(CONTENT, 'atoms.json');
  const calPath = path.join(CONTENT, 'calendar.json');
  for (const p of [atomsPath, calPath]) {
    if (!fs.existsSync(p)) {
      console.error(`missing ${path.basename(p)} — run extract-content.js and build-calendar.js first`);
      process.exit(1);
    }
  }

  const data = loadJSON(atomsPath);
  const cal = loadJSON(calPath);
  const brandCfg = loadJSON(path.join(ROOT, 'business', 'brand.json'));

  const brand = {
    name: brandCfg.brand,
    counts: {
      skills: data.skillCount,
      rationalizations: data.atoms.filter((a) => a.type === 'rationalization').length,
    },
  };

  const limitArg = process.argv.indexOf('--limit');
  const limit = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : cal.schedule.length;

  fs.mkdirSync(OUT, { recursive: true });

  const rows = [];
  let overflow = 0;

  for (const slot of cal.schedule.slice(0, limit)) {
    const x = formatX(slot);
    const li = formatLinkedIn(slot, brand);
    if (!x) overflow++;
    rows.push({ date: slot.date, id: slot.id, skill: slot.skill, type: slot.type, x, linkedin: li });
  }

  fs.writeFileSync(path.join(OUT, 'posts.json'), JSON.stringify({ brand: brand.name, posts: rows }, null, 2) + '\n');

  // Reviewable markdown — this is what a human actually reads before approving.
  const md = ['# Social posts — queued for review', '',
    `Brand: **${brand.name}** (working name) · ${rows.length} posts · ${overflow} over the ${X_LIMIT}-char X limit`,
    '', 'Nothing here is published. Approve per-post, then send manually.', '', '---', ''];
  for (const r of rows) {
    md.push(`### ${r.date} · ${r.skill} · ${r.type}`, '');
    md.push('**X**', '');
    md.push(r.x ? '```\n' + r.x + '\n```' : '_over character limit — needs a manual trim_');
    md.push('', '**LinkedIn**', '', '```\n' + r.linkedin + '\n```', '', '---', '');
  }
  fs.writeFileSync(path.join(OUT, 'posts.md'), md.join('\n'));

  console.log(`formatted   ${rows.length} posts`);
  console.log(`x-ready     ${rows.length - overflow}`);
  console.log(`over limit  ${overflow}`);
}

if (require.main === module) main();
