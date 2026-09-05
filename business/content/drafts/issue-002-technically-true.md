---
issue: 002
title: "Technically True"
subtitle: "The hardest excuses to argue with are the ones that aren't wrong"
status: DRAFT — awaiting human approval before send
byline: brand (editorial voice, no personhood claim)
brand: The Later Tax (working name — see business/brand.json)
target_length: 900 words
depends_on: issue 001 (teases this issue)
---

# Technically True

Last issue we counted 163 excuses that engineers actually make, across 25 disciplines,
and found that the largest cluster was deferral — seventeen separate disciplines
independently naming "we'll do it later" as a top failure mode.

This issue is about a smaller cluster that's harder to deal with.

Fifteen of the 163, spread across thirteen disciplines. What makes them interesting isn't
the count. It's that **every one of them is true.**

> "The tests pass, so it's good."
> "It works on my machine."
> "It works in staging, it'll work in production."
> "The audit passed, so the dependency is safe."
> "The code is self-documenting."
> "Our queue guarantees exactly-once delivery."

Read those again as factual claims. The tests did pass. It does work on that machine. The
audit did come back clean. The vendor documentation really does say exactly-once.

None of these are people fooling themselves about reality. They're people reporting
reality accurately and then drawing a conclusion it doesn't support.

## The shape of the error

Each of these takes a real signal and quietly widens what it covers.

"The audit passed" is a true statement about a specific thing: your dependencies were
matched against a database of *known, published* advisories. It says nothing about a
package that turned malicious last week, and nothing about whether its install script is
safe to execute. The signal is real. Its scope is narrow. The excuse uses it as though
its scope were "this dependency is safe."

"The tests pass" is a true statement about the assertions someone wrote down. It's silent
on architecture, on security, on whether the next person can read it. Necessary, not
sufficient — but "necessary" and "sufficient" feel identical at 5pm on a Thursday.

"The code is self-documenting" is the one people defend hardest, and it's half right. Code
does document what it does — better than a comment, which can drift. What it can't
document is *why*: which alternatives were rejected, what constraint forced this shape,
what breaks if you change it. That information was never in the code, so no amount of
clarity in the code recovers it.

The pattern underneath all fifteen: **a scope error, not a factual one.**

## Why this is worse than being wrong

A false belief is easy to attack. Show the counterexample and it collapses.

A scope error has no counterexample, because the premise is correct. When someone says
"the tests pass," you cannot say "no they don't." You have to say something much more
awkward: *yes, and that covers less than you think it does.*

That's a harder sentence to say in a review. It sounds pedantic. It sounds like you're
splitting hairs about something everyone already agreed on. So it frequently doesn't get
said, and the inference stands unchallenged — not because anyone examined it, but because
challenging it requires arguing with a sentence that is, in fact, true.

This is also why these survive contact with senior people. A senior engineer will catch a
false claim immediately. A true claim doing more work than it should sails right past,
because the first thing you check is whether the statement is accurate — and it is.

## The fix is one question

You don't need a process for this. You need a habit, and it's a single question applied
to any signal being used as a green light:

**What does this signal specifically not cover?**

Not "is this true" — it's true. What's *outside* it.

- Tests pass → doesn't cover architecture, security, readability, or anything nobody
  wrote an assertion for
- Audit clean → doesn't cover unpublished advisories, newly compromised packages, or
  install-time execution
- Works in staging → doesn't cover production data shapes, traffic, or the long tail
- Works on my machine → doesn't cover anyone else's dependency versions or config
- Types are clear → doesn't cover intent, rejected alternatives, or constraints

The useful property of that question is that it's *answerable*. Vague advice ("be more
rigorous") gives a team nothing to do. "Name what this doesn't cover" produces a specific
list in about thirty seconds, and the list is either short — in which case ship it — or
alarming, in which case you just found the gap for free.

## Where to put it

One place, if you only pick one: the moment before merge, on anything where the argument
for merging is a green signal rather than a review.

That's the highest-density spot for this failure. "CI is green" is the most common
merge justification in software, it is almost always true, and it covers dramatically
less than the sentence implies.

---

*Next issue: the second-largest cluster is the one that generates the most heated
disagreement — the claim that a practice costs more than it returns. Sixteen disciplines
name it, and unlike the other two, it's sometimes right.*

---

**[CTA — needs human decision. Per issue 001's recommendation, first CTA lands here
at the earliest, or holds until issue 004.]**
