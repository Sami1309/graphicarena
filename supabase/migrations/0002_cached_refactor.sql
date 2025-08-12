-- New structure: cached prompts with many snippets (model,code)
create table if not exists cached_prompts (
  id text primary key,
  prompt text not null,
  enabled boolean default true,
  created_at timestamptz default now()
);

create table if not exists cached_snippets (
  id uuid primary key default gen_random_uuid(),
  cached_id text not null references cached_prompts(id) on delete cascade,
  model text not null,
  code text not null,
  enabled boolean default true,
  created_at timestamptz default now()
);

-- Migrate from old cached_comparisons if present
do $$ begin
  if exists (select 1 from information_schema.tables where table_name = 'cached_comparisons') then
    insert into cached_prompts (id, prompt, enabled, created_at)
    select id, prompt, coalesce(enabled,true), created_at from cached_comparisons
    on conflict (id) do nothing;

    insert into cached_snippets (cached_id, model, code, enabled)
    select id, left_model, left_code, coalesce(enabled,true) from cached_comparisons where left_code is not null
    union all
    select id, right_model, right_code, coalesce(enabled,true) from cached_comparisons where right_code is not null;
  end if;
end $$;

