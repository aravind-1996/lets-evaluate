#!/usr/bin/env bash
# Deploy Let's Evaluate to Vercel + Neon
# Prerequisites: vercel CLI, neon CLI (optional), DATABASE_URL set locally

set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Applying schema to DATABASE_URL"
npm run db:push

echo "==> Seeding default organization"
npm run db:seed

echo "==> Production build"
npm run build

echo "==> Deploy to Vercel (link project first: vercel link)"
vercel deploy --prod

echo "Done. Set AUTH_URL to your Vercel URL in project env vars."
