#!/bin/sh
set -e

echo "Running database migrations..."
npm run db:migrate || true

echo "Starting app..."
exec npx nitro preview --host 0.0.0.0 --port 3000
