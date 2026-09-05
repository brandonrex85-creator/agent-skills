# business/

Operating workspace for the content business built on this skill library.

Namespaced under `business/` deliberately: the skill library is an open-source
project with its own conventions, and business operations should not leak into it.
Nothing here modifies `skills/`, `agents/`, `commands/`, or `references/`.

## Layout

```
STATE.md              → current operating state. Read first, every session.
journal/              → one file per run. What was done, verified, and why.
inbox/                → human drops decisions and requests here. Read at session start.
content/
  atoms.json          → derived: extracted publishable units
  calendar.json/.md   → derived: dated publishing schedule
  drafts/             → written content awaiting approval
scripts/
  extract-content.js  → mines skills/ for rationalizations + red flags
  build-calendar.js   → sequences atoms into a rotation-balanced schedule
```

## Regenerating derived content

Both scripts are pure functions of `skills/`. Safe to re-run any time; re-run after
any skill changes:

```bash
node business/scripts/extract-content.js --report      # rebuild atoms.json + coverage report
node business/scripts/build-calendar.js --weeks 12     # rebuild the calendar
```

## Rules

- Drafts are drafts. Nothing publishes without explicit human approval.
- Every statistic in published content is verified against source before it ships.
- Each run updates `STATE.md` and adds a `journal/` entry before finishing.
