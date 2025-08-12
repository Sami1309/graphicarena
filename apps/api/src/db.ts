import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type CachedComparison = {
  id: string
  prompt: string
  left_model: string
  right_model: string
  left_code: string
  right_code: string
  enabled: boolean
}

export type CachedPrompt = {
  id: string
  prompt: string
  enabled: boolean
  snippets_count?: number
}

export type CachedSnippet = {
  id: string
  cached_id: string
  model: string
  code: string
  enabled: boolean
}

function getClient(url?: string | null, key?: string | null): SupabaseClient | null {
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function env(name: string, fallback?: string): string | null {
  return (process.env[name] || (fallback ? process.env[fallback] : undefined) || null) as string | null
}

export function getServiceSupabase() {
  const url = env('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL')
  const key = env('SUPABASE_SERVICE_KEY')
  return getClient(url, key)
}

export function getPublicSupabase() {
  // Prefer explicit anon key, fallback to service key if present
  const url = env('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL')
  const key = env('SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY') || env('SUPABASE_SERVICE_KEY')
  return getClient(url, key)
}

export async function listCachedComparisons(): Promise<CachedPrompt[]> {
  const sb = getPublicSupabase()
  if (!sb) return []
  // Try new structure first
  const res = await sb
    .from('cached_prompts')
    .select('id,prompt,enabled, cached_snippets:cached_snippets(count)')
    .eq('enabled', true)
    .limit(50)
  if (!res.error && res.data) {
    return (res.data as any[]).map((r) => ({ id: r.id, prompt: r.prompt, enabled: r.enabled, snippets_count: (r.cached_snippets?.[0]?.count ?? 0) }))
  }
  // Fallback to old table
  const { data, error } = await sb.from('cached_comparisons').select('id,prompt,enabled').eq('enabled', true).limit(20)
  if (error) throw error
  return (data as any[]).map((r) => ({ id: r.id, prompt: r.prompt, enabled: r.enabled }))
}

export async function getCachedComparison(id: string): Promise<{ left_code: string; right_code: string; left_model: string; right_model: string } | null> {
  const sb = getPublicSupabase(); if (!sb) return null
  // Try new tables: pick two random snippets for the cached prompt
  const { data: promptRow } = await sb.from('cached_prompts').select('id').eq('id', id).maybeSingle()
  if (promptRow?.id) {
    const { data: snippets } = await sb
      .from('cached_snippets')
      .select('model,code')
      .eq('cached_id', id)
      .eq('enabled', true)
      .limit(20)
    if (snippets && snippets.length >= 2) {
      const shuffled = [...snippets].sort(() => Math.random() - 0.5)
      const [a, b] = shuffled
      return { left_code: a.code, right_code: b.code, left_model: a.model, right_model: b.model }
    }
  }
  // Fallback to old table
  const { data, error } = await sb.from('cached_comparisons').select('*').eq('id', id).single()
  if (error || !data) return null
  return { left_code: (data as any).left_code, right_code: (data as any).right_code, left_model: (data as any).left_model, right_model: (data as any).right_model }
}

export async function ensureTemplate(slug: string, title: string): Promise<string | null> {
  const sb = getServiceSupabase(); if (!sb) return null
  const { data } = await sb.from('templates').select('id').eq('slug', slug).maybeSingle()
  if (data?.id) return data.id
  const { data: ins } = await sb.from('templates').insert({ slug, title, enabled: true, version: 1 }).select('id').single()
  return ins?.id ?? null
}

export async function ensureModel(slug: string): Promise<string | null> {
  const sb = getServiceSupabase(); if (!sb) return null
  const { data } = await sb.from('models').select('id').eq('slug', slug).maybeSingle()
  if (data?.id) return data.id
  const provider = slug.split('/')[0] || 'unknown'
  const name = slug
  const { data: ins } = await sb.from('models').insert({ slug, name, provider, active: true }).select('id').single()
  return ins?.id ?? null
}

export async function insertMatchRec(args: { prompt: string; template_id: string | null; left_model_id: string | null; right_model_id: string | null; }): Promise<string | null> {
  const sb = getServiceSupabase(); if (!sb) return null
  const { data, error } = await sb.from('matches').insert({
    prompt: args.prompt,
    template_id: args.template_id,
    left_model_id: args.left_model_id,
    right_model_id: args.right_model_id,
    status: 'ready',
  }).select('id').single()
  if (error) return null
  return data.id
}

export async function insertGenerationRec(args: { match_id: string; model_id: string | null; code: string; error?: string | null }): Promise<void> {
  const sb = getServiceSupabase(); if (!sb) return
  await sb.from('generations').insert({ match_id: args.match_id, model_id: args.model_id, code: args.code, error: args.error ?? null })
}

export async function upsertElo(model_id: string, delta: number): Promise<void> {
  const sb = getServiceSupabase(); if (!sb) return
  const { data } = await sb.from('elo_ratings').select('rating,games').eq('model_id', model_id).maybeSingle()
  const rating = Math.round((data?.rating ?? 1500) + delta)
  const games = (data?.games ?? 0) + 1
  if (data) {
    await sb.from('elo_ratings').update({ rating, games, updated_at: new Date().toISOString() }).eq('model_id', model_id)
  } else {
    await sb.from('elo_ratings').insert({ model_id, rating, games })
  }
}

export async function insertVoteRec(args: { match_id: string; winner_model_id: string; loser_model_id: string; side: 'left'|'right' }): Promise<void> {
  const sb = getServiceSupabase(); if (!sb) return
  await sb.from('votes').insert({ match_id: args.match_id, winner_model_id: args.winner_model_id, loser_model_id: args.loser_model_id, side: args.side })
}
