#!/usr/bin/env node
/**
 * Rationalization clustering.
 *
 * Groups rationalizations by the SHAPE of the argument being made, not by topic.
 * Rules are keyword-based and deliberately explicit so any number this produces
 * can be audited against the source line that generated it.
 *
 * This is judgment encoded as rules, not an objective algorithm — an atom can
 * match more than one cluster, and `--audit` prints every membership so the
 * classification can be checked by hand before anything built on it ships.
 *
 * Usage: node business/scripts/cluster-rationalizations.js [--audit]
 */

const path = require('path');
const fs = require('fs');

const ATOMS = path.resolve(__dirname, '..', 'content', 'atoms.json');

// Each cluster: the argument being made, and the patterns that identify it.
const CLUSTERS = [
  {
    id: 'deferral',
    label: 'Not now',
    claim: 'The work is worth doing, just not yet.',
    // "might be useful later" / "might need it later" are speculative RETENTION,
    // not deferral of work — opposite shape, so they are excluded explicitly.
    test: (h) =>
      /\blater\b|\bafter\b|\bonce we\b|\bwhen we have time\b|\bat release time\b|\bwhen .* stabilize|\bnext commit\b/i.test(h) &&
      !/\bmight (be useful|need)\b/i.test(h),
  },
  {
    id: 'false-proxy',
    label: 'Technically true',
    claim: 'A real signal is treated as proof of something it does not actually cover.',
    test: (h) => /\btests? pass\b|\bpassed\b|\bworks on my machine\b|\bfast on my machine\b|\bin staging\b|\bself-documenting\b|\bself-explanatory\b|\bit works\b|\bis enough\b|\bguarantees\b|\bthe audit\b/i.test(h),
  },
  {
    id: 'ceremony',
    label: 'Costs more than it returns',
    claim: 'The practice is overhead — too slow, too expensive, not worth it.',
    test: (h) => /\boverkill\b|\boverhead\b|\btoo slow\b|\bslow me down\b|\bslow us down\b|\btoo expensive\b|\bis expensive\b|\bwastes?\b|\bnice-to-have\b/i.test(h),
  },
  {
    id: 'triviality',
    label: 'Too small to matter',
    claim: 'This particular case is below the threshold where the rule applies.',
    test: (h) => /\btoo simple\b|\bthis is simple\b|\btrivial\b|\bsmall\b|\bjust a\b|\bjust rename\b|\bone line\b|\bobvious\b|\bdon't need a spec\b|\btoo small\b/i.test(h),
  },
  {
    id: 'confidence',
    label: 'I already know',
    claim: 'Verification is unnecessary because the answer is already known.',
    test: (h) => /\bI'm confident\b|\bI know\b|\bI wrote it\b|\bin my head\b|\bmental model\b|\bclear enough\b|\bI get it\b|\bno need to (check|re-measure)\b|\bwe're done\b|\bmust have had a reason\b/i.test(h),
  },
  {
    id: 'delegation',
    label: 'Someone else handles it',
    claim: 'Responsibility belongs to another system, team, or party.',
    test: (h) => /\bframework handles\b|\blegal's problem\b|\bon their own\b|\bshould figure (it )?out\b|\bnobody would\b|\bno one would\b|\bnobody uses\b|\bnobody reads\b/i.test(h),
  },
];

function unquote(s) {
  return s.replace(/^["'‘“]|["'’”]$/g, '').trim();
}

function main() {
  const data = JSON.parse(fs.readFileSync(ATOMS, 'utf8'));
  const rationalizations = data.atoms.filter((a) => a.type === 'rationalization');

  const results = CLUSTERS.map((c) => {
    const members = rationalizations.filter((a) => c.test(unquote(a.hook)));
    return {
      id: c.id,
      label: c.label,
      claim: c.claim,
      count: members.length,
      skills: [...new Set(members.map((m) => m.skill))].sort(),
      members,
    };
  }).sort((a, b) => b.count - a.count);

  const classified = new Set();
  for (const r of results) for (const m of r.members) classified.add(m.id);
  const unclassified = rationalizations.filter((a) => !classified.has(a.id));

  console.log(`total rationalizations   ${rationalizations.length}`);
  console.log(`matched at least one     ${classified.size}`);
  console.log(`unmatched                ${unclassified.length}\n`);
  console.log('cluster                        n   skills');
  for (const r of results) {
    console.log(
      `  ${r.label.padEnd(28)} ${String(r.count).padStart(3)}   ${String(r.skills.length).padStart(2)}/${data.skillCount}`
    );
  }

  if (process.argv.includes('--audit')) {
    for (const r of results) {
      console.log(`\n=== ${r.label} (${r.count}) — ${r.claim}`);
      r.members.forEach((m) => console.log(`   [${m.skill}] ${m.hook}`));
    }
    console.log(`\n=== UNMATCHED (${unclassified.length})`);
    unclassified.forEach((m) => console.log(`   [${m.skill}] ${m.hook}`));
  }

  fs.writeFileSync(
    path.resolve(__dirname, '..', 'content', 'clusters.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        total: rationalizations.length,
        clusters: results.map(({ members, ...rest }) => ({ ...rest, memberIds: members.map((m) => m.id) })),
        unclassified: unclassified.map((u) => u.id),
      },
      null,
      2
    ) + '\n'
  );
}

if (require.main === module) main();
