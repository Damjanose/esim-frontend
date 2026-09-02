#!/usr/bin/env bash
# feedAI/check-health.sh — flags what a manual audit would otherwise have to catch:
#   1. topics/*.json files over the MAINTAIN.md budget (~10KB / 10240 bytes)
#   2. commits made since brain.json's sync.date that never touched feedAI/
#      (a proxy for "facts.jsonl silently went stale")
#   3. files added since the last sync whose name is never mentioned anywhere
#      in feedAI/ (facts.jsonl, brain.json, or any topics/*.json) — a proxy for
#      "a whole feature shipped and nobody wrote it down" (this is exactly how
#      E-SIM-frontend's /xnotificationy page went undocumented for 2 commits
#      until a manual cross-repo audit caught it on 2026-09-02).
#
# Check 3 is a heuristic, not proof: a hit means "grep this file's name and see
# if it's really undocumented or just named differently than its feature" — not
# an automatic failure. Short/generic basenames (<4 chars) are skipped to keep
# false positives down; it will still flag some intentionally-undocumented
# implementation details (small internal helpers, generated files caught by
# path exclusions below). Judgment still required — this narrows what to look
# at, it doesn't replace looking.
#
# Run from anywhere inside the repo. Exit code is nonzero if any check fires,
# so it can be wired into a pre-commit/session-start hook without extra work.
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
FEEDAI="$REPO_ROOT/feedAI"
cd "$REPO_ROOT"

status=0

if [ ! -f "$FEEDAI/brain.json" ]; then
  echo "no feedAI/brain.json found under $REPO_ROOT — nothing to check"
  exit 0
fi

BUDGET_BYTES=10240

echo "== topic file budget (≤ ${BUDGET_BYTES} bytes) =="
if [ -d "$FEEDAI/topics" ]; then
  over_budget=0
  for f in "$FEEDAI/topics"/*.json; do
    size=$(wc -c < "$f" | tr -d ' ')
    if [ "$size" -gt "$BUDGET_BYTES" ]; then
      echo "  OVER  $(basename "$f")  ${size}B (+$((size - BUDGET_BYTES))B)"
      over_budget=1
    fi
  done
  if [ "$over_budget" -eq 0 ]; then
    echo "  all topics under budget"
  else
    status=1
  fi
else
  echo "  no topics/ dir"
fi

echo
echo "== staleness: commits since brain.json's sync.date that never touched feedAI/ =="
sync_date=$(python3 -c "import json; print(json.load(open('$FEEDAI/brain.json'))['sync']['date'])" 2>/dev/null || echo "")
if [ -z "$sync_date" ]; then
  echo "  couldn't read sync.date from brain.json"
else
  # Count commits after sync_date, in the whole repo, that did NOT touch feedAI/.
  # A nonzero count here means work happened that this feedAI snapshot doesn't reflect.
  stale_commits=$(git log --since="${sync_date} 00:00:00" --oneline -- . ':!feedAI' 2>/dev/null | wc -l | tr -d ' ')
  echo "  sync.date: $sync_date"
  echo "  commits since, outside feedAI/: $stale_commits"
  if [ "$stale_commits" -gt 5 ]; then
    echo "  STALE — this is past the scale that caused the 2026-08-19 drift incident (14-57 commits). Resync soon."
    status=1
  elif [ "$stale_commits" -gt 0 ]; then
    echo "  some drift — fine if those commits didn't change behavior, worth a glance otherwise"
  else
    echo "  in sync"
  fi
fi

echo
echo "== new files since last sync never mentioned anywhere in feedAI/ =="
if [ -z "$sync_date" ]; then
  echo "  skipped — no sync.date"
else
  base_ref=$(git rev-list -1 --before="${sync_date} 00:00:00" HEAD 2>/dev/null || true)
  if [ -z "$base_ref" ]; then
    base_ref=$(git rev-list --max-parents=0 HEAD | tail -1)
  fi

  added_files=$(git diff --name-only --diff-filter=A "$base_ref"..HEAD -- \
      . ':!feedAI' ':!*/__tests__/*' ':!*.test.ts' ':!*.test.tsx' ':!*/generated/*' \
      ':!*/migrations/*' ':!node_modules' ':!*.png' ':!*.jpg' ':!*.lock' \
    2>/dev/null || true)

  if [ -z "$added_files" ]; then
    echo "  no new files since sync.date"
  else
    undocumented=0
    while IFS= read -r f; do
      [ -z "$f" ] && continue
      base=$(basename "$f")
      name="${base%%.*}"
      [ ${#name} -lt 4 ] && continue
      if ! grep -qri -- "$name" "$FEEDAI"/facts.jsonl "$FEEDAI"/brain.json "$FEEDAI"/topics/*.json 2>/dev/null; then
        echo "  UNMENTIONED  $f"
        undocumented=1
      fi
    done <<< "$added_files"
    if [ "$undocumented" -eq 0 ]; then
      echo "  every new file's name appears somewhere in feedAI"
    else
      echo "  ^ not necessarily a bug — check whether it's covered under a different name, or is genuinely undocumented"
      status=1
    fi
  fi
fi

exit $status
