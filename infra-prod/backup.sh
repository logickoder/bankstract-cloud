# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike
#
# Nightly snapshot of both SQLite DBs to Cloudflare R2. Runs in an alpine sidecar. Uses
# `sqlite3 .backup` (WAL-safe: a consistent copy even while the apps are writing), then rclone
# to R2. With no R2 creds it just writes local snapshots to /tmp (a no-op-ish dev mode).
#
# The audit DB is metadata-only (Directive 1: no PDF payload). The auth DB holds users + sessions.
set -eu

apk add --no-cache sqlite rclone >/dev/null

export RCLONE_CONFIG_R2_TYPE=s3
export RCLONE_CONFIG_R2_PROVIDER=Cloudflare
export RCLONE_CONFIG_R2_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID:-}"
export RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY:-}"
export RCLONE_CONFIG_R2_ENDPOINT="${R2_ENDPOINT:-}"

snapshot() {
  src="$1"
  dest_dir="$2"
  [ -f "$src" ] || return 0
  ts=$(date -u +%Y%m%dT%H%M%SZ)
  out="/tmp/$(basename "$src").$ts"
  sqlite3 "$src" ".backup '$out'"
  if [ -n "${R2_BUCKET:-}" ]; then
    rclone copyto "$out" "R2:${R2_BUCKET}/${dest_dir}/$(basename "$out")"
  fi
  rm -f "$out"
}

while true; do
  snapshot /data/audit/audit.sqlite audit || echo "audit backup failed"
  snapshot /data/auth/auth.db auth || echo "auth backup failed"
  # Daily. The first run fires immediately so a fresh deploy has a backup within the day.
  sleep 86400
done
