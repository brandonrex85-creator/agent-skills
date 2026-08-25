# STATE

Operating state for the content business. Read this first every session.
Keep it short — detail belongs in `journal/`.

_Last updated: 2026-08-25 (run 002)_

---

## What this business is

A content business built on the `agent-skills` library: 24 production-grade
engineering skills (~45k words) covering the full software lifecycle. The library
is the product and the raw material; the business is turning it into audience,
then revenue.

**Positioning:** practical engineering discipline for people shipping with AI coding
agents. Not AI hype, not generic dev advice — specific, opinionated process.

## Assets

| Asset | State |
|---|---|
| 24 skills, ~45k words | Exists, high quality, **undistributed** |
| 4 agent personas, 8 commands, 7 checklists | Exists, supporting material |
| 362 extracted content atoms | Built run 001 — `content/atoms.json` |
| 12-week distribution calendar | Built run 001 — `content/calendar.md` |
| Newsletter issue 001 | Drafted, brand voice, **awaiting approval** |
| 60 social posts (X + LinkedIn) | Built run 002 — `content/social/posts.md` |
| Landing page copy | Drafted run 002, **awaiting approval** |

## Key numbers

- **362** publishable content atoms extracted from existing material
- **~72 weeks** of weekday posting runway, zero new writing required
- **153** rationalizations / **209** red flags across the library
- Audience: **0** — no list, no channel, no distribution surface yet

## The strategic finding (run 001)

The bottleneck is not content production. It is distribution.

There is enough written material for ~17 months of daily posting, and no channel to
post it to. Every hour spent writing new content before a channel exists is an hour
spent widening a surplus. **Until a channel exists, distribution beats production.**

## Decisions made (run 002)

- **Channel: newsletter + one social.** Newsletter is the owned asset; social is the
  discovery funnel. Both X and LinkedIn formats are generated, so the specific social
  platform stays cheap to pick late.
- **Byline: brand / publication name.** Editorial voice, no personhood claim. Raises
  throughput — drafting and staging no longer carry impersonation risk.

## Blocked on human decision

See `inbox/` for detail:

1. **Publication name.** Working name `The Later Tax`, set in `brand.json`. Three
   candidates written up; changing it is a one-line edit plus a re-run.
2. **Account creation.** Newsletter platform and social account. I won't create
   accounts unattended — closest thing to irreversible in this workflow.
3. **Publishing approval.** Issue 001, the landing page, and 60 queued social posts are
   drafted and cannot go out without sign-off. Issue 001 also needs a CTA choice.

## Next actions (priority order)

1. Get accounts created and the name picked — the only remaining hard blockers
2. On approval: publish landing page, send issue 001, start the 60-post calendar
3. Draft issues 002–004 (002 is scoped: the "technically true" cluster, 134 atoms
   unanalyzed)
4. Instrument: without subscriber and open-rate numbers, every later decision is a guess
5. Monetization: hold until audience > 0. No offers to an empty room.

## Guardrails in force

- No spending, contracts, or irreversible actions without explicit approval
- No outbound messages to real people; no impersonating a human
- Draft and stage everything; humans press send
- All work lives under `business/` on branch `claude/content-business-ceo-qnasf6`
