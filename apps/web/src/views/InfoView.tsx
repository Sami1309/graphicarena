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
      <h2>What is GraphicArena?</h2>
      <p>GraphicArena lets you compare two motion graphic videos, each generated programatically by an LLM</p>
      <p>This is aimed at testing the emerging visual, spatial and aesthetic capabilities of large-language models.</p>
      <div style={{margin: '14px 0', padding: 12, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, background: 'var(--card)'}}>
        Powered by <strong href="https://moteo.dev">Moteo.dev</strong> — an AI motion graphics tool for creators, designers & teams. <div style={{display:'flex',gap:10,marginTop:10}}>
          <a className="secondary gen" href="https://moteo.dev" target="_blank" rel="noreferrer">Join the waitlist</a>
        </div>
        
      </div>
      

    </div>
  )
}
