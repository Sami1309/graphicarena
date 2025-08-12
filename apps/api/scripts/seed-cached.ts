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
  const payload = {
    id,
    prompt: 'Energetic kinetic type introducing Graphicarena',
    left_model: 'anthropic/claude-3-5-sonnet',
    right_model: 'google/gemini-1.5-pro',
    left_code: "export default function Comp(){return (<div style=\"width:100%;height:100%;background:#000\"/>);}",
    right_code: "export default function Comp(){return (<div style=\"width:100%;height:100%;background:#000\"/>);}",
    enabled: true,
  }
  const { error } = await sb.from('cached_comparisons').upsert(payload)
  if (error) {
    console.error('Seed upsert failed:', error.message)
    process.exit(1)
  } else {
    console.log('Seeded cached_comparisons:', id)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

