#!/bin/sh
set -e

echo "→ Running Prisma migrations..."
./node_modules/.bin/prisma migrate deploy || npx prisma migrate deploy || true

echo "→ Starting Next.js Application..."
if [ -f "./server.js" ]; then
  exec node server.js
else
  exec node node_modules/.bin/next start
fi