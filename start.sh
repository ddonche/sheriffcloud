#!/bin/sh
set -e

cd /app/dist/admin
/app/goblin start --port 9000 &

node /app/og-server.mjs &

exec nginx -g 'daemon off;'
