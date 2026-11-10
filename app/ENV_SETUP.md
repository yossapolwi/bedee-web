# Required environment variables

Use **Node.js 26.x** locally (`nvm use` in `app/` reads `.nvmrc`). The repo declares
`engines.node` `26.x` for tooling consistency. **Vercel** (`gitcwits-projects/bedee-web`)
may still run **24.x** until the project dashboard / CLI exposes 26.x — check Project
Settings → Node.js Version before deploying with 26-only APIs.

Create a local `.env` file (never commit it) with:

```
# Postgres connection string (pooled, port 6543) — get from Supabase dashboard:
# Project Settings > Database > Connection string > Connection pooling > URI
# Project ref: ohnrtwjchdlhxmawzzfr (bedee-web, ap-southeast-1)
DATABASE_URI=postgresql://postgres.ohnrtwjchdlhxmawzzfr:[YOUR-DB-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# Generate with: openssl rand -hex 32 — never reuse across environments
PAYLOAD_SECRET=

# Vercel Blob storage token (Vercel dashboard > Storage > create Blob store)
BLOB_READ_WRITE_TOKEN=

NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

The Supabase DB password is never exposed via MCP tooling (by design) — get it
from the Supabase dashboard yourself: Project Settings > Database > Reset
database password if you don't have it, then use the "Connection pooling"
URI (port 6543, not 5432 — Vercel's serverless functions need the pooled
connection, the direct one exhausts Postgres's connection limit fast).

Set the same three vars (`DATABASE_URI`, `PAYLOAD_SECRET`, `BLOB_READ_WRITE_TOKEN`)
in Vercel: Project Settings > Environment Variables, for both Production and
Preview environments.

## Shared CMS (team decision)

**One Supabase database and one Vercel Blob store** for Production and Preview.
Low content volume; no separate staging CMS.

Implications:

- Payload admin saves and **published** page changes are **live** on
  https://www.bedee.com right away (Preview deployments read the same data).
- Use **Pages drafts** for review, then publish when marketing approves.
- Local `app/scripts/*.ts` jobs use the same env as production when `.env` is
  pulled from Vercel — running them **changes production content**; prefer admin
  edits for copy unless you intentionally run a script.

**Code deploys** (`npm run build` on Vercel) do **not** run content scripts or
`payload migrate` automatically.

## Vercel CLI (local)

Production deploys use **gitcwit's projects** → project **`bedee-web`** (root
directory `app`, https://www.bedee.com). Link from `app/`, not the repo root:

```bash
cd app
vercel link --yes --project bedee-web --scope gitcwits-projects
vercel env pull .env --environment=production
```

Linking under a personal Vercel team creates a stray project without production
env vars.

## One-time: create the database schema

Vercel's serverless filesystem is read-only, so Payload's `push` schema-sync
does not work there. Run this once, locally, against the real database (use
the exact same three env var values you set in Vercel):

```bash
cd app
DATABASE_URI="<paste pooled connection string>" \
PAYLOAD_SECRET="<same value as in Vercel>" \
BLOB_READ_WRITE_TOKEN="<same value as in Vercel>" \
npx payload migrate:create initial

DATABASE_URI="<paste pooled connection string>" \
PAYLOAD_SECRET="<same value as in Vercel>" \
BLOB_READ_WRITE_TOKEN="<same value as in Vercel>" \
npx payload migrate
```

Commit the generated `src/migrations/` files afterward — they're the schema
history and let future deploys run `payload migrate` cleanly instead of
guessing at schema state.

## Ongoing schema changes (new blocks, fields, collections)

Payload uses `push: false` in `src/payload.config.ts`. After any schema edit under
`src/collections/`, `src/blocks/`, or `payload.config.ts`:

```bash
cd app
npm run generate:types
npx payload migrate:create <short_descriptive_name>
# Review the generated SQL/JSON in src/migrations/ — discuss if it looks destructive
npx payload migrate
npm run build
```

Commit `src/migrations/*` and `src/payload-types.ts` with the code that depends on
the new schema.

Recommended order for a **new block type** (e.g. `introCta`):

1. Merge code + migration files.
2. Run `npx payload migrate` against the shared database (once).
3. Add or update page layout in Payload admin (or a one-off script, if agreed).

Until migrate runs, admin may error when saving layouts that use the new block;
the public site may simply skip unknown blocks if old code is still deployed.

## Breaking vs non-breaking migrations

Discuss with the team **before** implementing or running migrations that are
**breaking** (data loss risk, admin failures, or silent missing sections):

| Breaking (discuss first) | Usually safe |
|--------------------------|--------------|
| Remove/rename fields or block slugs | New optional field |
| Remove select/enum values in use | New block type + migration |
| `required: true` on existing fields without backfill | New select option |
| Drop collections or tables | New collection |
| Bulk rewrite all pages via script | Idempotent single-page script |

Agents and contributors should call out breaking work in PR/commit notes. See
`AGENTS.md` (repository root) for agent review expectations.

## Safe content vs safe code

| Change | Where to do it | Affects live CMS? |
|--------|----------------|-------------------|
| Hero copy, layout blocks, SEO text | Payload admin (draft → publish) | Yes, on publish |
| New section UI, block renderer | Git → deploy | No (until editor uses it) |
| Bulk layout repair, imports | `app/scripts/` (manual) | Yes, immediately |
| DB tables for new blocks | `payload migrate` (manual) | Schema only; plan editor impact |

Repository agents: default to **CMS field instructions** for marketing copy; use
**code + migration** for new block types; **warn before breaking migrations**.
