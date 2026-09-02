#!/usr/bin/env bash
# feedAI/check-health.sh — flags what a manual audit would otherwise have to catch:
#   1. topics/*.json files over the MAINTAIN.md budget (~10KB / 10240 bytes)
#   2. commits made since brain.json's sync.date that never touched feedAI/
#      (a proxy for "facts.jsonl silently went stale")
#
# Run from anywhere inside the repo. Exit code is nonzero if either check fires,
# so it can be wired into a pre-commit/session-start hook later without extra work.
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

exit $status
