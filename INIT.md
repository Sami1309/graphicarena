# Graphicarena.ai — Ground Truth Development Plan

This document is the authoritative plan for building **graphicarena.ai**: a blind, side‑by‑side animated graphics arena where users submit prompts, compare two LLM‑generated animations (via Remotion **Player**), vote, optionally submit follow‑ups, and watch an **Elo**‑based leaderboard evolve. It assumes:

* **Frontend**: Vite + React + Remotion **Player** only (no server video rendering for MVP)
* **Backend**: Node.js + **Hono** (TypeScript)
* **Data**: **Supabase** (Postgres + Auth + Storage + Realtime)
* **Hosting**: Render (Static site for UI, Web Service for API)
* **LLMs**: pluggable via a narrow JSON interface (providers optional and swappable)
* **No paid infra add‑ons** beyond what’s already planned (Remotion is OK)

---

## 1) High‑level architecture

```
[Browser / Vite-React]
  ├─ Home (Prompt -> Match)
  │    ├─ SSE progress (job status)
  │    ├─ Two <Player> instances (anonymous props)
  │    └─ Vote -> Reveal models
  ├─ Follow-up editor (delta)
  └─ Leaderboard (Elo)

[Hono API, Node.js]
  ├─ /api/match (create + start generation)
  ├─ /api/match/:id/stream (SSE status/ready)
  ├─ /api/vote (record vote + Elo update)
  ├─ /api/followup (spawn new match)
  ├─ /api/leaderboard (cached)
  ├─ /api/templates (schemas + metadata)
  └─ Provider adapters (LLM -> TemplateProps JSON)

[Supabase]
  ├─ Postgres (tables, RLS)
  ├─ Auth (optional login; anonymous play allowed)
  ├─ Storage (presets, images, optional thumbs)
  └─ Realtime (optional UI live updates)
```

**MVP simplification**: No external queue service. Generation runs inside the API process using cooperative concurrency (semaphore) and SSE to the client. Phase‑2 can swap in a Postgres‑backed queue (pg‑boss/Graphile Worker) without API changes.

---

## 2) Core user flows

1. **Prompt → Match**

   * User picks a **template** and submits a prompt (optionally with seed parameters). API creates a `match`, assigns two models (randomized left/right), validates prompt, enforces limits, and starts two generation tasks (concurrently).
   * Client connects to `/api/match/:id/stream` via **SSE** to get progress events and finally two **validated** `props_json` for the selected template. Model identities remain hidden.

2. **Vote → Reveal**

   * User votes for Left/Right. API records a `vote`, updates Elo for winner/loser **transactionally**, then returns **reveal** (model names + deltas). Client displays identity badges.

3. **Follow‑up**

   * User submits a short modification text. API merges into the original prompt context, creates a new `match` referencing the parent, and repeats the generation flow.

4. **Leaderboard**

   * Ranks by Elo (`elo_ratings` table), with pagination and confidence metadata. Cached at API for short TTLs.

---

## 3) Data model (Postgres / Supabase)

> All tables have **RLS enabled**. Public reads are allowed for safe views (leaderboard, templates), writes are restricted. Anonymous votes may be allowed with spam controls.

* **models**

  * `id uuid PK`, `slug text unique`, `name text`, `provider text`, `active boolean`, `initial_elo int default 1500`

* **templates**

  * `id uuid PK`, `slug text unique`, `title text`, `version int`, `json_schema jsonb` (JSON Schema for props), `enabled boolean`

* **matches**

  * `id uuid PK`, `prompt text`, `template_id uuid FK`,
  * `left_model_id uuid FK`, `right_model_id uuid FK`, `left_first boolean` (randomized order),
  * `status text` CHECK in ('queued','running','ready','failed','cancelled'),
  * `created_by uuid nullable`, `parent_match_id uuid nullable`,
  * timestamps + `expires_at timestamptz nullable`

