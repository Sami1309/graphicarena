import React, { useEffect, useMemo, useState } from 'react'
import { Player } from '@remotion/player'
import * as Babel from '@babel/standalone'
import {
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  spring,
} from 'remotion'

const DEFAULT_SOURCE = `// Write a full Remotion component below.
// No imports needed: React and Remotion APIs are available.
// Export your component as default or a named export.

export const MyVideo = ({ title = 'Hello Remotion' }) => {
  const frame = Remotion.useCurrentFrame();
  const { durationInFrames, fps } = Remotion.useVideoConfig();
  const opacity = Remotion.interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const y = Remotion.interpolate(frame, [0, 60], [40, 0], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      height: '100%', width: '100%',
      background: 'linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
    }}>
      <div style={{ textAlign: 'center', transform: \
        \`translateY(\${y}px)\`, opacity }}>
        <h1 style={{ fontSize: 72, margin: 0 }}>{title}</h1>
        <p style={{ opacity: 0.9, marginTop: 8 }}>frame {frame} / {durationInFrames} @ {fps}fps</p>
      </div>
    </div>
  );
}

export default MyVideo;` as const

type AnyComponent = React.FC<any>

export const App: React.FC = () => {
  const [source, setSource] = useState<string>(DEFAULT_SOURCE)
  const [compiled, setCompiled] = useState<AnyComponent | null>(null)
  const [error, setError] = useState<string | null>(null)

  const Remotion = useMemo(
    () => ({ interpolate, useCurrentFrame, useVideoConfig, Easing, spring }),
    []
  )

  useEffect(() => {
    try {
      setError(null)
      // Transform TS/JSX and modules to CJS
      const { code } = Babel.transform(source, {
        presets: ['react', 'typescript'],
        plugins: [['transform-modules-commonjs', { strictMode: false }]],
        filename: 'DynamicComponent.tsx',
      })

      const exportsObj: Record<string, any> = {}
      const fn = new Function('React', 'Remotion', 'exports', `${code}; return exports;`)
      const result = fn(React, Remotion, exportsObj) as Record<string, any>
      const Comp = (result.default || result.MyVideo || Object.values(result)[0]) as AnyComponent
      if (typeof Comp !== 'function') throw new Error('No component export found.')
      setCompiled(() => Comp)
    } catch (e: any) {
      setCompiled(null)
      setError(e?.message ?? String(e))
    }
  }, [source, Remotion])

  return (
    <div className="container">
      <div className="player-wrap">
        {compiled ? (
          <Player
            component={compiled}
            durationInFrames={120}
            compositionWidth={1920}
            compositionHeight={1080}
            fps={30}
            controls
            autoPlay
            loop
            style={{ width: '100%', maxWidth: '1000px', aspectRatio: '16 / 9' }}
          />
        ) : (
          <div className="player-fallback">Fix errors to preview</div>
        )}
      </div>

      <div className="controls">
        <label htmlFor="code">Component code (compiled live)</label>
        <textarea
          id="code"
          spellCheck={false}
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
        {error && <div className="error">{error}</div>}
        <p className="hint">Tip: Export default or a named component (e.g., MyVideo). React and Remotion APIs are provided via the global <code>React</code> and <code>Remotion</code> objects.</p>
      </div>
    </div>
  )
}
