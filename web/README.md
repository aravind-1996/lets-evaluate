# Let's Evaluate — Next.js (web)

Modern org-ready rewrite with configurable white-label branding.

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

See [`.env.example`](.env.example) for the full template. Copy it to `.env.local` and customize for your organization.

### Core

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | 32+ char random string (`openssl rand -base64 32`) |
| `AUTH_URL` | Prod | Public app URL (e.g. `https://evaluate.yourcompany.com`) |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `OPENAI_ANALYSIS_MODEL` | No | Resume screening model (default `gpt-4o`) |
| `OPENAI_MODEL` | No | Questions/notes model (default `gpt-4o-mini`) |

### Organization & domain (one org per deployment)

| Variable | Required | Description |
|----------|----------|-------------|
| `ORG_SLUG` | No | URL-safe org identifier (default `kanini`) |
| `ORG_NAME` | No | Display name (default `KANINI`) |
| `ALLOWED_EMAIL_DOMAIN` | No | Restrict register/login (e.g. `yourcompany.com`) |
| `NEXT_PUBLIC_EMAIL_DOMAIN` | No | Same domain for form placeholders |
| `NEXT_PUBLIC_ORG_NAME` | No | Org name in client UI (defaults to `ORG_NAME`) |

### White-label branding

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_TITLE` | App name in logo & browser tab (default `Let's Evaluate`) |
| `NEXT_PUBLIC_APP_TITLE_ACCENT` | Emphasized word in logo (default `Evaluate`) |
| `NEXT_PUBLIC_APP_DESCRIPTION` | Meta description |
| `NEXT_PUBLIC_BRAND_TAGLINE` | Landing page tagline |
| `NEXT_PUBLIC_BRAND_COPYRIGHT` | Footer copyright line |
| `NEXT_PUBLIC_BRAND_LOGO_URL` | Custom logo image URL or `/public` path |
| `NEXT_PUBLIC_BRAND_FAVICON_URL` | Custom favicon |
| `NEXT_PUBLIC_BRAND_PRIMARY` | Primary brand color (hex, default `#23b0e6`) |
| `NEXT_PUBLIC_BRAND_PRIMARY_DARK` | Darker primary (default `#1c8db8`) |
| `NEXT_PUBLIC_BRAND_PRIMARY_SOFT` | Light primary tint (auto-derived if omitted) |
| `NEXT_PUBLIC_BRAND_ACCENT` | Success/accent color (default `#61a229`) |
| `NEXT_PUBLIC_BRAND_WARNING` | Warning color (default `#e87722`) |
| `NEXT_PUBLIC_BRAND_NAVY` | Dark surface color (default `#1a2b3c`) |
| `NEXT_PUBLIC_BRAND_CREAM` | Page background (default `#fdf8f3`) |
| `NEXT_PUBLIC_BRAND_INK` | Text color (default `#292929`) |

**Example — rebrand for Acme Corp:**

```env
ORG_SLUG=acme
ORG_NAME=Acme Corp
ALLOWED_EMAIL_DOMAIN=acme.com
NEXT_PUBLIC_EMAIL_DOMAIN=acme.com
AUTH_URL=https://hiring.acme.com
NEXT_PUBLIC_APP_TITLE=Acme Hiring
NEXT_PUBLIC_APP_TITLE_ACCENT=Hiring
NEXT_PUBLIC_BRAND_TAGLINE=Hire with confidence
NEXT_PUBLIC_BRAND_COPYRIGHT=© 2026 Acme Corp
NEXT_PUBLIC_BRAND_PRIMARY=#4F46E5
NEXT_PUBLIC_BRAND_PRIMARY_DARK=#4338CA
NEXT_PUBLIC_BRAND_NAVY=#1E1B4B
```

### Storage & SSO

| Variable | Required | Description |
|----------|----------|-------------|
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
