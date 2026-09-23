---
name: run-agent-skills
description: Runs, tests, and drives the agent-skills plugin repo. Use when asked to run the checks/CI locally, validate or test a skill change, check which skill a prompt routes to, or load this working tree as a plugin in Claude Code to see a skill actually trigger.
---

# Run agent-skills

This repo is a Claude Code plugin made of Markdown skills plus Node validator scripts. It has no server and no UI. You drive it three ways, all through `.claude/skills/run-agent-skills/driver.sh`:

| Command | What it does | Cost |
|---|---|---|
| `driver.sh check` | Runs every CI check locally and prints PASS/FAIL for each (about 4s) | Free |
| `driver.sh route "<prompt>"` | Ranks the top 5 skills for a prompt using the Tier-2 router that CI uses | Free |
| `driver.sh plugin "<prompt>"` | Loads **this working tree** as a plugin in headless `claude -p` and runs the prompt | Tokens |

Paths are relative to the repo root. Run everything from there.

## Prerequisites

- Node 22+ (CI uses 24; 22.22 passed here). There's no `npm install`: the scripts have no dependencies.
- The `claude` CLI, for `plugin` and for the `claude plugin validate .` step of `check` (that step is skipped if `claude` isn't installed).

## Check (what CI runs)

```bash
.claude/skills/run-agent-skills/driver.sh check
```

This mirrors `.github/workflows/test-plugin-install.yml` and also runs `scripts/lib/skill-lint-test.js` and `hooks/simplify-ignore-test.sh`. It ends with `ALL PASSED` and exits 0. Run it after any change to `skills/`, `scripts/`, the commands, or the manifests.

## Route a prompt (description changes)

```bash
.claude/skills/run-agent-skills/driver.sh route "write a failing test before fixing this bug"
# 1. test-driven-development  0.395
# 2. debugging-and-error-recovery  0.156 ...
```

Use this when editing a skill's `description:` or an `evals/cases/*.json` trigger prompt. It uses the same stemmed TF-IDF ranker as `node scripts/run-evals.js`, whose floor is `--min-rank1 80`.

## Drive the real plugin (agent path)

```bash
.claude/skills/run-agent-skills/driver.sh plugin \
  "Invoke the agent-skills:test-driven-development skill with the Skill tool, then reply with only its first markdown H1 heading line."
```

Output from a run where the heading had been edited locally:

```
plugin: agent-skills@inline v0.6.7 @ /home/user/agent-skills
skills: 24
hook SessionStart: exit=0 {"hookSpecificOutput":{"hookEventName":"SessionStart",...
tool_use: Skill {"skill":"agent-skills:test-driven-development"}
---
# LOCAL-MARKER-7731 Test-Driven Development
```

The output shows the plugin's source and version, how many `agent-skills:` skills loaded, the SessionStart hook's response, each tool call, and the final answer. The full stream-json trace is written to `/tmp/agent-skills-driver/plugin.jsonl` (set `DRIVER_SCRATCH` to change the directory). `MAX_TURNS` defaults to 3 and `PLUGIN_TIMEOUT` defaults to 300s.

To grade a skill behaviorally (Tier 3, spends tokens), use the repo's own runner:

```bash
node scripts/run-evals.js --behavioral test-driven-development --dry-run   # drop --dry-run to execute
```

## Gotchas

- **`claude plugin marketplace add ./` does not test your changes.** `.claude-plugin/marketplace.json` points its source at `github: addyosmani/agent-skills`, so the install pulls **upstream** instead of your working tree. It installed v0.6.10 with a `constraint-driven-development` skill that doesn't exist locally. Use `--plugin-dir` (which `driver.sh plugin` does); it reports `source: agent-skills@inline`.
- **`validate-versions.js` crashes with `fatal: No names found`** when run in a fork or shallow clone with no tags. This fork has none: `git ls-remote --tags origin` returns nothing. `check` fetches the tags from upstream first. Manually: `git fetch https://github.com/addyosmani/agent-skills 'refs/tags/*:refs/tags/*'`.
- **Don't run `claude -p` from inside the repo** to test the plugin. It would load this repo's `CLAUDE.md` and `.mcp.json` (a Hostinger MCP server) into the session. `driver.sh plugin` runs from an empty scratch directory with its own `CLAUDE_CONFIG_DIR`.
- **`CLAUDE_CONFIG_DIR` doesn't isolate account-level skills.** In a claude.ai cloud session, the model also sees the account's own skills (`skill-creator`, `docx`, …). Count only the `agent-skills:` prefix, as the driver does.
- **`hooks/session-start-test.sh` is stale and fails** (`expected IMPORTANT priority, got undefined`). PR #465 changed the hook to the standard `hookSpecificOutput` envelope, but the test still expects the old `{priority, message}` shape. CI doesn't run it, so `check` leaves it out. The hook itself works: `driver.sh plugin` shows it firing with exit 0.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Error: Command failed: git describe --tags --abbrev=0` | No tags. Run `driver.sh check`, which fetches them, or use the upstream fetch above. |
