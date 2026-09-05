---
issue: 001
title: "The Later Tax"
subtitle: "17 of 25 engineering disciplines independently name the same failure mode"
status: DRAFT — awaiting human approval before send
byline: brand (editorial voice, no personhood claim)
brand: The Later Tax (working name — see business/brand.json)
audience: engineers and eng leaders using AI coding agents
target_length: 900 words
cta: primary
---

# The Later Tax

We did something tedious last week so you don't have to.

We took 25 engineering disciplines — testing, security, API design, CI, observability,
migrations, performance, code review, the whole lifecycle — and pulled out every
excuse practitioners actually make. Not strawmen. The real ones, the ones that sound
reasonable in the moment. 163 of them.

Then we looked for overlap.

We expected the disciplines to fail in their own distinctive ways. Security fails at
threat modeling. Performance fails at measurement. Testing fails at coverage. Different
problems, different fixes.

That's not what the data says.

**17 of the 25 disciplines — 68% — independently name the same failure mode as a top
rationalization. Not a related one. The same one.**

It's the word *later*.

> "We'll document the API later."
> "We'll add CI later."
> "We'll clean it up later."
> "We'll make it responsive later."
> "We'll optimize later."
> "I'll write tests after the code works."

Six different disciplines. One sentence with the nouns swapped.

## Why this is more interesting than it looks

Any single one of those is defensible. That's the whole problem. Deferring API docs to
ship a demo is a reasonable trade. Deferring CI on a two-day spike is reasonable. Taken
one at a time, each deferral is a small, rational, locally-optimal call.

The failure isn't in any one decision. It's that seventeen separate disciplines each offer
you a locally-optimal reason to defer, and nothing in your process is counting the total.

You don't take on the later tax in one decision. You take it on in seventeen, each one
looking sensible, over a quarter — and then you spend the following quarter paying it
without ever having decided to.

## The correction isn't "never defer"

This is where most advice goes wrong and gets ignored for it. "Always write tests
first" loses to a real deadline every time, and should.

The disciplines that handle deferral well don't ban it. They make it *cost something at
the moment you choose it*. Three patterns showed up repeatedly:

**1. Deferral gets a name and a place.** Not a mental note. A ticket, a TODO with an
owner, a line in the ADR. The rule isn't "don't defer" — it's "an undocumented deferral
didn't happen." Undocumented deferrals are the ones that compound, because nothing in the
system knows they exist.

**2. Some things are cheaper now than they will ever be again.** A few deferrals aren't
loans, they're purchases at a markup. Retrofitting responsive design runs about 3x the
cost of building it in. Tests written after the fact test the implementation you wrote,
not the behavior you wanted — so you get a suite that locks in your bugs. Types written
after the API is public can't change the API. The tell: if deferring changes *what you're
able to build later*, it isn't a schedule decision, it's an architecture decision wearing
a schedule decision's clothes.

**3. The cheapest gate is the one that runs without you.** Most of the seventeen are things
a pipeline can refuse to merge — test coverage, dependency and secret scans, bundle-size
budgets, lint, type checks, visual regression. That converts "we'll do it later" from a
promise into a build failure, which is the only form of accountability that survives a
busy week.

## What to actually do this week

Not a process overhaul. One meeting, 30 minutes:

Get your team to list every "we'll do that later" currently outstanding. Just the list.
No fixing, no prioritizing, no defending.

The number itself is the finding. Most teams guess four or five and land somewhere north
of twenty. The exercise works because the deferrals were never wrong individually — they
were only ever invisible collectively. You can't decide about a total you've never seen.

Then sort them once, into two piles: *loans* (genuinely cheaper to do later, or maybe
never) and *purchases at a markup* (getting more expensive every week you wait).

Most teams find the second pile is smaller than they feared and more urgent than they
thought. That's a good outcome. It means you have three real problems instead of twenty
vague ones.

## The uncomfortable part

The disciplines didn't coordinate. Seventeen separate bodies of practice, written by people
solving unrelated problems, each independently concluded that their number one enemy is a
reasonable-sounding postponement.

When seventeen independent observers converge on one answer, the thing they're describing is
usually not a discipline problem.

It's a default. And defaults only change when something makes them expensive.

---

*Next issue: we ran the same analysis on the other 143 rationalizations. The strangest
cluster isn't the excuses that are wrong — it's the ones that are completely true.*

---

**[CTA — needs human decision before send. Options:]**
- A) Soft: link to the open-source skill library the analysis came from
- B) Direct: subscribe for the weekly breakdown
- C) None for issue 001 — build trust first, monetize from issue 004+

Recommendation: **C**. Issue 001 should earn the second open, not convert. A first issue
with a pitch trains readers that this is a funnel; one without trains them that it's
worth reading. The ask lands better at issue 4 against an audience that's still there.
