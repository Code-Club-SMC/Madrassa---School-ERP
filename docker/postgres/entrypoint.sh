#!/bin/sh
set -e

PGDATA="${PGDATA:-/var/lib/postgresql/18/docker}"
CONF_SRC=/etc/postgresql/conf.d

if [ -d "$PGDATA" ]; then
  mkdir -p "$PGDATA/conf.d"
  cp -f "$CONF_SRC"/*.conf "$PGDATA/conf.d/"

  if ! grep -q "include_dir = 'conf.d'" "$PGDATA/postgresql.conf" 2>/dev/null; then
    printf "\ninclude_dir = 'conf.d'\n" >> "$PGDATA/postgresql.conf"
  fi
fi

exec /usr/local/bin/docker-entrypoint.sh "$@"