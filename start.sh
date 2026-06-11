#!/bin/bash
# Bezon - Build & Start
# Usage: bash start.sh
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [ ! -f apps/api/.env ]; then
  echo "❌  apps/api/.env not found. Copy apps/api/.env.example and fill it in."
  exit 1
fi

# Symlink to root so that processes launched from the root directory can find the .env file
if [ ! -f .env ]; then
  echo "🔗  Linking apps/api/.env to root .env..."
  ln -sf apps/api/.env .env
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
echo "🔥  Starting API server on port 5002 in background..."
# Run API in the background
npx tsx apps/api/src/index.ts &
API_PID=$!

# Ensure the background API process is killed if this script is stopped (Ctrl+C)
trap "kill $API_PID 2>/dev/null || true" EXIT

echo "▶️   Starting Web preview server on port 3000..."
echo "    Access the app at: http://<your-ec2-ip>:3000/"
echo "    (Press Ctrl+C to stop both servers)"
echo ""

cd apps/web && npx vite preview --port 3000 --host 0.0.0.0
