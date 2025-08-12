import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

function env(name: string, fallback?: string): string | null {
  return (process.env[name] || (fallback ? process.env[fallback] : undefined) || null) as string | null
}

const url = env('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL')
const anon = env('SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY')
const service = env('SUPABASE_SERVICE_KEY')

if (!url || !anon) {
  console.error('Missing SUPABASE_URL and/or SUPABASE_ANON_KEY. Please set env first.')
  process.exit(1)
}

async function main() {
  console.log('Supabase URL:', url)
  console.log('Anon key present:', !!anon)
  console.log('Service key present:', !!service)

  const pub = createClient(url!, anon!, { auth: { persistSession: false } })
  try {
    const { data, error } = await pub.from('cached_comparisons').select('*').limit(3)
    if (error) throw error
    console.log('cached_comparisons (up to 3):', data?.length ?? 0)
  } catch (e: any) {
    console.error('Public read failed:', e.message || e)
  }

  if (!service) {
    console.log('Service key not set; skipping write checks.')
    return
  }

  const srv = createClient(url!, service!, { auth: { persistSession: false } })
  const slug = `check-${Math.random().toString(36).slice(2)}`
  try {
    // Insert a model
    const { data: mIns, error: mErr } = await srv.from('models').insert({ slug, name: slug, provider: 'check', active: true }).select('id').single()
    if (mErr) throw mErr
    const modelId = mIns!.id as string
    // Upsert elo rating
    await srv.from('elo_ratings').upsert({ model_id: modelId, rating: 1500, games: 0 })
    console.log('Write check: inserted model and elo OK')
    // Cleanup
    await srv.from('elo_ratings').delete().eq('model_id', modelId)
    await srv.from('models').delete().eq('id', modelId)
    console.log('Cleanup OK')
  } catch (e: any) {
    console.error('Write check failed:', e.message || e)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

