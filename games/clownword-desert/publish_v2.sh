#!/usr/bin/env bash
set -Eeuo pipefail

OWNER="${GITHUB_OWNER:-iamrichmack111}"
REPO="${REPO_NAME:-clownword-desert}"
VERSION="${VERSION:-v2.0.0}"
FULL_REPO="${OWNER}/${REPO}"
DESCRIPTION="A graded 2D open-world sight-word game with student profiles, clown hordes, circus bosses, and saved reports."
HOMEPAGE="https://${OWNER}.github.io/${REPO}/"

say() { printf '\n\033[1;36m==>\033[0m %s\n' "$*"; }
die() { printf '\n\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

command -v git >/dev/null || die "git is not installed."
command -v gh >/dev/null || die "GitHub CLI is not installed."
gh auth status >/dev/null 2>&1 || die "Run: gh auth login"

cd "$(dirname "${BASH_SOURCE[0]}")"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || git init
git branch -M main

say "Committing ClownWord Desert ${VERSION}"
git add .
if ! git diff --cached --quiet; then
  if git rev-parse --verify HEAD >/dev/null 2>&1; then
    git commit -m "Add grading, student profiles, bosses, and spelling upgrades"
  else
    git commit -m "Initial release of ClownWord Desert"
  fi
fi

if ! git rev-parse "$VERSION" >/dev/null 2>&1; then
  git tag -a "$VERSION" -m "ClownWord Desert ${VERSION}"
fi

if ! gh repo view "$FULL_REPO" >/dev/null 2>&1; then
  gh repo create "$FULL_REPO" --public --source=. --remote=origin --description="$DESCRIPTION"
elif git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "https://github.com/${FULL_REPO}.git"
else
  git remote add origin "https://github.com/${FULL_REPO}.git"
fi

say "Pushing main and tag"
git push -u origin main
git push origin "$VERSION"

say "Setting repository metadata and topics"
gh repo edit "$FULL_REPO" \
  --description "$DESCRIPTION" \
  --homepage "$HOMEPAGE" \
  --enable-issues \
  --enable-wiki=false \
  --delete-branch-on-merge \
  --enable-squash-merge \
  --enable-rebase-merge \
  --add-topic javascript \
  --add-topic html5 \
  --add-topic canvas-game \
  --add-topic browser-game \
  --add-topic educational-game \
  --add-topic spelling-game \
  --add-topic sight-words \
  --add-topic kids-game \
  --add-topic student-grading \
  --add-topic localstorage \
  --add-topic web-audio \
  --add-topic speech-synthesis \
  --add-topic open-world \
  --add-topic offline-first

# Older gh versions may lack --enable-discussions.
gh api --method PATCH "repos/${FULL_REPO}" -F has_discussions=true >/dev/null 2>&1 || true

say "Creating release archive"
mkdir -p dist
ARCHIVE="dist/clownword-desert-${VERSION#v}.zip"
rm -f "$ARCHIVE"
zip -rq "$ARCHIVE" index.html README.md CHANGELOG.md LICENSE VERSION manifest.webmanifest icon.svg .nojekyll

say "Creating or updating release"
if gh release view "$VERSION" --repo "$FULL_REPO" >/dev/null 2>&1; then
  gh release upload "$VERSION" "$ARCHIVE" --repo "$FULL_REPO" --clobber 2>/dev/null || {
    release_id="$(gh api "repos/${FULL_REPO}/releases/tags/${VERSION}" --jq '.id')"
    asset_name="$(basename "$ARCHIVE")"
    asset_id="$(gh api "repos/${FULL_REPO}/releases/${release_id}/assets" --jq ".[] | select(.name == \"${asset_name}\") | .id" | head -n1)"
    [[ -z "${asset_id:-}" ]] || gh api --method DELETE "repos/${FULL_REPO}/releases/assets/${asset_id}" >/dev/null
    gh release upload "$VERSION" "$ARCHIVE" --repo "$FULL_REPO"
  }
  gh release edit "$VERSION" --repo "$FULL_REPO" --title "ClownWord Desert ${VERSION}" --notes-file CHANGELOG.md
else
  gh release create "$VERSION" "$ARCHIVE" --repo "$FULL_REPO" --title "ClownWord Desert ${VERSION}" --notes-file CHANGELOG.md
fi

say "Configuring GitHub Pages"
cat > /tmp/clownword-pages.json <<JSON
{"build_type":"legacy","source":{"branch":"main","path":"/"}}
JSON

if gh api "repos/${FULL_REPO}/pages" >/dev/null 2>&1; then
  gh api --method PUT "repos/${FULL_REPO}/pages" --input /tmp/clownword-pages.json >/dev/null
else
  gh api --method POST "repos/${FULL_REPO}/pages" --input /tmp/clownword-pages.json >/dev/null
fi
gh api --method POST "repos/${FULL_REPO}/pages/builds" >/dev/null 2>&1 || true

say "Verification"
gh repo view "$FULL_REPO" --json nameWithOwner,url,homepageUrl,visibility,repositoryTopics \
  --jq '{repository:.nameWithOwner,url,homepage:.homepageUrl,visibility,topics:[.repositoryTopics[].name]}'
gh release view "$VERSION" --repo "$FULL_REPO"
gh api "repos/${FULL_REPO}/pages" --jq '{status,html_url,source}'

printf '\nPublished: https://github.com/%s\nGame: %s\n' "$FULL_REPO" "$HOMEPAGE"
