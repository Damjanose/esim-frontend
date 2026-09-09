#!/usr/bin/env bash
# feedAI/check-health.sh — optional manual audit (never a git commit gate):
#   1. topics/*.json files over the MAINTAIN.md budget (~10KB / 10240 bytes)
#   2. files added since the last sync whose name is never mentioned anywhere
#      in feedAI/ (facts.jsonl, brain.json, or any topics/*.json) — a proxy for
#      "a whole feature shipped and nobody wrote it down".
#
# Check 2 is a heuristic, not proof: a hit means "grep this file's name and see
# if it's really undocumented or just named differently than its feature."
# Short/generic basenames (<4 chars) are skipped.
#
# Run from the product repo root (not the workspace root). Do not install this
# as a pre-commit hook.
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
echo "== new files since last sync never mentioned anywhere in feedAI/ =="
sync_date=$(python3 -c "import json; print(json.load(open('$FEEDAI/brain.json'))['sync']['date'])" 2>/dev/null || echo "")
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
