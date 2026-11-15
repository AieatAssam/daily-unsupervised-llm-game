#!/usr/bin/env bash
# Merge gate. Nothing reaches main unless this exits 0.
#
#   scripts/gate.sh 2026-11-16     daily: exactly one new game, fully play-tested
#   scripts/gate.sh                maintenance: every changed game re-tested
#
# Besides running tests it checks that the agent only touched files it is
# allowed to touch — otherwise "make the tests pass" can be achieved by
# editing the tests' own machinery.
set -euo pipefail
DATE="${1:-}"

changed=$(git status --porcelain --untracked-files=all | sed -E 's/^.{3}//; s/.* -> //; s/^"(.*)"$/\1/')

if [ -n "$DATE" ]; then
  allowed="^(games/$DATE/(index\.html|game\.test\.js|preview\.png)|games-registry\.json)$"
else
  allowed="^(games/[0-9-]+/(index\.html|game\.test\.js|preview\.png)|games-registry\.json)$"
fi
# gate.log / health.log are written by the workflows themselves.
stray=$(echo "$changed" | grep -Ev "$allowed" | grep -Ev '^(gate\.log|health\.log)$' | grep -v '^$' || true)
if [ -n "$stray" ]; then
  echo "GATE FAIL: files changed outside the allowed set:"
  echo "$stray"
  exit 1
fi

node scripts/validate-registry.mjs

if [ -n "$DATE" ]; then
  for f in index.html game.test.js preview.png; do
    [ -s "games/$DATE/$f" ] || { echo "GATE FAIL: games/$DATE/$f missing or empty"; exit 1; }
  done
  grep -q "defineGameSuite" "games/$DATE/game.test.js" || { echo "GATE FAIL: game.test.js must use defineGameSuite from scripts/game-suite.js"; exit 1; }
  # Exactly one registry entry added, nothing else in the registry touched.
  node -e '
    const { execSync } = require("node:child_process");
    const fs = require("node:fs");
    const before = JSON.parse(execSync("git show HEAD:games-registry.json", { maxBuffer: 1 << 26 }));
    const after = JSON.parse(fs.readFileSync("games-registry.json", "utf8"));
    const date = process.argv[1];
    const same = JSON.stringify(after.slice(0, before.length)) === JSON.stringify(before);
    if (!same || after.length !== before.length + 1 || after.at(-1).id !== date) {
      console.error("GATE FAIL: registry must gain exactly one entry (id " + date + ") appended at the end, with existing entries untouched");
      process.exit(1);
    }
  ' "$DATE"
  npx playwright test "games/$DATE"
else
  # Games still flagged broken are hidden from the gallery and retried next
  # week; they must not block the repairs that did succeed.
  broken=$(jq -r '.[] | select(.broken) | .folder' games-registry.json)
  dirs=$(echo "$changed" | grep -E '^games/[0-9-]+/' | cut -d/ -f1-2 | sort -u \
    | while read -r d; do [ -d "$d" ] && ! echo "$broken" | grep -qx "$d" && echo "$d"; done || true)
  if [ -n "$dirs" ]; then
    # shellcheck disable=SC2086
    npx playwright test $dirs
    ids=$(echo "$dirs" | cut -d/ -f2 | paste -sd, -)
    GAMES="$ids" npx playwright test games/all-games-playability.test.js
  else
    echo "No game files changed — registry-only change, validator passed."
  fi
fi
echo "GATE PASS"
