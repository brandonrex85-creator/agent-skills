# Integration status

What I found when asked to wire up beehiiv and Instagram, what I could verify, and
what I could not.

_Researched 2026-08-26. Egress from this session blocks `beehiiv.com`,
`developers.facebook.com`, and several other sources, so items below are marked
**verified** (read from a source I could actually fetch or from consistent search
results) or **unverified** (could not reach the authoritative page)._

---

## beehiiv — official MCP exists ✅

I initially searched Claude's connector registry and found nothing. That was the wrong
place to look: **beehiiv's MCP is a *custom* connector**, added by URL, so it doesn't
appear in the registry listing.

**Verified:**
- An official beehiiv MCP server exists and supports Claude, Claude Code, Cursor, Codex.
- It's added via **Settings → Connectors → Add custom connector** on claude.ai.
- **The server URL is found in your beehiiv account settings** — it appears to be
  account-specific, so I can't supply it for you.
- v1 was read-only. **v2 adds write access** — drafting and publishing posts,
  automations, surveys, polls.

**Unverified (couldn't reach the docs):**
- The exact connector URL.
- Whether write actions require a paid plan. One source says write actions do; another
  says the MCP is available with no paid plan required. Assume you may hit a plan gate
  on publishing and check in your account.
- The exact tool list it exposes.

### I cannot set this up for you

Adding a custom connector happens in claude.ai account settings. This session has no
access to that surface — it isn't a permissions question I can work around.

**Your steps:**
1. In beehiiv: find the MCP server URL in settings.
2. On claude.ai: Settings → Connectors → Add custom connector. Name it `beehiiv`, paste
   the URL.
3. Sign in with your beehiiv account to authorize.
4. Enable it for this chat.

Once it's on, tell me and I'll confirm which tools actually loaded before relying on any
of them. If it turns out to be read-only on your plan, drafting still happens here and
you press publish in beehiiv — barely different from today's workflow.

---

## Instagram — no MCP connector exists ❌

I searched the registry for `instagram` directly. The only matches were **analytics
aggregators** (Supermetrics, Windsor.ai) and **ads tools** (AdWhispr, Abency). Those
read marketing data. **None of them publish posts.**

There is no Instagram publishing connector to install.

### The real path, and what it costs

Programmatic posting means Meta's Instagram Content Publishing API. **Verified**
prerequisites:

- An Instagram **Professional** (Business or Creator) account
- A linked **Facebook Page**
- A **Meta developer app**
- The `instagram_business_content_publish` permission — which goes through **Meta App
  Review**

Then publishing is a two-step call: create a media container per image, then publish the
carousel container.

### The constraint that matters most

**`image_url` must be a publicly reachable URL.** The API fetches images itself — there
is no file upload. So automating this requires hosting all 107 slides somewhere public
first. That's a second piece of infrastructure before a single post goes out.

### My recommendation: don't automate this yet

App Review plus public image hosting is a multi-day build. The publication currently has
**zero subscribers** and posts 2–3 times a week — roughly ten minutes of manual work.

Automating it now would be building a pipeline to move content nobody has yet asked for.
Post manually for six weeks. If the carousels work, automation becomes worth its cost and
the API path above is waiting. If they don't, you've saved the entire build.

I'd revisit at either ~1,000 followers or a cadence above one post a day.

---

## Verified Instagram specs — and one that broke my slides

Researching this caught a real defect in what I'd already rendered.

| Spec | Value | Status |
|---|---|---|
| **Image format (API)** | **JPEG only — PNG is rejected** | ⚠️ was broken, now fixed |
| Max file size | 8 MB | ✅ pass |
| Aspect ratio range | 4:5 to 1.91:1 | ✅ 4:5 exactly |
| Carousel items (API) | max 10 | ✅ max 8 |
| Carousel items (app) | max 20 | ✅ |
| Recommended size | 1080×1350 | ✅ matches |
| Cropping | all slides cropped to **first slide's** ratio | ✅ all uniform |

**The defect:** all 107 slides were PNG. The app accepts PNG on manual upload, so manual
posting was never at risk — but every API publish would have failed. The renderer now
emits both: `slides/` (PNG, manual) and `slides-jpeg/` (JPEG, API).

**The near-miss:** one source suggested carousel images default to a 1:1 crop, which
would have silently cut the sides off every slide. It's wrong — cropping follows the
*first slide's* ratio. Since all 107 are uniformly 1080×1350, there's no crop. Worth
recording because "silently cropped" is the failure you don't notice until it's public.

`validate-slides.js` now enforces every row of that table, and exits nonzero on failure.

---

## What's actually integrated right now

| | Status |
|---|---|
| beehiiv MCP | **Available — needs you to add it.** Steps above. |
| Instagram API | **No connector. Manual posting recommended for now.** |
| Gmail / Calendar / Drive | Connected, unused by this business so far |

Nothing about the current workflow is blocked by either. The 14 carousels and two issues
are ready to post by hand today.
