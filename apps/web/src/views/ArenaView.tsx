import React, { useEffect, useMemo, useState } from 'react'
import { Player } from '@remotion/player'
import { renderTemplate } from '../remotion/templates'
import * as Babel from '@babel/standalone'

type MatchResponse = {
  id: string
  template: string
  left: { code: string }
  right: { code: string }
}

const DEFAULT_CODE = `export default function Comp(){
  return (<div style={{width:'100%',height:'100%',background:'#000'}}/>);
}
` as const

type AnyComponent = React.FC<any>

export const ArenaView: React.FC = () => {
  const [template, setTemplate] = useState<'kinetic'>('kinetic')
  const [prompt, setPrompt] = useState('Write an inspiring 3-line quote about creativity.')
  const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8787'
  const [suggestions, setSuggestions] = useState<{id:string; prompt:string; snippetsCount:number}[]>([])
  const [leftProps] = useState<any | null>(null)
  const [rightProps] = useState<any | null>(null)
  const [matchId, setMatchId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [models, setModels] = useState<{ left: string; right: string } | null>(null)
  const [smart, setSmart] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const LOCAL_DEV = (import.meta as any).env?.VITE_LOCAL_DEV === 'true' || (typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(window.location.hostname))
  const [leftCode, setLeftCode] = useState<string>(DEFAULT_CODE)
  const [rightCode, setRightCode] = useState<string>(DEFAULT_CODE)
  const [leftCompiled, setLeftCompiled] = useState<AnyComponent | null>(null)
  const [rightCompiled, setRightCompiled] = useState<AnyComponent | null>(null)
  const [leftErr, setLeftErr] = useState<string | null>(null)
  const [rightErr, setRightErr] = useState<string | null>(null)

  const Comp = useMemo(() => renderTemplate(template), [template])

  // Compile helpers for edit mode
  function preprocess(src: string) {
    return src
      .replace(/import[^;]+from\s+['\"]react['\"];?\n?/g, '')
      .replace(/import[^;]+from\s+['\"]remotion['\"];?\n?/g, '')
      .replace(/import[^;]+from\s+['\"]@remotion\/[A-Za-z\-\/]+['\"];?\n?/g, '')
  }

  function withSafeRemotion(R: any) {
    const safeInterpolate = (input: number, inRange: number[], outRange: any[], options?: any) => {
      const numeric = Array.isArray(outRange)
        ? outRange.map((v) => (typeof v === 'number' ? v : parseFloat(String(v)) || 0))
        : outRange
      return R.interpolate(input, inRange, numeric, options)
    }
    return { ...R, interpolate: safeInterpolate }
  }

  function compile(src: string, set: (c: AnyComponent | null) => void, setErr: (e: string | null) => void) {
    try {
      setErr(null)
      const prelude = `const { useCurrentFrame, useVideoConfig, interpolate, spring, Easing, AbsoluteFill, Sequence, Series, Img, Audio, OffthreadVideo, staticFile, random, TransitionSeries, springTiming, linearTiming, fade, wipe } = Remotion;`;
      const { code } = Babel.transform(preprocess(src), {
        presets: [["react", { runtime: 'classic' }], 'typescript'],
        plugins: [['transform-modules-commonjs', { strictMode: false }]],
        filename: 'Comp.tsx',
      })
      const exportsObj: Record<string, any> = {}
      const fn = new Function('React', 'Remotion', 'exports', `${prelude}
${code};
return exports;`)
      const result = fn(React, withSafeRemotion(Remotion), exportsObj) as Record<string, any>
      const Compiled = (result.default || Object.values(result)[0]) as AnyComponent
      if (typeof Compiled !== 'function') throw new Error('No component export found.')
      set(() => Compiled)
    } catch (e: any) {
      set(null)
      setErr(e?.message ?? String(e))
    }
  }

  const Remotion = useMemo(() => (window as any).Remotion || {}, [])

  useEffect(() => {
    compile(leftCode, setLeftCompiled, setLeftErr)
  }, [leftCode])

  useEffect(() => {
    compile(rightCode, setRightCompiled, setRightErr)
  }, [rightCode])

  // Persist/load arena state to localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('arenaState')
      if (!raw) return
      const s = JSON.parse(raw)
      if (typeof s.prompt === 'string') setPrompt(s.prompt)
      if (typeof s.leftCode === 'string') setLeftCode(s.leftCode)
      if (typeof s.rightCode === 'string') setRightCode(s.rightCode)
      if (typeof s.matchId === 'string') setMatchId(s.matchId)
      if (typeof s.revealed === 'boolean') setRevealed(s.revealed)
      if (s.models) setModels(s.models)
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      const s = { prompt, leftCode, rightCode, matchId, revealed, models }
      localStorage.setItem('arenaState', JSON.stringify(s))
    } catch {}
  }, [prompt, leftCode, rightCode, matchId, revealed, models])

  useEffect(() => {
    fetch(`${API_URL}/api/cached-comparisons`)
      .then((r)=>r.json())
      .then((d)=> setSuggestions(d.data ?? []))
      .catch(()=>{})
  }, [API_URL])

  async function useSuggestionPick(s: {id:string; prompt:string}) {
    setLoading(true)
    setError(null)
    setRevealed(false)
    try {
      setPrompt(s.prompt)
      const res = await fetch(`${API_URL}/api/cached-comparisons/${s.id}/start`, { method: 'POST' })
      if(!res.ok) throw new Error('Failed to load suggestion')
      const data: MatchResponse = await res.json()
      setMatchId(data.id)
      setLeftCode(data.left.code)
      setRightCode(data.right.code)
    } catch(e:any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  // Error boundary to isolate player runtime errors
  class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: any | null }>{
    constructor(props: any) {
      super(props)
      this.state = { error: null }
    }
    static getDerivedStateFromError(error: any) { return { error } }
    componentDidCatch() {}
    render() {
      if (this.state.error) {
        return <div style={{position:'absolute',inset:0,display:'grid',placeItems:'center',background:'rgba(12,16,28,0.6)',borderRadius:10}}>
          <div style={{color:'#ff9aa2',fontSize:12,opacity:0.9,textAlign:'center',padding:12}}>Render error: {String(this.state.error?.message || this.state.error)}</div>
        </div>
      }
      return <>{this.props.children}</>
    }
  }

  function wrapComponent(CompIn: AnyComponent): AnyComponent {
    const Wrapped: AnyComponent = (props) => {
      return (
        <ErrorBoundary>
          {React.createElement(CompIn, props)}
        </ErrorBoundary>
      )
    }
    return Wrapped
  }

  const Failed: AnyComponent = () => (
    <div style={{width:'100%',height:'100%',background:'#000',display:'grid',placeItems:'center'}}>
      <div style={{color:'#e5e7eb',fontSize:16,opacity:0.9}}>the animation code failed</div>
    </div>
  )
  const LeftWrapped = useMemo(() => wrapComponent((leftCompiled ?? Comp) as AnyComponent), [leftCompiled, Comp])
  const RightWrapped = useMemo(() => wrapComponent((rightCompiled ?? Comp) as AnyComponent), [rightCompiled, Comp])

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setRevealed(false)
    try {
      const res = await fetch(`${API_URL}/api/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, template, smart }),
      })
      if (!res.ok) throw new Error(`Match error: ${res.status}`)
      const data: MatchResponse = await res.json()
      setMatchId(data.id)
      setLeftCode(data.left.code)
      setRightCode(data.right.code)
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  async function vote(side: 'left' | 'right') {
    if (!matchId) return
    try {
      const res = await fetch(`${API_URL}/api/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, winner: side }),
      })
      if (!res.ok) throw new Error('Vote failed')
      const data = await res.json()
      setModels({ left: data.reveal.leftModel, right: data.reveal.rightModel })
      setRevealed(true)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="arena">
      <div className="controls-row">
        <div className="field">
          <label>Template</label>
          <select value={template} onChange={(e) => setTemplate(e.target.value as any)}>
            <option value="kinetic">Kinetic Type</option>
          </select>
        </div>
        {LOCAL_DEV && (
          <div className="toggles">
            <label className="toggle"><input type="checkbox" checked={smart} onChange={(e)=>setSmart(e.target.checked)} /> Smart mode</label>
            <label className="toggle"><input type="checkbox" checked={editMode} onChange={(e)=>setEditMode(e.target.checked)} /> Edit mode</label>
          </div>
        )}
      </div>

      <div className="players">
        <div className="player-card">
          <div className={loading ? 'player loading' : 'player'}>
            <div className="player-frame">
              <Player
                component={(leftErr || (!matchId && error)) ? Failed : LeftWrapped}
                inputProps={{}}
                durationInFrames={120}
                compositionWidth={1280}
                compositionHeight={720}
                fps={30}
                controls
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              />
            </div>
            {loading && <div className="overlay"><div className="spinner" /></div>}
          </div>
          {revealed && models && (
            <div className="badge">{models.left}</div>
          )}
          {!loading && matchId && (
            <button className="vote" onClick={() => vote('left')}>Vote Left</button>
          )}
          {editMode && (
            <div className="editor">
              <label>Left component code</label>
              <textarea value={leftCode} onChange={(e)=>setLeftCode(e.target.value)} spellCheck={false} />
              {leftErr && <div className="error">{leftErr}</div>}
            </div>
          )}
        </div>
        <div className="player-card">
          <div className={loading ? 'player loading' : 'player'}>
            <div className="player-frame">
              <Player
                component={(rightErr || (!matchId && error)) ? Failed : RightWrapped}
                inputProps={{}}
                durationInFrames={120}
                compositionWidth={1280}
                compositionHeight={720}
                fps={30}
                controls
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              />
            </div>
            {loading && <div className="overlay"><div className="spinner" /></div>}
          </div>
          {revealed && models && (
            <div className="badge">{models.right}</div>
          )}
          {!loading && matchId && (
            <button className="vote" onClick={() => vote('right')}>Vote Right</button>
          )}
          {editMode && (
            <div className="editor">
              <label>Right component code</label>
              <textarea value={rightCode} onChange={(e)=>setRightCode(e.target.value)} spellCheck={false} />
              {rightErr && <div className="error">{rightErr}</div>}
            </div>
          )}
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="suggestions">
          <div className="s-head">Try a suggested prompt</div>
          <div className="s-list">
            {suggestions.map(s => (
              <button key={s.id} className="s-item" onClick={()=>useSuggestionPick(s)} title={`Cached variants: ${s.snippetsCount}`}>{s.prompt}</button>
            ))}
          </div>
        </div>
      )}

      <div className="prompt-panel">
        <textarea className="prompt-input" placeholder="Describe the animation…" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <button className="primary gen" onClick={handleGenerate} disabled={loading}>{loading ? 'Generating…' : 'Generate'}</button>
      </div>
      {error && <div className="error">{error}</div>}
      {revealed && <div className="hint">Thanks for voting! Models updated in leaderboard.</div>}
    </div>
  )
}
