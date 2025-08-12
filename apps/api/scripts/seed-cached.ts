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
  const prompts = [
    { id: 'hello-aqua', prompt: 'Energetic kinetic type introducing Graphicarena' },
    { id: 'spin-square', prompt: 'Rotating square intro with subtle motion blur' },
    { id: 'fade-palette', prompt: 'Soft fade through abstract shapes and text reveal' },
    { id: 'bold-title', prompt: 'Cinematic title introduction: Graphic Animation' },
  ]

  function snippetsFor(promptId: string, promptText: string) {
    const safe = promptText.replace(/[^A-Za-z0-9 ]/g,'')
    return [
      { model: 'anthropic/claude-3-5-sonnet', code: `function Comp(){const frame=Remotion.useCurrentFrame();const cfg=Remotion.useVideoConfig();const rot=Remotion.interpolate(frame,[0,cfg.durationInFrames-1],[0,360],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});return (React.createElement(Remotion.AbsoluteFill,{style:{justifyContent:'center',alignItems:'center',backgroundColor:'#111'}},React.createElement('div',{style:{width:180,height:180,border:'2px solid #bbb',transform:'rotate(' + rot + 'deg)'}})));} export default Comp;` },
      { model: 'google/gemini-1.5-pro', code: `function Comp(){const f=Remotion.useCurrentFrame();const o=Remotion.interpolate(f,[0,20],[0,1],{extrapolateRight:'clamp'});return (React.createElement('div',{style:{width:'100%',height:'100%',background:'#141414',color:'#e6e6e6',display:'grid',placeItems:'center',opacity:o}},'${safe}'));} export default Comp;` },
      { model: 'xai/grok-2', code: `function Comp(){const f=Remotion.useCurrentFrame();const y=Remotion.interpolate(f,[0,30],[30,0],{extrapolateRight:'clamp'});return (React.createElement(Remotion.AbsoluteFill,{style:{background:'#151515',justifyContent:'center',alignItems:'center'}},React.createElement('div',{style:{padding:20,border:'2px solid #888',transform:'translateY(' + y + 'px)',color:'#e5e7eb'}},'${promptId.toUpperCase()}')));} export default Comp;` },
      { model: 'openai/gpt-4o', code: `function Comp(){const f=Remotion.useCurrentFrame();const cfg=Remotion.useVideoConfig();const x=Remotion.interpolate(f,[0,cfg.durationInFrames-1],[0,600],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});return (React.createElement('div',{style:{width:'100%',height:'100%',background:'#0d0d0d',position:'relative'}},React.createElement('div',{style:{position:'absolute',top:'45%',left: x + 'px',width:80,height:80,background:'#ddd'}})));} export default Comp;` },
      { model: 'meta/llama-3-70b', code: `function Comp(){const f=Remotion.useCurrentFrame();const o=Remotion.interpolate(f,[0,30],[0,1],{extrapolateRight:'clamp'});return (React.createElement(Remotion.AbsoluteFill,{style:{background:'#0c0c0c',justifyContent:'center',alignItems:'center'}},React.createElement('div',{style:{fontSize:42,letterSpacing:1.5,color:'#e5e7eb',opacity:o}},'${safe.toUpperCase()}')));} export default Comp;` },
      { model: 'mistral/mixtral-8x7b', code: `function Comp(){const f=Remotion.useCurrentFrame();const w=80+Math.sin(f/10)*20;return (React.createElement(Remotion.AbsoluteFill,{style:{background:'#0d0d0d',justifyContent:'center',alignItems:'center'}},React.createElement('div',{style:{width:w,height:w,border:'2px solid #bbb'}})));} export default Comp;` },
    ]
  }

  for (const p of prompts) {
    await sb.from('cached_prompts').upsert({ id: p.id, prompt: p.prompt, enabled: true })
    // Clear previous snippets for id to ensure relevance
    await sb.from('cached_snippets').delete().eq('cached_id', p.id)
    const list = snippetsFor(p.id, p.prompt)
    for (const s of list) {
      await sb.from('cached_snippets').insert({ cached_id: p.id, model: s.model, code: s.code, enabled: true })
    }
    console.log('Seeded cached_prompts + cached_snippets:', p.id)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
