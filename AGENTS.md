# Repository Guidelines

> This repository implements graphicarena.ai as defined in INIT.md. When behavior changes, update INIT.md first, then code.

## Project Structure & Module Organization

Expected layout (create as needed):
- `ui/` – Vite + React app using Remotion Player.
- `api/` – Hono (TypeScript) API and routes under `api/src/`.
- `templates/` – Remotion templates: each folder contains `Template.tsx`, `props.schema.ts`, and generated `props.schema.json`.
- `supabase/` – SQL migrations, RLS policies, seed scripts.
- `e2e/` – Playwright tests; `tests/` for unit/integration.
- `scripts/` – local dev, seeding, and utility scripts.
- `docs/` – planning docs (keep `INIT.md` authoritative).

## Build, Test, and Development Commands

- Install: `pnpm i` (npm/yarn also fine).
- Frontend dev: `pnpm --filter ui dev` (serves React at `localhost:5173`).
- API dev: `pnpm --filter api dev` (Hono watcher at `localhost:8787` or configured port).
- Type check: `pnpm typecheck` (runs `tsc -b`).
- Tests: `pnpm test` (Vitest/Jest; see packages for config). E2E: `pnpm --filter e2e test`.
- Supabase (local): `docker compose up -d` or `supabase start`; seed via `pnpm scripts/seed`.

## Coding Style & Naming Conventions

- TypeScript, 2‑space indent, semicolons off, single quotes.
- Lint/format: ESLint + Prettier. Run `pnpm lint` and `pnpm format` before PRs.
- Names: `camelCase` vars/functions, `PascalCase` React components, `kebab-case` filenames, `SCREAMING_SNAKE_CASE` env vars.
- API routes: `kebab-case` paths under `/api/*`.
- Templates must be pure/deterministic; props validated against schema.

## Testing Guidelines

- Unit: logic (Elo, validators, moderation). Files end with `*.spec.ts` or `*.test.tsx`.
- Integration: API flows (`/api/match → SSE → /api/vote`).
- E2E: Playwright in `e2e/` covering prompt, watch, vote, reveal, follow‑up.
- Aim for meaningful coverage on core modules; don’t chase 100%.
- Run `pnpm test` locally and ensure CI passes.

## Commit & Pull Request Guidelines

- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Small, focused commits; reference issues (`#123`).
- PRs include: summary, rationale, screenshots/video for UI, API contract notes, and migrations if any.
- If you change behavior or data shapes, update `INIT.md` in the same PR.

## Security & Configuration Tips

- Never commit service keys. Use `.env.development` locally; keep server‑only keys in API env.
- Enforce RLS in migrations; validate all template props (Zod/AJV) before render.
- Keep CSP strict; sanitize rich text; no model‑emitted code—only TemplateProps JSON.
- Rate limits and anti‑spam must stay active in all environments.

