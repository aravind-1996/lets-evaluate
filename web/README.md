# Let's Evaluate — Web app

The Next.js application for Let's Evaluate. **Full setup, configuration, and deployment docs are in the [root README](../README.md).**

## Quick start

```bash
cd web
cp .env.example .env.local
# Set DATABASE_URL, AUTH_SECRET, OPENAI_API_KEY

npm install
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000

## Additional docs

- [Environment template](.env.example) — all configuration variables
- [Cloud database migration](docs/cloud-migration.md) — Neon → Azure, S3 resume sync

## Legacy data import

If you have data from the old Python/Streamlit prototype, set `LEGACY_DATABASE_URL` in `.env.local` and run:

```bash
npm run migrate:streamlit
```
