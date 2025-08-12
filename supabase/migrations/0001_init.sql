-- Core tables per INIT.md (simplified for local dev)
create table if not exists models (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  provider text not null,
  active boolean default true,
  initial_elo int default 1500
);

create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  version int default 1,
  json_schema jsonb,
  enabled boolean default true
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  template_id uuid references templates(id),
  left_model_id uuid references models(id),
  right_model_id uuid references models(id),
  left_first boolean default true,
  status text default 'ready',
  created_by uuid,
  parent_match_id uuid,
  created_at timestamptz default now()
);

create table if not exists generations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id),
  model_id uuid references models(id),
  props_json jsonb,
  code text,
  cost_cents int,
  duration_ms int,
  error text,
  created_at timestamptz default now()
);

create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id),
  winner_model_id uuid references models(id),
  loser_model_id uuid references models(id),
  side text,
  voter_id uuid,
  fingerprint_hash text,
  ip_hash text,
  created_at timestamptz default now()
);

create table if not exists elo_ratings (
  model_id uuid primary key references models(id),
  rating int not null,
  games int default 0,
  updated_at timestamptz default now()
);

create table if not exists cached_comparisons (
  id text primary key,
  prompt text not null,
  left_model text not null,
  right_model text not null,
  left_code text not null,
  right_code text not null,
  enabled boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_votes_match on votes(match_id);
create index if not exists idx_generations_match on generations(match_id);
create index if not exists idx_matches_status on matches(status);
create index if not exists idx_elo_ratings_rating on elo_ratings(rating desc);
create extension if not exists pgcrypto;
