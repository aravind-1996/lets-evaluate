# Let's Evaluate — Next.js (web)

Modern org-ready rewrite with **People First** KANINI design.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- Auth.js (credentials + optional Microsoft Entra ID)
- Drizzle ORM + **standard PostgreSQL** (Neon, Azure, RDS, Railway)
- OpenAI GPT-4o-mini for screening AI

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

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | 32+ char random string (`openssl rand -base64 32`) |
| `AUTH_URL` | Prod | Public app URL (e.g. `https://your-app.vercel.app`) |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `ORG_SLUG` | No | Default `kanini` |
| `ORG_NAME` | No | Default `KANINI` |
| `ALLOWED_EMAIL_DOMAIN` | No | Restrict register/login (e.g. `kanini.com`) |
| `RESUME_STORAGE_PROVIDER` | No | `local` (default) or `s3` |
| `S3_*` | If s3 | Bucket credentials |
| `AZURE_AD_*` | Phase 2 | Microsoft SSO |
| `LEGACY_DATABASE_URL` | Migration | Old Streamlit DB for one-time import |

## Database portability (Neon → Azure or any Postgres)

No vendor-specific SQL. To move clouds:

```bash
# 1. Export
pg_dump -Fc "$DATABASE_URL" > lets-evaluate.dump

# 2. Restore to new host
pg_restore -d "$NEW_DATABASE_URL" --clean --if-exists lets-evaluate.dump

# 3. Update Vercel env DATABASE_URL and redeploy
```

Resume files (if using S3): sync bucket separately (`aws s3 sync`).

## Migrate from Streamlit app

1. Deploy new schema: `npm run db:push`
2. Seed org: `npm run db:seed`
3. Point `LEGACY_DATABASE_URL` at old DB (or same DB before cutover)
4. Run: `npm run migrate:streamlit`

## Deploy to Vercel + Neon

1. Create a [Neon](https://neon.tech) project and copy `DATABASE_URL`.
2. In `web/`, run `vercel link` and add env vars in the Vercel dashboard:
   - `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `OPENAI_API_KEY`
3. Apply schema: `npm run db:push` (or `npm run db:migrate` for SQL migrations in `drizzle/`)
4. Seed org: `npm run db:seed`
5. Deploy: `vercel deploy --prod` or use `bash scripts/deploy.sh`

See [docs/cloud-migration.md](docs/cloud-migration.md) for Neon → Azure Postgres cutover.

## Roles & workflow

| Role | Capabilities |
|------|----------------|
| `ta` | Screen candidates, assign interviewers, view team pipeline |
| `interviewer` | See assigned candidates, submit interview review |
| `admin` | Setup + all TA capabilities |

**Flow:** TA screening → decision (proceed/hold/reject) → assign interviewer → interview review → team feed

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run db:push` — apply Drizzle schema
- `npm run db:generate` — generate SQL migrations
- `npm run db:seed` — create default organization
- `npm run migrate:streamlit` — import legacy data