* **generations**

  * `id uuid PK`, `match_id uuid FK`, `model_id uuid FK`,
  * `props_json jsonb` (validated against template schema),
  * `cost_cents int`, `duration_ms int`, `error text nullable`, timestamps

* **votes**

  * `id uuid PK`, `match_id uuid FK`, `winner_model_id uuid FK`, `loser_model_id uuid FK`,
  * `side text` CHECK in ('left','right'), `voter_id uuid nullable`,
  * `fingerprint_hash text nullable`, `ip_hash text nullable`, timestamps

* **elo\_ratings**

  * `model_id uuid PK FK`, `rating int`, `games int`, `updated_at timestamptz`

* **elo\_history** (optional)

  * `id uuid PK`, `model_id uuid FK`, `rating int`, `delta int`, `vote_id uuid FK`, timestamp

* **presets** (fallback content)

  * `id uuid PK`, `template_id uuid FK`, `title text`, `props_json jsonb`, `weight int`, `enabled boolean`

**Indexes**: `votes(match_id)`, `generations(match_id,model_id)`, `matches(status)`, `elo_ratings(rating desc)`, hash indexes for `ip_hash` if needed.

**RLS policy highlights**:

* `select` on public tables (`templates`, leaderboard view) open.
* `insert` on `votes` allowed for anon with per‑IP rate checks via RPC or constraints; `voter_id` path requires auth.
* `insert` on `matches` allowed for anon with rate limits; heavier quotas if logged‑in.
* Service role (server) performs privileged writes via API only (not exposed to browsers).

---

## 4) Templates & safety contract

**Non‑negotiable rule**: Models **do not emit code**. They only return **TemplateProps JSON** matching the template schema. The UI renders with Remotion **Player** using those props.

* Each template ships with:

  * `props.schema.ts` (Zod) + `props.schema.json` (JSON Schema) and runtime validator (AJV or Zod)
  * `Template.tsx` — a pure, deterministic Remotion composition component
  * Guardrails in the schema: numeric min/max, string length caps, allowed enums, palette pickers, etc.
  * Any **rich text** fields are sanitized (DOMPurify) before rendering.

**Starter templates (MVP)**:

1. **Kinetic Type** – animated text with timing marks, palette, easing, per‑word effects
2. **Bar Chart Pulse** – 3–8 categories, values over 3–6 beats, auto‑scales, color ramp
3. **Orbiting Icons** – 3–6 SVG/icon glyphs, orbits, labels, camera wobble

---

## 5) Hono API (TypeScript)

**Routes**

* `POST /api/match` → `{ prompt: string, template: string, models?: string[], parent_match_id?: string }`

  * Validates prompt & template
  * Picks model pair (or honors override)
  * Inserts `match`, sets `status='running'`
  * Kicks off internal generation tasks (two LLM calls in parallel)
  * Returns `{ id }`

* `GET /api/match/:id/stream` (SSE)

  * Emits events: `queued` → `left:started` → `right:started` → `left:ready`/`right:ready` → `ready`
  * Final payload includes **two** `props_json` (anonymous) + `replaySeed`

* `POST /api/vote` → `{ match_id, winner: 'left'|'right' }`

  * Writes `votes` (with fingerprint/IP hashes if anon)
  * **Transactional Elo update** on winner/loser rows
  * Response: `{ reveal: { leftModel, rightModel }, elo: { deltas } }`

* `POST /api/followup` → `{ parent_match_id, modification_text }`

  * Creates a new `match` inheriting context + delta

* `GET /api/leaderboard` → top N by Elo (cached)

* `GET /api/templates` → array of templates with JSON Schemas and UI metadata

**Middleware (app‑wide)**

* request id, logger (dev), body size limit, CORS, **secure headers/CSP**, timeout, basic rate limits

**Internal helpers**

* `moderate(text) -> pass|block|transform`
* `validateProps(schema, candidate)` → throws on failure
* `renderPlan(prompt, template, model)` → calls provider, returns props JSON
* `updateElo(winnerId, loserId)` → K‑factor rule

