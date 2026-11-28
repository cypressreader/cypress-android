#!/usr/bin/env bash
# Start the World Edition build and wait for it - without GitHub's clock.
#
# WHY THIS EXISTS (2026-11-28). The edition used to be started by GitHub's own schedule, and in the whole life
# of this repository GitHub delivered exactly ONE scheduled run: the 11:38 slot of 27 November, at 20:17 - eight
# hours and thirty-nine minutes late - and the 00:38 slot after it not at all. A late run is worse than no run:
# it replaces an edition whose pictures had been looked at with one nobody has seen.
# A PUSH starts a workflow within seconds, every time. So the build is started by pushing a new line into
# .github/edition/RUN, and whoever started it waits here until the workflow reports back on the
# `edition-status` branch.
#
#   bash .github/edition/kick.sh start   # push the trigger; prints the id of this build
#   bash .github/edition/kick.sh wait    # wait up to ~8 minutes; run it again while it says "still building"
#
# `wait` ends one of four ways, and says which:
#   exit 0  PUBLISHED      a new edition is on main and has been pulled into this checkout
#   exit 2  STILL BUILDING run `wait` again (a build takes 15 to 25 minutes)
#   exit 3  NOT PUBLISHED  the build ran and kept the live edition (too few stories, or a check failed)
#   exit 4  the trigger was never pushed from this checkout
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1
RUN=.github/edition/RUN
case "${1:-}" in
start)
  [ "$(git rev-parse --abbrev-ref HEAD)" = main ] || { echo "kick: be on main (git checkout main && git pull)"; exit 1; }
  id="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "$id" > "$RUN"
  git add "$RUN"
  git -c user.name="${GIT_AUTHOR_NAME:-cypressreader}" -c user.email="${GIT_AUTHOR_EMAIL:-cypressreader@users.noreply.github.com}" \
    commit -q -m "Start the edition build ($id)" -- "$RUN" || { echo "kick: nothing to commit"; exit 1; }
  for try in 1 2 3 4; do
    git push -q origin main && { echo "kick: build $id started"; exit 0; }
    git pull -q --rebase origin main || { echo "kick: could not rebase onto main"; exit 1; }
    sleep $((try * 3))
  done
  echo "kick: the push kept being refused; the build was NOT started"; exit 1 ;;
wait)
  [ -f "$RUN" ] || { echo "kick: no $RUN here - run 'start' first"; exit 4; }
  id="$(tr -d '[:space:]' < "$RUN")"
  for i in $(seq 1 "${KICK_TRIES:-16}"); do
    if git fetch -q origin edition-status 2>/dev/null; then
      s="$(git show FETCH_HEAD:status.json 2>/dev/null || true)"
      if printf '%s' "$s" | grep -q "\"kick\": *\"$id\""; then
        if printf '%s' "$s" | grep -q '"published": *"yes"'; then
          git pull -q --rebase --autostash origin main || { echo "kick: PUBLISHED, but this checkout could not pull it"; exit 1; }
          echo "kick: PUBLISHED - $(git log -1 --format=%s -- docs/app/world-edition.json)"; exit 0
        fi
        echo "kick: NOT PUBLISHED - the build finished and the live edition was kept. What it said:"; printf '%s\n' "$s"; exit 3
      fi
    fi
    sleep "${KICK_SLEEP:-30}"
  done
  echo "kick: STILL BUILDING ($id) - run 'wait' again"; exit 2 ;;
*) sed -n '2,22p' "$0"; exit 1 ;;
esac
