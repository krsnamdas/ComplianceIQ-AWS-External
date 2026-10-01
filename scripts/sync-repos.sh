#!/usr/bin/env bash
#
# sync-repos.sh — propagate shared application changes to all three ComplianceIQ repos.
#
# The three repos are different EDITIONS, not mirrors:
#   - origin        -> krsnamdas/ComplianceIQAMZ            (internal "normal" edition)
#   - aws-external  -> krsnamdas/ComplianceIQ-AWS-External  (public AWS edition)
#   - gemini        -> krsnamdas/ComplianceIQ-Gemini        (Google Gemini edition)
#
# The ENTIRE application lives in the SHARED_PATHS below and is identical across
# all three. Edition-specific files (server.ts, package.json, infra/, Dockerfile,
# docs, .env.example) are DELIBERATELY excluded so this script never clobbers them.
#
# What it does:
#   1. Commits your current working changes to the local source branch and pushes
#      to origin (the "normal" edition).
#   2. For each other repo, checks out that repo's branch into a temporary git
#      worktree, overlays ONLY the shared paths from your source commit (via
#      `git archive`, which never touches your main index), commits, and pushes.
#
# Usage:
#   ./scripts/sync-repos.sh "your commit message"
#   ./scripts/sync-repos.sh "fix heatmap tooltip" --dry-run
#
set -euo pipefail

# ---- Config -----------------------------------------------------------------
SOURCE_BRANCH="feature/aws-deploy"   # branch that holds the source of truth

# Paths shared across ALL editions. Only these are pushed to every repo.
SHARED_PATHS=(
  "src"
  "public"
  "data"
  "scripts"
  "index.html"
  "metadata.json"
  "vite.config.ts"
  "tsconfig.json"
  ".npmrc"
  "sync-test.txt"
)

# name:remote:branch  (origin handled first as the source of truth)
TARGETS=(
  "aws-external:aws-external:main"
  "gemini:gemini:main"
)
# -----------------------------------------------------------------------------

MSG="${1:-}"
DRY_RUN="false"
[[ "${2:-}" == "--dry-run" ]] && DRY_RUN="true"

if [[ -z "$MSG" ]]; then
  echo "ERROR: commit message required."
  echo "Usage: $0 \"commit message\" [--dry-run]"
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

echo "=============================================="
echo " ComplianceIQ multi-repo sync"
echo " Message : $MSG"
echo " Dry run : $DRY_RUN"
echo "=============================================="

# --- Step 1: commit local working changes to the source branch --------------
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" != "$SOURCE_BRANCH" ]]; then
  echo "NOTE: on '$CURRENT_BRANCH' (expected '$SOURCE_BRANCH'); using current branch as source."
  SOURCE_BRANCH="$CURRENT_BRANCH"
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo ">> Committing working changes to $SOURCE_BRANCH ..."
  if [[ "$DRY_RUN" == "true" ]]; then
    echo "   [dry-run] git add -A && git commit -m \"$MSG\""
  else
    git add -A
    git commit -m "$MSG"
  fi
else
  echo ">> No uncommitted changes; using existing HEAD of $SOURCE_BRANCH."
fi

SOURCE_SHA="$(git rev-parse HEAD)"
echo ">> Source commit: $SOURCE_SHA"

# --- Step 2: push the source branch to origin (normal edition) --------------
echo ">> Pushing $SOURCE_BRANCH to origin (normal edition) ..."
if [[ "$DRY_RUN" == "true" ]]; then
  echo "   [dry-run] git push origin $SOURCE_BRANCH"
else
  git push origin "$SOURCE_BRANCH"
fi

# --- Step 3: overlay shared paths onto each edition repo --------------------
WORKTREE_BASE="$(mktemp -d)"
cleanup() {
  cd "$REPO_ROOT"
  for t in "${TARGETS[@]}"; do
    name="${t%%:*}"
    wt="$WORKTREE_BASE/$name"
    [[ -d "$wt" ]] && git worktree remove --force "$wt" 2>/dev/null || true
  done
  rm -rf "$WORKTREE_BASE"
  git worktree prune 2>/dev/null || true
}
trap cleanup EXIT

for t in "${TARGETS[@]}"; do
  IFS=":" read -r NAME REMOTE BRANCH <<< "$t"

  echo ""
  echo "----------------------------------------------"
  echo " Syncing shared paths -> $NAME ($REMOTE/$BRANCH)"
  echo "----------------------------------------------"

  git fetch "$REMOTE" "$BRANCH"

  WT="$WORKTREE_BASE/$NAME"
  git worktree add --force --detach "$WT" "$REMOTE/$BRANCH" >/dev/null 2>&1

  # Overlay shared paths from the source commit into the worktree via archive.
  # `git archive` streams the tree content without ever touching the main index.
  for p in "${SHARED_PATHS[@]}"; do
    if git cat-file -e "$SOURCE_SHA:$p" 2>/dev/null; then
      rm -rf "${WT:?}/$p"
      git archive "$SOURCE_SHA" "$p" | tar -x -C "$WT"
    fi
  done

  (
    cd "$WT"
    if [[ -z "$(git status --porcelain)" ]]; then
      echo "   No shared-path changes for $NAME; skipping commit."
      exit 0
    fi

    echo "   Changed files:"
    git status --porcelain | sed 's/^/     /'

    if [[ "$DRY_RUN" == "true" ]]; then
      echo "   [dry-run] would commit & push to $REMOTE/$BRANCH"
    else
      git add -A
      git commit -m "$MSG"
      git push "$REMOTE" "HEAD:$BRANCH"
      echo "   Pushed to $REMOTE/$BRANCH."
    fi
  )
done

echo ""
echo "=============================================="
echo " Sync complete."
echo "=============================================="