---

## 6) Generation orchestration (no external queue)

* In‑process **semaphore** (e.g., max 8 concurrent generations per instance)
* Each `/api/match` schedules two tasks under the semaphore, pushes **SSE** updates, and writes `generations` rows as they complete
* If the semaphore is saturated or model/provider timeouts occur, reply with `status='queued'` and suggest **presets**; client can continue via presets while the match cooks in the background
* Timeouts + retries with jitter per provider

**Upgrade path** (drop‑in, later): Postgres‑backed queue (e.g., **pg‑boss**/**Graphile Worker**) processed by a worker process. API unchanged.

---

## 7) Rate limiting & quotas (no Redis)

* **Per‑IP** and **per‑account** budgets using a Postgres‑backed limiter or table‑driven counters

  * Memory limiter for dev only; **production uses Postgres‑backed tokens** to work across instances
* Endpoint tiers:

  * `/api/match`: strict (e.g., 10/day anon, 50/day authed)
  * `/api/vote`: moderate (e.g., 120/hour), with duplicate‑vote prevention per `match_id + fingerprint`
  * `/api/followup`: same as `/api/match`
* Request **size limits** and **request timeout** middleware

---

## 8) Moderation & abuse prevention

* **Moderate** prompts and model output text before accepting
* **Schema clamp**: all props validated against JSON Schema (or Zod) with safe defaults and max lengths
* **No code execution**; no URLs in props; strings sanitized before rendering
* **Content Security Policy** via secure headers; `nonce` for any inline styles if needed
* **Anonymous controls**: hashed IP/UA fingerprints to deter spam; bot‑like patterns gated behind CAPTCHA

---

## 9) Elo rating rules

* Rating starts at **1500**
* After each vote, compute expected scores and apply `K` (start with 24; taper as `games` grows)
* Write `elo_ratings` in a transaction; optionally append to `elo_history`

---

## 10) Frontend (Vite + React + Remotion Player)

* Pages: Home (prompt + side‑by‑side), Reveal + Follow‑up, Leaderboard, Template Gallery
* State: TanStack Query for data fetching; SSE via `EventSource`
* Remotion `Player` x2 with identical size/fps; controlled play; ready state only when both props validated
* UX: Progress indicators per side; skeletons; reveal animation; quick “Try a preset” button during high load

---

## 11) Fallbacks & presets

* Ship curated **presets** per template in Supabase Storage and `presets` table with weights
* When queue/timeouts exceed thresholds, show a preset battle immediately while the user’s match continues in the background (SSE keeps updating)

---

## 12) Deployment on Render

* **UI**: Static Site — build with Vite, served via CDN
* **API**: Web Service — Node 20+, single instance to start (autoscale later)
* Env vars: Supabase URL/anon key/service key (server side only), provider API keys, rate limits, CSP origins
* Health check: `/healthz`
* Optional (later): Cron Job (nightly sanity checks, cleanup), second API instance for HA, worker service for queued jobs

---

## 13) Local dev

* `docker compose` for Supabase local or use hosted project dev schema
* `.env.development` for keys; never commit service keys
* Seed script: creates basic `models`, `templates`, and a few `presets`

---

## 14) Testing & quality

* **Unit**: Elo math, validators (Zod/AJV), moderation decisions, template reducers
* **Integration**: arena loop (`/match` → SSE → `/vote`), reveal logic, RLS access
* **E2E**: Playwright — prompt, watch animations, vote, reveal, follow‑up
* **Load**: Artillery — `/api/match` and `/api/vote` under concurrent users; observe latencies and error rates
* **Security**: XSS fuzzing against template text fields; header checks; CORS tests

---

## 15) Observability (free‑friendly)

* Basic request logs (structured JSON) with request id
* OpenTelemetry traces exported to console (local) or a free backend you control; client performance marks for generation durations
* Minimal error reporting hook (pluggable)

---

## 16) Milestones (2 weeks to MVP)

**Day 1–2**: Repos, CI, Hono skeleton, Supabase schema + RLS, seed data, template scaffolds (3)

**Day 3–5**: `/api/match` + SSE; provider adapter interface; validation + moderation; Remotion Players rendering from static props

**Day 6–7**: Voting endpoint + Elo; reveal UI; Leaderboard endpoint + page (cached)

**Day 8–9**: Rate limits (Postgres‑backed), timeouts, presets & fallback UX

**Day 10–11**: Testing (unit/integration/E2E), load test baseline, polish templates

**Day 12–14**: Deploy on Render (UI + API), domain + TLS, analytics hooks, smoke tests, launch checklist

---

## 17) Concrete implementation notes & snippets

### 17.1 Hono bootstrapping (pseudo‑code)

```ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { timeout } from 'hono/timeout'

const app = new Hono()
app.use('*', secureHeaders({ /* CSP with allowed origins */ }))
app.use('*', cors({ origin: ['https://graphicarena.ai', 'http://localhost:5173'] }))
app.use('*', timeout(15000)) // 15s per request

