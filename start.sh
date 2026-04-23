#!/bin/sh

# Seed site structure on first boot
if [ ! -d "/app/site/portals" ]; then
  echo "Seeding site/portals..."
  mkdir -p /app/site/portals
fi

# Seed base sheriff portal if missing (required by create_portal.gbln for logo/favicon)
if [ ! -d "/app/site/portals/sheriff" ]; then
  echo "Seeding base sheriff portal..."
  mkdir -p /app/site/portals/sheriff/public
  cp /app/sheriff-core/themes/outpost/public/logo.png /app/site/portals/sheriff/public/logo.png 2>/dev/null || true
  cp /app/sheriff-core/themes/outpost/public/favicon.ico /app/site/portals/sheriff/public/favicon.ico 2>/dev/null || true
fi

cd /app/dist/admin
/app/goblin start --port 9000 &

node /app/og-server.mjs &

exec nginx -g 'daemon off;'