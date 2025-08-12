# Repository Guidelines

This repo implements graphicarena.ai: a blind, side‑by‑side animated graphics arena (Vite + React + Remotion Player; Hono API; Supabase). INIT.md is the source of truth—update it when changing behavior.

## Project Structure & Module Organization

Suggested layout aligning to INIT.md:

```
apps/
  web/       # Vite + React UI (Remotion Player only)
  api/       # Hono (TypeScript) API
supabase/    # SQL, seeds, RLS policies
templates/   # Remotion templates (Template.tsx, props.schema.ts/.json)
scripts/     # dev tools, seed, lint
tests/       # unit/integration; e2e/ for Playwright
```

## Build, Test, and Development Commands

- Install: `npm install` (or `pnpm install`)
- Dev UI: `npm run dev:web` (serves Vite at 5173)
- Dev API: `npm run dev:api` (Hono with watch)
- Run both: `npm run dev`
- Build: `npm run build` (builds web and api)
- Unit/Integration: `npm test` (watch with `npm run test:watch`)
- E2E: `npm run e2e` (Playwright)
- Lint/Format: `npm run lint` / `npm run format`

Add these scripts to the root or per‑app `package.json` if missing.

## Coding Style & Naming Conventions

- TypeScript everywhere; 2‑space indentation; semicolons on; single quotes.
- Files: kebab‑case (`match-service.ts`), components PascalCase (`Template.tsx`).
- Tests: colocate as `*.test.ts` or under `tests/` mirroring paths.
- Use ESLint + Prettier; fix before PRs (`npm run lint && npm run format`).
- Template contract: only pure `Template.tsx` + validated `props` (see INIT.md §4).

## Testing Guidelines

- Unit: validators, Elo math, reducers (Vitest/Jest acceptable).
- Integration: API flows (`/api/match → SSE → /api/vote`).
- E2E: Playwright scripts under `tests/e2e/` covering prompt, reveal, follow‑up.
- Coverage: target 80%+ for core modules; run `npm run coverage` if configured.

## Commit & Pull Request Guidelines

- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`; imperative mood.
- PRs include: purpose, linked issue, screenshots or logs, and risk notes.
- Update `INIT.md` when altering flows, routes, or data model.
- CI must pass lint, build, and tests before merge.

## Security & Configuration Tips

- Never commit secrets; use `.env.*` for `SUPABASE_*`, provider keys, CSP origins.
- Enforce RLS on all tables; validate all `props` against schema; sanitize strings.
- LLM adapters must return TemplateProps JSON only—no code or URLs.
