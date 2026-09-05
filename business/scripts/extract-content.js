#!/usr/bin/env node
/**
 * Content extraction engine.
 *
 * Mines skills/<name>/SKILL.md for the structures that repurpose well:
 *   - Common Rationalizations (a "lie -> reality" table)  -> highest share value
 *   - Red Flags (a bullet list)                           -> checklist / carousel value
 *
 * Output: business/content/atoms.json — one record per skill, plus a flat
 * list of individually publishable atoms with stable ids.
 *
 * Usage: node business/scripts/extract-content.js [--report]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SKILLS_DIR = path.join(ROOT, 'skills');
const OUT_DIR = path.join(ROOT, 'business', 'content');

/** Pull the body of a `## <heading>` section, stopping at the next `## `. */
function section(md, heading) {
  const lines = md.split('\n');
  const start = lines.findIndex((l) => l.trim() === `## ${heading}`);
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.startsWith('## '));
  return (end === -1 ? rest : rest.slice(0, end)).join('\n').trim();
}

/** Parse a two-column markdown table into {left, right} rows. */
function parseTable(body) {
  if (!body) return [];
  const rows = body
    .split('\n')
    .filter((l) => l.trim().startsWith('|'))
    .map((l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()))
    .filter((cells) => cells.length >= 2);

  // Everything at or above the |---|---| separator is header, whatever it's
  // called. Matching header text by keyword ("Rationalization") silently let a
  // row through the moment one skill titled its column "Excuse" instead —
  // cutting at the separator is immune to whatever word the next skill picks.
  const separator = rows.findIndex((cells) => /^:?-{2,}:?$/.test(cells[0].trim()));
  const dataRows = separator === -1 ? rows : rows.slice(separator + 1);

  return dataRows.map(([left, right]) => ({ left, right }));
}

/** Parse a `- ` bullet list into plain strings. */
function parseBullets(body) {
  if (!body) return [];
  return body
    .split('\n')
    .filter((l) => /^\s*-\s+/.test(l))
    .map((l) => l.replace(/^\s*-\s+/, '').trim())
    .filter(Boolean);
}

/** Read `name:` / `description:` out of YAML frontmatter. */
function frontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return out;
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

function extract() {
  const skills = fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const records = [];
  const atoms = [];

  for (const name of skills) {
    const file = path.join(SKILLS_DIR, name, 'SKILL.md');
    if (!fs.existsSync(file)) continue;
    const md = fs.readFileSync(file, 'utf8');
    const fm = frontmatter(md);

    const rationalizations = parseTable(section(md, 'Common Rationalizations'));
    const redFlags = parseBullets(section(md, 'Red Flags'));
    const overview = (section(md, 'Overview') || '').split('\n\n')[0].trim();

    records.push({
      skill: name,
      description: fm.description || '',
      overview,
      words: md.split(/\s+/).length,
      rationalizations,
      redFlags,
    });

    rationalizations.forEach((r, i) => {
      atoms.push({
        id: `${name}--rationalization-${i + 1}`,
        skill: name,
        type: 'rationalization',
        // The share-ready unit: the lie, then the correction.
        hook: r.left,
        payoff: r.right,
        chars: r.left.length + r.right.length,
      });
    });

    redFlags.forEach((f, i) => {
      atoms.push({
        id: `${name}--red-flag-${i + 1}`,
        skill: name,
        type: 'red-flag',
        hook: f,
        payoff: '',
        chars: f.length,
      });
    });
  }

  return { generatedAt: new Date().toISOString(), skillCount: records.length, records, atoms };
}

function main() {
  const data = extract();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'atoms.json'), JSON.stringify(data, null, 2) + '\n');

  const rationalizations = data.atoms.filter((a) => a.type === 'rationalization').length;
  const redFlags = data.atoms.filter((a) => a.type === 'red-flag').length;

  console.log(`skills scanned      ${data.skillCount}`);
  console.log(`rationalizations    ${rationalizations}`);
  console.log(`red flags           ${redFlags}`);
  console.log(`total atoms         ${data.atoms.length}`);

  if (process.argv.includes('--report')) {
    console.log('\nper-skill coverage (rationalizations / red flags):');
    for (const r of data.records) {
      const gap = r.rationalizations.length === 0 || r.redFlags.length === 0 ? '  <- GAP' : '';
      console.log(
        `  ${r.skill.padEnd(32)} ${String(r.rationalizations.length).padStart(2)} / ${String(r.redFlags.length).padStart(2)}${gap}`
      );
    }
  }
}

if (require.main === module) main();
module.exports = { extract, section, parseTable, parseBullets };
