#!/bin/bash
# Bezon — Build & Start
# Usage: bash start.sh
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [ ! -f apps/api/.env ]; then
  echo "❌  apps/api/.env not found. Copy apps/api/.env.example and fill it in."
  exit 1
fi

echo "📦  Installing dependencies..."
npm install

echo "⚙️   Generating Prisma client..."
cd apps/api && npx prisma generate && cd "$ROOT_DIR"

echo "🗄️   Running migrations..."
cd apps/api && npx prisma migrate deploy && cd "$ROOT_DIR"

echo "🔨  Building API..."
npm run build --workspace=@bezon/api

echo "🔨  Building web..."
npm run build --workspace=@bezon/web

echo ""
echo "✅  Done. Starting API on port 5002..."
node apps/api/dist/index.js
