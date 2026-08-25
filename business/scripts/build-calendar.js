#!/usr/bin/env node
/**
 * Distribution calendar builder.
 *
 * Sequences extracted atoms into a dated publishing schedule. Two rules drive
 * the ordering, both aimed at retention rather than raw volume:
 *
 *   1. Rotate skills. Never two consecutive days from the same skill — a feed
 *      that hammers one topic reads as a bot and burns the follow.
 *   2. Lead with rationalizations. The "lie -> reality" format carries a built-in
 *      hook; red flags backfill the days rationalizations can't cover.
 *
 * Weekly cadence assumed: 5 short posts (Mon-Fri) + 1 newsletter issue (Tue).
 *
 * Usage: node business/scripts/build-calendar.js [--weeks N] [--start YYYY-MM-DD]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const CONTENT_DIR = path.join(ROOT, 'business', 'content');
const ATOMS = path.join(CONTENT_DIR, 'atoms.json');

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

/** Round-robin across skills so no two adjacent slots share a skill. */
function interleave(atoms) {
  const bySkill = new Map();
  for (const a of atoms) {
    if (!bySkill.has(a.skill)) bySkill.set(a.skill, []);
    bySkill.get(a.skill).push(a);
  }
  // Largest buckets first, so the deepest skills don't bunch up at the tail.
  const queues = [...bySkill.values()].sort((x, y) => y.length - x.length);
  const out = [];
  let drained = false;
  while (!drained) {
    drained = true;
    for (const q of queues) {
      if (q.length) {
        out.push(q.shift());
        drained = false;
      }
    }
  }
  return out;
}

function weekdays(startISO, count) {
  const days = [];
  const d = new Date(startISO + 'T00:00:00Z');
  while (days.length < count) {
    const dow = d.getUTCDay();
    if (dow >= 1 && dow <= 5) days.push(new Date(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return days;
}

function iso(d) {
  return d.toISOString().slice(0, 10);
}

function main() {
  if (!fs.existsSync(ATOMS)) {
    console.error('atoms.json missing — run: node business/scripts/extract-content.js');
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(ATOMS, 'utf8'));
  const weeks = parseInt(arg('--weeks', '12'), 10);
  const start = arg('--start', new Date().toISOString().slice(0, 10));

  // Rationalizations first (stronger hook), then red flags as backfill.
  const ordered = [
    ...interleave(data.atoms.filter((a) => a.type === 'rationalization')),
    ...interleave(data.atoms.filter((a) => a.type === 'red-flag')),
  ];

  const slots = weeks * 5;
  const days = weekdays(start, slots);
  const schedule = [];
  let last = null;

  const pool = [...ordered];
  for (const day of days) {
    // Enforce the no-repeat-skill rule by looking ahead for the first
    // atom from a different skill than yesterday's.
    let idx = pool.findIndex((a) => a.skill !== last);
    if (idx === -1) idx = 0;
    const atom = pool.splice(idx, 1)[0];
    if (!atom) break;
    last = atom.skill;
    schedule.push({ date: iso(day), ...atom });
  }

  const out = {
    generatedAt: new Date().toISOString(),
    start,
    weeks,
    postsScheduled: schedule.length,
    atomsRemaining: pool.length,
    schedule,
  };
  fs.writeFileSync(path.join(CONTENT_DIR, 'calendar.json'), JSON.stringify(out, null, 2) + '\n');

  // Human-readable companion so the calendar is reviewable without tooling.
  const lines = [
    '# Distribution Calendar',
    '',
    `Generated ${out.generatedAt.slice(0, 10)} · ${schedule.length} posts · ${pool.length} atoms held in reserve`,
    '',
    'Status legend: `[ ]` drafted, not approved · `[x]` approved to publish',
    '',
    '| Date | Skill | Type | Hook | Status |',
    '|---|---|---|---|---|',
    ...schedule.map(
      (s) =>
        `| ${s.date} | ${s.skill} | ${s.type} | ${s.hook.replace(/\|/g, '\\|').slice(0, 90)} | [ ] |`
    ),
  ];
  fs.writeFileSync(path.join(CONTENT_DIR, 'calendar.md'), lines.join('\n') + '\n');

  console.log(`scheduled  ${schedule.length} posts over ${weeks} weeks (from ${start})`);
  console.log(`reserve    ${pool.length} atoms unscheduled`);
  const runway = Math.floor(data.atoms.length / 5);
  console.log(`runway     ~${runway} weeks of weekday posting from existing content`);
}

if (require.main === module) main();
