#!/usr/bin/env bash
# Driver for the agent-skills repo. Run from the repo root.
#
#   driver.sh check              - every CI check, locally, with a pass/fail summary
#   driver.sh route "<prompt>"   - rank skills for a prompt with the Tier-2 router (free)
#   driver.sh plugin "<prompt>"  - load THIS working tree as a plugin in headless
#                                  Claude Code and ask it <prompt> (spends tokens)
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "run inside the repo" >&2; exit 2; }
cd "$ROOT"
SCRATCH="${DRIVER_SCRATCH:-${TMPDIR:-/tmp}/agent-skills-driver}"
mkdir -p "$SCRATCH"

ensure_tags() {
  # validate-versions.js needs `git describe --tags`. Forks and shallow clones
  # often have no tags; pull them from upstream.
  git describe --tags --abbrev=0 >/dev/null 2>&1 && return
  git fetch -q https://github.com/addyosmani/agent-skills 'refs/tags/*:refs/tags/*' 2>/dev/null
  if ! git describe --tags --abbrev=0 >/dev/null 2>&1; then
    [ "$(git rev-parse --is-shallow-repository)" = true ] && git fetch -q --unshallow origin 2>/dev/null
  fi
}

cmd_check() {
  ensure_tags
  local fail=0 c rc
  local checks=(
    "node scripts/validate-skills.js"
    "node scripts/validate-versions.js"
    "node --test scripts/validate-versions-test.js"
    "node --test scripts/run-evals-test.js"
    "node scripts/run-evals.js --min-rank1 80"
    "node scripts/validate-reference-links.js"
    "node --test scripts/validate-reference-links-test.js"
    "node scripts/validate-commands.js"
    "node --test scripts/validate-commands-test.js"
    "node scripts/validate-artifact-paths.js"
    "node --test scripts/validate-artifact-paths-test.js"
    "node --test scripts/lib/skill-lint-test.js"
    "bash hooks/simplify-ignore-test.sh"
  )
  command -v claude >/dev/null && checks+=("claude plugin validate .")
  for c in "${checks[@]}"; do
    $c >"$SCRATCH/last.log" 2>&1; rc=$?
    if [ $rc -eq 0 ]; then echo "PASS  $c"; else echo "FAIL  $c"; sed 's/^/      /' "$SCRATCH/last.log" | tail -15; fail=1; fi
  done
  [ $fail -eq 0 ] && echo "ALL PASSED" || echo "SOME CHECKS FAILED"
  return $fail
}

cmd_route() {
  [ $# -ge 1 ] || { echo 'usage: driver.sh route "<prompt>"' >&2; exit 2; }
  # run-evals.js does not export its ranker; load its source and expose it.
  PROMPT="$1" node -e '
    const fs = require("fs"), path = require("path"), Module = require("module");
    const file = path.resolve("scripts/run-evals.js");
    const m = new Module(file, module); m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file));
    m._compile(fs.readFileSync(file, "utf8") +
      "\nmodule.exports.__r = { rankSkills, buildCorpus, loadSkills };", file);
    const { rankSkills, buildCorpus, loadSkills } = m.exports.__r;
    const ranked = rankSkills(process.env.PROMPT, buildCorpus(loadSkills()));
    ranked.slice(0, 5).forEach((r, i) => console.log(`${i + 1}. ${r.name}  ${r.score.toFixed(3)}`));
  '
}

cmd_plugin() {
  [ $# -ge 1 ] || { echo 'usage: driver.sh plugin "<prompt>"' >&2; exit 2; }
  command -v claude >/dev/null || { echo "claude CLI not found (npm i -g @anthropic-ai/claude-code)" >&2; exit 2; }
  # Run from an empty dir so this repo's CLAUDE.md / .mcp.json don't load, and
  # with a throwaway config dir so no installed copy of the plugin shadows it.
  local proj="$SCRATCH/proj" out="$SCRATCH/plugin.jsonl"
  mkdir -p "$proj" "$SCRATCH/config"
  ( cd "$proj" && CLAUDE_CONFIG_DIR="$SCRATCH/config" timeout "${PLUGIN_TIMEOUT:-300}" \
      claude -p "$1" --plugin-dir "$ROOT" --output-format stream-json --verbose \
      --include-hook-events --max-turns "${MAX_TURNS:-3}" >"$out" 2>"$SCRATCH/plugin.err" )
  local rc=$?
  OUT="$out" node -e '
    const ev = require("fs").readFileSync(process.env.OUT, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse);
    const init = ev.find(e => e.type === "system" && e.subtype === "init") || {};
    const p = (init.plugins || []).find(p => p.name === "agent-skills");
    console.log("plugin:", p ? `${p.source} v${p.version} @ ${p.path}` : "NOT LOADED");
    console.log("skills:", (init.skills || []).filter(s => s.startsWith("agent-skills:")).length);
    for (const e of ev.filter(e => e.type === "system" && e.subtype === "hook_response"))
      console.log(`hook ${e.hook_event || e.hook_name}: exit=${e.exit_code} ${(e.output || e.stdout || "").slice(0, 70)}...`);
    for (const e of ev.filter(e => e.type === "assistant"))
      for (const c of e.message.content || []) if (c.type === "tool_use") console.log("tool_use:", c.name, JSON.stringify(c.input).slice(0, 100));
    const r = ev.find(e => e.type === "result");
    console.log("---\n" + (r ? r.result : "(no result)"));
  '
  echo "(full trace: $out)"
  return $rc
}

case "${1:-}" in
  check) shift; cmd_check "$@" ;;
  route) shift; cmd_route "$@" ;;
  plugin) shift; cmd_plugin "$@" ;;
  *) sed -n '2,8p' "$0"; exit 2 ;;
esac
