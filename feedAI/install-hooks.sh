#!/usr/bin/env bash
# Installs feedAI's pre-commit hook into .git/hooks/. Safe no-op if this isn't
# a git checkout (e.g. a Docker build context with no .git) or the hook is
# already up to date.
#
# Wired into package.json's postinstall so every `pnpm install` — a fresh
# clone, CI, a new contributor, this machine after a stale reinstall — keeps
# the hook current automatically. Before this script existed, the pre-commit
# gate only protected commits made from a machine where someone had run
# `cp feedAI/git-hooks/pre-commit .git/hooks/pre-commit` by hand — exactly the
# "depends on someone remembering" failure mode the rest of check-health.sh
# was built to eliminate.
set -euo pipefail
cd "$(dirname "$0")/.."   # repo root (this script lives in feedAI/)

if [ ! -d .git ]; then
  exit 0
fi

if [ ! -f feedAI/git-hooks/pre-commit ]; then
  exit 0
fi

mkdir -p .git/hooks
if ! cmp -s feedAI/git-hooks/pre-commit .git/hooks/pre-commit 2>/dev/null; then
  cp feedAI/git-hooks/pre-commit .git/hooks/pre-commit
  chmod +x .git/hooks/pre-commit
  echo "feedAI: installed/updated pre-commit hook (feedAI/check-health.sh gate)"
fi
