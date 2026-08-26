# Publish runbook

Everything below is staged and ready. **I cannot publish any of it** — I have no
Instagram or beehiiv tooling, and posting publicly is outbound to real people. These
are copy-paste steps for a human.

---

## 0. One thing I need back from you

**The public beehiiv publication URL.** Not `app.beehiiv.com` — that's the admin panel.
The reader-facing address (`thelatertax.beehiiv.com`, or a custom domain if you set one).

Every Instagram CTA routes to link-in-bio, and link-in-bio is the *only* clickable path
Instagram allows. Without that URL there is no conversion path from Instagram at all,
and the carousels are brand awareness with no destination.

Give me the URL and I'll write the bio and wire the CTAs.

---

## 1. Instagram profile setup

**Handle:** `@thelatertax` ✅ created

**Name field** (this is search-indexed — use keywords, not the handle again):
```
The Later Tax · Engineering discipline
```

**Bio** (150 char limit):
```
We catalogued 153 excuses engineers actually make, across 24 disciplines.
One breakdown a week. Evidence, not takes.
```
That's 118 characters. Room to spare if you want to add an emoji.

**Link:** the beehiiv URL from step 0.

---

## 2. First carousel to post

Post **`false-proxy-1`** first, not `deferral-1`.

Deferral is the stronger *newsletter* opener because it's the biggest cluster and the
statistic carries it. But Instagram's first filter is the thumbnail, and
"The excuses that are completely true" is a better cold-scroll hook than a chart-shaped
claim about 16 disciplines. Lead with the paradox.

**Files:** `content/instagram/slides/false-proxy-1/01.png` … `08.png` — upload in
filename order.

Use the **PNG** folder for manual posting through the app. `slides-jpeg/` exists only
for the Content Publishing API, which rejects PNG — see `INTEGRATION.md`.

**Caption:** in `content/instagram/carousels.json` under `false-proxy-1`, or read it
from `carousels.md`.

---

## 3. Posting cadence

14 carousels are rendered. At 2–3 posts a week that's **5–7 weeks** of Instagram
content with nothing new to make.

Do not post all of one cluster back to back. The parts are numbered ("Part 2 of 3") and
reference earlier parts, so they need to be in order — but space them, and interleave
other clusters between them.

Suggested first three weeks:

| Week | Posts |
|---|---|
| 1 | `false-proxy-1`, `deferral-1` |
| 2 | `triviality-1`, `false-proxy-2` |
| 3 | `deferral-2`, `confidence-1` |

---

## 4. Newsletter — beehiiv

**Issue 001** — `content/drafts/issue-001-later-tax.md`
**Issue 002** — `content/drafts/issue-002-technically-true.md`

Both are markdown and paste into beehiiv's editor directly. Two things to handle on paste:

1. **Strip the YAML frontmatter block** (everything between the `---` fences at the top).
   It's my metadata, not content.
2. **Issue 001 has an unresolved CTA decision** at the bottom — three options with my
   recommendation (option C: no CTA on the first issue). Pick one and delete the block.

**Subject line for issue 001:**
```
The Later Tax: 16 of 24 disciplines name the same failure
```

**Preview text:**
```
We counted 153 excuses. One showed up almost everywhere.
```

**Send timing:** issue 001 should go out *after* the Instagram account has a few posts
up. A brand-new profile with an empty grid converts badly, and the newsletter link is
the only thing the profile is for.

---

## 5. What is NOT ready

- **X / LinkedIn posts** (`content/social/posts.md`, 60 posts). Built in run 002 when
  the channel was still undecided. They're valid and the script still works, but nothing
  is set up on those platforms. Ignore unless you open an account there.
- **Landing page copy** (`content/drafts/landing-page-copy.md`). Written for a generic
  platform. Beehiiv supplies its own landing page, so most of this now belongs in the
  beehiiv publication settings rather than a standalone page. Worth a pass once I see
  the beehiiv setup.

---

## 6. Integrations

See `INTEGRATION.md`. Short version: beehiiv has an official MCP you can add as a custom
connector (I can't add it for you — it's an account-settings action). Instagram has no
publishing connector at all; manual posting is the right call until there's an audience
worth automating for.

---

## 7. Regenerating everything

```bash
node business/scripts/extract-content.js          # skills -> atoms
node business/scripts/build-calendar.js           # atoms -> schedule
node business/scripts/cluster-rationalizations.js # atoms -> clusters
node business/scripts/build-instagram.js          # clusters -> carousels + captions
node business/scripts/render-slides.js            # carousels -> 107 PNGs + JPEGs
node business/scripts/validate-slides.js         # check against Instagram API specs
```

Requires `npm install playwright` (Chromium is already on the box).
