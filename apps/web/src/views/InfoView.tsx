import React, { useEffect, useMemo, useState } from 'react'
import { Player } from '@remotion/player'
import * as Babel from '@babel/standalone'

type AnyComponent = React.FC<any>

const examples = [
  {
    title: 'Minimal fade-in',
    code: `export default function Comp(){ const f=Remotion.useCurrentFrame(); const o=Remotion.interpolate(f,[0,20],[0,1],{extrapolateRight:'clamp'}); return (<div style={{width:'100%',height:'100%',background:'#0b1020',display:'grid',placeItems:'center',color:'#fff',opacity:o}}>Graphicarena</div>); }`,
  },
  {
    title: 'Kinetic text',
    code: `export default function Comp(){ const f=Remotion.useCurrentFrame(); const i=Math.floor(f/30)%3; const lines=['Creativity','Constraints','Ship']; return (<div style={{width:'100%',height:'100%',display:'grid',placeItems:'center',background:'#111'}}><div style={{fontSize:72,color:'#6ee7ff'}}>{lines[i]}</div></div>); }`,
  },
]

export const InfoView: React.FC = () => {
  const Remotion = useMemo(() => (window as any).Remotion || {}, [])
  const [compiled, setCompiled] = useState<Record<string, AnyComponent>>({})

  useEffect(() => {
    const out: Record<string, AnyComponent> = {}
    for (const ex of examples) {
      try {
        const prelude = `const { useCurrentFrame, useVideoConfig, interpolate, spring, Easing, AbsoluteFill, Sequence, Series, Img, Audio, OffthreadVideo, staticFile, random, TransitionSeries, springTiming, linearTiming, fade, wipe } = Remotion;`
        const { code } = Babel.transform(ex.code, { presets: [["react", { runtime: 'classic' }], 'typescript'], plugins: [['transform-modules-commonjs', { strictMode: false }]] })
        const fn = new Function('React','Remotion','exports', `${prelude}\n${code};\nreturn exports;`)
        const res = fn(React, Remotion, {})
        out[ex.title] = (res.default || Object.values(res)[0]) as AnyComponent
      } catch {}
    }
    setCompiled(out)
  }, [Remotion])

  return (
    <div className="info">
      <h2>What is Graphicarena?</h2>
      <p>Graphicarena lets you compare two LLM‑generated Remotion animations, side‑by‑side, and vote for your favorite. It reveals model names after voting and maintains an Elo‑style leaderboard.</p>
      <p>For speed and safety, we can also serve pre‑approved “cached” animations so users can compare without generating new code every time.</p>
      <h3 style={{marginTop:16}}>Examples</h3>
      <div className="cards">
        {examples.map((ex) => (
          <div key={ex.title} className="card">
            <div className="card-title">{ex.title}</div>
            <div className="card-player">
              <Player component={compiled[ex.title] || (()=>null)} inputProps={{}} durationInFrames={120} compositionWidth={1280} compositionHeight={720} fps={30} controls style={{position:'absolute',inset:0,width:'100%',height:'100%'}} />
            </div>
          </div>
        ))}
      </div>
      <h3 style={{marginTop:16}}>How it works</h3>
      <ul>
        <li>Enter a prompt or pick a suggested one.</li>
        <li>Two models generate TypeScript Remotion components.</li>
        <li>You vote; models are revealed and Elo updates.</li>
      </ul>
    </div>
  )
}