// ... routes
export default app
```

### 17.2 SSE outline

```ts
import { streamSSE } from 'hono/streaming'

app.get('/api/match/:id/stream', (c) => {
  return streamSSE(c, async (stream) => {
    await stream.writeSSE({ event: 'queued', data: '...' })
    // emit progress as tasks run
    // await stream.writeSSE({ event: 'left:ready', data: JSON.stringify(propsL) })
    // await stream.writeSSE({ event: 'right:ready', data: JSON.stringify(propsR) })
    // await stream.writeSSE({ event: 'ready', data: JSON.stringify({ done: true }) })
  })
})
```

### 17.3 Template validation contract

```ts
// Example: Kinetic Type schema (Zod)
const KineticProps = z.object({
  lines: z.array(z.string().min(1).max(80)).min(1).max(6),
  palette: z.enum(['sunset','aqua','grape','mono']),
  bpm: z.number().int().min(60).max(180).default(120),
  seed: z.number().int().min(0).max(1_000_000).optional()
})
```

LLM adaptor **must** return `{ template: 'kinetic', props: KineticProps }`. Reject otherwise.

### 17.4 Elo update

```sql
-- in a transaction
select rating from elo_ratings where model_id = :winner for update;
select rating from elo_ratings where model_id = :loser for update;
-- compute expected, apply K, update rows, insert elo_history
```

### 17.5 Rate limiting sketch (Postgres tokens)

* Table `ratelimits(key text, window_start timestamptz, count int)`
* Upsert within a transaction, reset when window slides
* Key can be `ip:route` for anon, `user:route` for authed

---

## 18) Config & environment

* `PUBLIC_ORIGIN` (UI), `API_ORIGIN`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
* Provider keys (kept server‑side)
* Rate limits, timeouts, semaphore sizes, CSP directives, template flags

---

## 19) Launch checklist

* [ ] RLS enabled and audited on all tables
* [ ] CORS origins tightened
* [ ] CSP tested, no inline scripts without nonce
* [ ] Vote spam controls working; duplicate‑vote checks in place
* [ ] Leaderboard cached; DB slow queries reviewed
* [ ] Presets populate when load is high or timeouts occur
* [ ] Playwright E2E happy path green; Artillery baseline recorded
* [ ] Backups configured; keys rotated; minimal logs with no PII

---

## 20) Phase‑2 enhancements (drop‑in)

* Swap in a **Postgres job queue** (pg‑boss / Graphile Worker) for cross‑instance processing
* Add Supabase **Realtime** to push leaderboard updates live
* Add downloadable MP4s via Remotion render server (optional)
* A/B test template defaults; add model pools and banlists per template
* Add ranking confidence intervals and min‑games thresholds

---

**This plan is the source of truth**. PRs changing behavior should update this doc first. If a decision isn’t here, it didn’t happen.
