#!/usr/bin/env bash
set -eu

profile=""
for argument in "$@"; do
  case "$argument" in
    --user-data-dir=*) profile="${argument#--user-data-dir=}" ;;
  esac
done
test -n "$profile"

(
  finish_writer() {
    sleep 0.8
    mkdir -p "$profile"
    : > "$profile/late-shutdown-write"
    exit 0
  }
  trap finish_writer TERM
  while true; do sleep 0.05; done
) &

exec "${QUIET_SPACE_REAL_BROWSER:-/usr/local/bin/chromium}" "$@"
