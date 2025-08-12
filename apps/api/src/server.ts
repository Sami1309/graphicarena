import 'dotenv/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { getCookie, setCookie } from 'hono/cookie'
import { SYSTEM_PROMPT, userPrompt } from './prompt.js'
import { chatComplete, listModels, OpenRouterModel } from './openrouter.js'
import { serve } from '@hono/node-server'
import { getCachedComparison, listCachedComparisons, ensureModel, ensureTemplate, insertGenerationRec, insertMatchRec, insertVoteRec, upsertElo, getPublicSupabase } from './db.js'

type Match = {
  id: string
  template: string
  prompt: string
  left: { model: string; code: string } | null
  right: { model: string; code: string } | null
  revealed: boolean
}

const app = new Hono()

app.use('*', logger())
// Dev: allow all origins to avoid local port mismatch issues
const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((s)=>s.trim())
const allowRenderWildcard = (process.env.ALLOW_RENDER || 'true') === 'true'
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return '*'
    if (allowed.includes('*') || allowed.includes(origin)) return origin
    try {
      const u = new URL(origin)
      if (allowRenderWildcard && u.hostname.endsWith('.onrender.com')) return origin
    } catch {}
    return null
  },
}))

const memory = {
  matches: new Map<string, Match>(),
  elo: new Map<string, { rating: number; games: number }>(),
  cached: [
    {
      id: 'hello-aqua',
      prompt: 'Energetic kinetic type introducing Graphicarena',
      left_model: 'anthropic/claude-3-5-sonnet',
      right_model: 'google/gemini-1.5-pro',
      left_code: `export default function Comp(){return (<div style={{width:'100%',height:'100%',background:'#000'}}/>);}`,
      right_code: `export default function Comp(){return (<div style={{width:'100%',height:'100%',background:'#000'}}/>);}`,
      enabled: true,
    },
  ] as any[],
  sessions: new Map<string, Set<string>>()
}

function getSessionId(c: any): string {
  let sid = getCookie(c, 'gaid')
  if (!sid) {
    sid = Math.random().toString(36).slice(2)
    setCookie(c, 'gaid', sid, { path: '/', httpOnly: false, maxAge: 60 * 60 * 24 * 365 })
  }
  return sid
}

