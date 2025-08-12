import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

function env(name: string, fallback?: string): string | null {
  return (process.env[name] || (fallback ? process.env[fallback] : undefined) || null) as string | null
}

const url = env('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL')
const service = env('SUPABASE_SERVICE_KEY')

if (!url || !service) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const sb = createClient(url, service, { auth: { persistSession: false } })

async function main() {
  const id = 'hello-aqua'
  const prompt = 'Energetic kinetic type introducing Graphicarena'
  await sb.from('cached_prompts').upsert({ id, prompt, enabled: true })
  const snippets = [
    { model: 'anthropic/claude-3-5-sonnet', code: "export default function Comp(){return (<div style=\\\"width:100%;height:100%;background:#000\\\"/>);}" },
    { model: 'google/gemini-1.5-pro', code: "export default function Comp(){return (<div style=\\\"width:100%;height:100%;background:#000\\\"/>);}" },
    { model: 'xai/grok-2', code: "export default function Comp(){const f=Remotion.useCurrentFrame();const o=Remotion.interpolate(f,[0,30],[0,1],{extrapolateRight:'clamp'});return (<div style=\\\"width:100%;height:100%;background:#0b1020;color:#fff;display:grid;place-items:center;\\\"><div style=\\\"opacity:\\\"+o+\\\"\\\">Graphicarena</div></div>);}" },
    { model: 'openai/gpt-4o', code: "export default function Comp(){return (<div style=\\\"width:100%;height:100%;background:#000\\\"/>);}" },
  ]
  for (const s of snippets) {
    await sb.from('cached_snippets').insert({ cached_id: id, model: s.model, code: s.code, enabled: true })
  }
  console.log('Seeded cached_prompts + cached_snippets:', id)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
