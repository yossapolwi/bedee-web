# Repository guide

## Project layout

- The application lives in `app/`; run Node.js and npm commands from that directory.
- Target **Node.js 26.x** (see `app/.nvmrc` and `app/package.json` `engines`).
- This is a Next.js 15 application using React 19, TypeScript, Tailwind CSS 3, and Payload CMS 3.
- Payload collections, globals, access rules, and configuration live under `app/src/`.
- Planning and content-model documents live in `plans/`.
- Repository-specific agent skills live in `.agents/skills/` and are discovered by Codex automatically.

## Working agreements

- Use npm and preserve `app/package-lock.json`.
- Do not read, print, commit, or overwrite secrets from `app/.env`.
- Keep environment setup instructions in `app/ENV_SETUP.md`; never add real credentials to documentation or examples.
- Preserve unrelated working-tree changes.
- Treat `app/src/app/(payload)/admin/importMap.js`, `app/src/payload-types.ts`, and migration files as generated artifacts. Regenerate them through Payload commands when their source configuration changes instead of hand-editing them.
- Keep frontend routes and components in `app/src/app/(frontend)/`; keep Payload admin integration in `app/src/app/(payload)/`.
- The Payload default locale is Thai (`th`). Keep localized content fields compatible with the content model in `plans/payload-content-model.md`.

## CMS environment (single database)

Preview and Production on Vercel use the **same** Supabase Postgres and Vercel Blob
(`DATABASE_URI`, `BLOB_READ_WRITE_TOKEN` — see `app/ENV_SETUP.md`). CMS edits,
`payload migrate`, and local `app/scripts/*` content jobs all affect **live**
www.bedee.com immediately. The team keeps this setup (small team, low content churn).

### Safe changes (usually no discussion required)

- **Frontend only** — components, styles, routing, block rendering under
  `app/src/app/(frontend)/` and `app/src/blocks/components/` with **no** Payload
  schema changes.
- **Optional new fields** on existing blocks/collections (editors can leave them
  empty; old documents stay valid).
- **New block types** when paired with a committed Payload migration, types
  regeneration, and `RenderBlocks` support — existing pages keep working until an
  editor adds the block.
- **Copy and layout** — prefer **Payload admin** (Pages drafts, then publish).
  Do not run one-off content scripts against the shared database unless the
  human explicitly asked for a automated bulk update.

### Content scripts (`app/scripts/`)

- Treat as **manual, production-affecting** tools — they are **not** run on Vercel
  deploy.
- Scripts must be **idempotent** where possible and **fail loudly** on unexpected
  layout (match patterns in `fix-telepharmacy-*.ts`).
- Never commit credentials; use `--env-file=.env` only locally.
- For telepharmacy/marketing copy, default guidance: **tell the user which CMS
  fields to edit** unless they asked for a script.

### Schema and migrations (`push: false`)

When changing `app/src/collections/`, `app/src/blocks/`, or `payload.config.ts`:

1. `npm run generate:types`
2. `npx payload migrate:create <short_name>` (from `app/`, with production-equivalent env)
3. Commit `app/src/migrations/*` and updated `app/src/payload-types.ts`
4. Run `npx payload migrate` against the shared database **before** relying on new
   fields/blocks in admin (see `app/ENV_SETUP.md`).

### Breaking migrations — warn and discuss first

**Stop and surface a short risk note for the human** before implementing any change
that likely needs a **breaking** migration or irreversible data touch. Examples:

- Removing or renaming block slugs, collection fields, or globals (orphaned JSON
  in `layout`, failed admin saves, blocks silently not rendering).
- Narrowing `select` options or deleting enum values still present in stored rows.
- `required: true` on existing fields without a backfill plan.
- Renaming block types without a data migration (treat as a new block + move
  content, not a silent rename).
- Dropping tables/collections or bulk-updating every page via script without backup.
- Anything that rewrites all `pages.layout` or media IDs in ways that are hard to undo.

**Non-breaking** (still needs `migrate:create`, but usually proceed):

- Adding a new block type, new optional field, or new collection.
- Adding select options; widening defaults.

If unsure, classify as breaking and ask.

## Validation

From `app/`, use the smallest relevant checks:

```bash
npm run build
```

When Payload schemas or configuration change, also run:

```bash
npm run generate:types
```

There are currently no repository scripts for linting or automated tests. Do not claim those checks passed unless such scripts are added and run.

## Code review rules

- Flag exposed credentials or committed environment files.
- Flag Payload schema changes that leave generated types or required migrations stale.
- Flag **breaking** schema or content-script changes without an agreed migration/backfill plan (see **Breaking migrations** above).
- Flag new `app/scripts/*` that mutate live CMS data without idempotency or clear abort conditions.
- Flag changes that break the legacy `/articles/:category/:slug` redirect.
- Flag changes that assume a direct Postgres connection in Vercel; this project uses the pooled Supabase connection documented in `app/ENV_SETUP.md`.