function normalizePrompt(p?: string): string {
  return (p || '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 500)
}

function pickTwo<T>(arr: T[]): [T, T] {
  if (arr.length < 2) throw new Error('Need at least two models')
  const i = Math.floor(Math.random() * arr.length)
  let j = Math.floor(Math.random() * arr.length)
  if (j === i) j = (j + 1) % arr.length
  return [arr[i], arr[j]]
}

app.get('/healthz', (c) => c.text('ok'))

app.get('/api/models', async (c) => {
  const apiKey = process.env.OPENROUTER_API_KEY
  const models = await listModels(apiKey)
  return c.json({ data: models })
})

app.post('/api/match', async (c) => {
  const { prompt, template, smart } = (await c.req.json()) as {
    prompt: string
    template: string
    smart?: boolean
  }
  // Unique prompt limit per session
  const limit = Number(process.env.UNIQUE_PROMPT_LIMIT || 5)
  const sid = getSessionId(c)
  const set = memory.sessions.get(sid) || new Set<string>()
  const key = normalizePrompt(prompt)
  if (!set.has(key) && set.size >= limit) {
    return c.json({ error: 'limit_reached', limit, remaining: 0 }, 429)
  }
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return c.json({ error: 'Missing OPENROUTER_API_KEY' }, 400)

  const models = await listModels(apiKey)
  // Optional price-based filtering
  const maxUsdPerMToken = process.env.OPENROUTER_MAX_USD_PER_MTOKEN
  const priceCap = maxUsdPerMToken ? Number(maxUsdPerMToken) : undefined
  function getUsdPerMTok(m: OpenRouterModel): number | null {
    const p: any = (m as any).pricing || {}
    // Try common keys; prefer higher of input/output to be conservative
    const cand = [p.prompt, p.input, p.completion, p.output].filter((v: any) => typeof v === 'number')
    if (cand.length === 0) return null
    return Math.max(...cand)
  }
  let filtered = models
  if (Number.isFinite(priceCap)) {
    filtered = models.filter((m) => {
      const usd = getUsdPerMTok(m)
      return usd == null || usd <= (priceCap as number)
    })
    if (filtered.length < 2) filtered = models // fallback if too restrictive
  }
  let ids = filtered.map((m) => m.id).filter((id) => typeof id === 'string' && id.includes('/'))
  if (smart) {
    const allow = ['claude', 'sonnet', 'gemini', 'grok']
    const filtered = ids.filter((id) => allow.some((k) => id.toLowerCase().includes(k)))
    if (filtered.length >= 2) ids = filtered
  }
  const [mL, mR] = pickTwo(ids)
  const sys = { role: 'system', content: SYSTEM_PROMPT } as const
  const user = { role: 'user', content: userPrompt(template ?? 'kinetic', prompt ?? '') } as const

  async function getCodeFor(model: string) {
    try {
      const raw = await chatComplete(model, [sys, user], apiKey!)
      return extractCode(raw)
    } catch (e) {
      return null
    }
  }

  function extractCode(s: string) {
    const trimmed = s.trim()
    const fenced = trimmed.match(/```(?:tsx|typescript|jsx|javascript)?([\s\S]*?)```/i)
    return (fenced ? fenced[1] : trimmed).trim()
  }

  function fallbackCode() {
    return `export default function Comp(){
  return (<div style={{width:'100%',height:'100%',background:'#000'}}/>);
}`
  }

  const [leftCodeMaybe, rightCodeMaybe] = await Promise.all([getCodeFor(mL), getCodeFor(mR)])
  const leftCode = leftCodeMaybe ?? fallbackCode()
  const rightCode = rightCodeMaybe ?? fallbackCode()

  const id = Math.random().toString(36).slice(2)
  const match: Match = {
    id,
    template: template ?? 'kinetic',
    prompt,
    left: { model: mL, code: leftCode },
    right: { model: mR, code: rightCode },
    revealed: false,
  }
  memory.matches.set(id, match)
  // Track unique prompt usage
  if (!set.has(key)) {
    set.add(key)
    memory.sessions.set(sid, set)
  }
  // Persist to Supabase if configured
  try {
    const tplId = await ensureTemplate('code', 'Generated Code')
    const leftModelId = await ensureModel(mL)
    const rightModelId = await ensureModel(mR)
    const dbMatchId = await insertMatchRec({ prompt, template_id: tplId, left_model_id: leftModelId, right_model_id: rightModelId })
    if (dbMatchId) {
      await Promise.all([
        insertGenerationRec({ match_id: dbMatchId, model_id: leftModelId, code: leftCode }),
        insertGenerationRec({ match_id: dbMatchId, model_id: rightModelId, code: rightCode }),
      ])
    }
  } catch {}
  return c.json({ id, template: match.template, left: { code: leftCode }, right: { code: rightCode } })
})

// Surprise prompt endpoint
app.get('/api/surprise', async (c) => {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return c.json({ error: 'Missing OPENROUTER_API_KEY' }, 400)
  const models = await listModels(apiKey)
  const allow = ['claude', 'sonnet', 'gemini', 'grok']
  const pick = models.map((m) => m.id).find((id) => allow.some((k) => id.toLowerCase().includes(k))) || models[0]?.id
  const sys = { role: 'system', content: 'You are a creative assistant that outputs only a single short prompt idea for a 4-second motion graphic. No quotes, no extra text.' } as const
  const user = { role: 'user', content: 'Create a bold, professional 4-second motion graphic idea. Possibilities include bold introduction of a text string, slow fade through amorphous colors. Output only the prompt sentence.' } as const
  const text = await chatComplete(pick, [sys, user], apiKey)
  const prompt = text.replace(/^\s*"|"\s*$/g, '').trim()
  return c.json({ prompt })
})

app.post('/api/vote', async (c) => {
  const { matchId, winner } = (await c.req.json()) as { matchId: string; winner: 'left' | 'right' }
  const m = memory.matches.get(matchId)
  if (!m) return c.json({ error: 'Match not found' }, 404)
  if (!m.left || !m.right) return c.json({ error: 'Match incomplete' }, 400)
  const winnerModel = winner === 'left' ? m.left.model : m.right.model
  const loserModel = winner === 'left' ? m.right.model : m.left.model

  function getRating(id: string) {
    const row = memory.elo.get(id) ?? { rating: 1500, games: 0 }
    memory.elo.set(id, row)
    return row
  }

  const w = getRating(winnerModel)
  const l = getRating(loserModel)
  const expectedW = 1 / (1 + Math.pow(10, (l.rating - w.rating) / 400))
  const expectedL = 1 - expectedW
  const K = 24
  w.rating = Math.round(w.rating + K * (1 - expectedW))
  l.rating = Math.round(l.rating + K * (0 - expectedL))
  w.games++
  l.games++
  m.revealed = true

  // Persist vote + elo if Supabase configured
  try {
    const wId = await ensureModel(winnerModel)
    const lId = await ensureModel(loserModel)
    if (wId && lId) {
      await insertVoteRec({ match_id: m.id, winner_model_id: wId, loser_model_id: lId, side: winner })
      await upsertElo(wId, K * (1 - expectedW))
      await upsertElo(lId, K * (0 - expectedL))
    }
  } catch {}

  return c.json({ reveal: { leftModel: m.left.model, rightModel: m.right.model }, elo: { winnerDelta: K * (1 - expectedW) } })
})

app.get('/api/leaderboard', async (c) => {
  // Prefer Supabase persistent ratings
  try {
    const sb = getPublicSupabase()
    if (sb) {
      const { data, error } = await sb
        .from('elo_ratings')
        .select('rating,games,models:models(slug)')
        .order('rating', { ascending: false })
        .limit(50)
      if (!error && data) {
        return c.json({ data: data.map((r: any) => ({ model: r.models?.slug || 'unknown', rating: r.rating, games: r.games })) })
      }
    }
  } catch {}
  // Fallback to in-memory if DB not configured
  const data = Array.from(memory.elo.entries()).map(([model, { rating, games }]) => ({ model, rating, games })).sort((a, b) => b.rating - a.rating).slice(0, 50)
  return c.json({ data })
})

app.get('/api/cached-comparisons/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const row = await getCachedComparison(id)
    if (!row) return c.json({ error: 'Not found' }, 404)
    return c.json({ data: row })
  } catch {
    return c.json({ error: 'Not found' }, 404)
  }
})

const port = Number(process.env.PORT ?? 8787)
serve({ fetch: app.fetch, port })
console.log(`API listening on http://localhost:${port}`)
// Cached comparisons
app.get('/api/cached-comparisons', async (c) => {
  try {
    const rows = await listCachedComparisons()
    return c.json({ data: rows.map((r) => ({ id: r.id, prompt: r.prompt, snippetsCount: (r as any).snippets_count ?? 0 })) })
  } catch {
    return c.json({ data: [] })
  }
})

app.post('/api/cached-comparisons/:id/start', async (c) => {
  const id = c.req.param('id')
  const row = await getCachedComparison(id)
  if (!row) return c.json({ error: 'Not found' }, 404)
  const matchId = `cached_${id}_${Math.random().toString(36).slice(2)}`
  // Simulate generation delay for UX consistency
  await new Promise((r) => setTimeout(r, 3000))
  const match: Match = {
    id: matchId,
    template: 'code',
    prompt: id,
    left: { model: row.left_model, code: row.left_code },
    right: { model: row.right_model, code: row.right_code },
    revealed: false,
  }
  memory.matches.set(matchId, match)
  return c.json({ id: matchId, left: { code: row.left_code }, right: { code: row.right_code } })
})
