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
    { model: 'anthropic/claude-3-5-sonnet', code: "function Comp(){const frame=Remotion.useCurrentFrame();const cfg=Remotion.useVideoConfig();const rot=Remotion.interpolate(frame,[0,cfg.durationInFrames-1],[0,360],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});return (React.createElement(Remotion.AbsoluteFill,{style:{justifyContent:'center',alignItems:'center',backgroundColor:'white'}},React.createElement('div',{style:{width:200,height:200,backgroundColor:'red',transform:'rotate(' + rot + 'deg)'}})));} export default Comp;" },
    { model: 'google/gemini-1.5-pro', code: "function Comp(){const f=Remotion.useCurrentFrame();const o=Remotion.interpolate(f,[0,20],[0,1],{extrapolateRight:'clamp'});return (React.createElement('div',{style:{width:'100%',height:'100%',background:'#0b1020',color:'#fff',display:'grid',placeItems:'center',opacity:o}},'Graphicarena'));} export default Comp;" },
    { model: 'xai/grok-2', code: "function Comp(){const f=Remotion.useCurrentFrame();const y=Remotion.interpolate(f,[0,30],[40,0],{extrapolateRight:'clamp'});return (React.createElement(Remotion.AbsoluteFill,{style:{background:'#111',justifyContent:'center',alignItems:'center'}},React.createElement('div',{style:{padding:24,border:'2px solid #6ee7ff',transform:'translateY(' + y + 'px)',color:'#6ee7ff'}},'Grok Showcase')));} export default Comp;" },
    { model: 'openai/gpt-4o', code: "function Comp(){const f=Remotion.useCurrentFrame();const cfg=Remotion.useVideoConfig();const x=Remotion.interpolate(f,[0,cfg.durationInFrames-1],[0,600],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});return (React.createElement('div',{style:{width:'100%',height:'100%',background:'#000',position:'relative'}},React.createElement('div',{style:{position:'absolute',top:'45%',left: x + 'px',width:80,height:80,background:'#22d3ee'}})));} export default Comp;" },
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
