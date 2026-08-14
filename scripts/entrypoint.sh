#!/bin/sh
set -eu

cd /app

echo "[entrypoint] Node $(node -v) — npm $(npm -v)"

npm install
npx prisma generate
npx prisma migrate deploy
npx tsx scripts/maybe-seed.ts

exec "$@"
