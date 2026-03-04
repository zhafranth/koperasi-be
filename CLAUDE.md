# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev              # Start dev server (nodemon + tsx, port 3000)
yarn build            # TypeScript compile
yarn migrate          # Run pending Knex migrations
yarn migrate:rollback # Rollback last migration batch
yarn seed             # Run Knex seeds
npx knex migrate:make <name> -x ts  # Create new migration
```

Requires `.env` with `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET` (MySQL on localhost).

## Architecture

Entry point: `server.ts` → imports Express app from `src/index.ts` → listens on port 3000.

```
src/
  index.ts          Express app, route registration
  middleware/       authMiddleware.ts (JWT verification)
  routes/           Express Router per domain
  controllers/      Thin HTTP handlers (parse req, call Model, return res)
  models/           Knex query logic + business rules (all static methods)
db/
  index.ts          Knex instance (imports knexfile.ts)
  migrations/       Timestamped migration files
```

Request flow: `Route → Controller → Model (Knex)`

## Key Patterns

**DB access**: Import `db` from `../../db` (Knex instance). All queries in Model static methods.

**Auth**: `authenticateToken` middleware in `src/middleware/authMiddleware.ts`. Applied per-router in `src/index.ts`. Exception: `/simpanan/chart` is registered as a bare GET route *before* `app.use("/simpanan", authenticateToken, ...)` — this ordering is intentional and must be preserved.

**Error handling**: Models `throw new Error("message")` for business rule violations. Controllers wrap in try/catch and return `res.status(500).json({ message: error?.message })`. Business errors surface with their message to the client.

**Transactions**: Every financial operation that touches multiple tables uses `db.transaction(async (trx) => { ... })`. Always insert into `transaksi` table within the same transaction as the primary record.

**Penarikan sumber**: `infaq` and `sukarela` are "dana koperasi" — `id_anggota` must be `null`. `simpanan` and `liburan` are per-anggota — `id_anggota` is required. The `SUMBER_KOPERASI` constant in `Penarikan.ts` controls this logic.

## Important Notes

- `bulan` and `tahun` columns in `simpanan` are **VARCHAR**, not INT. Use `String(tahun)` in WHERE clauses and `Number(r.bulan)` when building Map keys.
- No test suite exists. Manual testing via API calls.
- For ALTER ENUM in migrations, use `knex.raw()` — Knex does not support it natively.
- The parent `../CLAUDE.md` contains the full database schema, business rules, and API endpoint reference.
