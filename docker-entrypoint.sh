#!/bin/sh
set -e

echo "=== Starting Madrassa School ERP Container ==="

echo "1. Checking database connection and running migrations..."
npm run db:migrate || true

echo "2. Ensuring default admin account exists..."
npm run seed:admin || true

echo "3. Starting web application on port ${PORT:-3000}..."
if [ -f .output/server/index.mjs ]; then
  exec node .output/server/index.mjs
else
  exec npm run preview -- --host 0.0.0.0 --port ${PORT:-3000}
fi
