import { useState } from 'react'
import { Player } from '@remotion/player'

type TemplateOption = {
  id: string
  name: string
}

const templates: TemplateOption[] = [
  { id: 'neon-lower-third', name: 'Lower Third – Neon' },
  { id: 'gradient-title', name: 'Title Card – Gradient' },
  { id: 'winner-badge', name: 'Badge – Winner' },
]

function Demo({ title }: { title: string }) {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(135deg, #14182b, #0f1426)',
        color: 'white',
        fontSize: 42,
        fontWeight: 800,
      }}
    >
      <div style={{ textAlign: 'center', lineHeight: 1.1 }}>{title}</div>
    </div>
  )
}

export function Arena() {
  const [leftTemplate, setLeftTemplate] = useState(templates[0].id)
  const [rightTemplate, setRightTemplate] = useState(templates[1].id)
  const [leftTitle, setLeftTitle] = useState('Design A')
  const [rightTitle, setRightTitle] = useState('Design B')

  return (
    <section className="content" style={{ paddingTop: 24 }}>
      <div
        className="arena-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 72px 1fr',
          gap: 16,
          alignItems: 'flex-start',
        }}
      >
        {/* Left competitor */}
        <div className="glass" style={{ flex: 1, padding: 16 }}>
          <div className="row" style={{ marginBottom: 10 }}>
            <select
              value={leftTemplate}
              onChange={(e) => setLeftTemplate(e.target.value)}
              className="pill"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <input
              className="pill"
              style={{ padding: '8px 12px', background: 'transparent', color: 'var(--text)' }}
              placeholder="Title"
              value={leftTitle}
              onChange={(e) => setLeftTitle(e.target.value)}
            />
          </div>
          <div className="frame" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--panel-strong)' }}>
            <Player
              component={Demo}
              inputProps={{ title: leftTitle }}
              durationInFrames={120}
              fps={30}
              compositionWidth={960}
              compositionHeight={540}
              style={{ width: '100%' }}
              controls
            />
          </div>
        </div>

        {/* VS column */}
        <div style={{ width: '100%', maxWidth: 72, display: 'grid', gap: 10, justifySelf: 'center' }}>
          <div className="glass" style={{ padding: 12, textAlign: 'center' }}>
            <div className="pill badge" style={{ display: 'inline-block' }}>
              Match
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>VS</div>
          </div>
          <button className="button">Start Match</button>
          <button className="pill" style={{ border: '1px solid var(--panel-strong)' }}>Shuffle</button>
        </div>

        {/* Right competitor */}
        <div className="glass" style={{ flex: 1, padding: 16 }}>
          <div className="row" style={{ marginBottom: 10 }}>
            <select
              value={rightTemplate}
              onChange={(e) => setRightTemplate(e.target.value)}
              className="pill"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <input
              className="pill"
              style={{ padding: '8px 12px', background: 'transparent', color: 'var(--text)' }}
              placeholder="Title"
              value={rightTitle}
              onChange={(e) => setRightTitle(e.target.value)}
            />
          </div>
          <div className="frame" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--panel-strong)' }}>
            <Player
              component={Demo}
              inputProps={{ title: rightTitle }}
              durationInFrames={120}
              fps={30}
              compositionWidth={960}
              compositionHeight={540}
              style={{ width: '100%' }}
              controls
            />
          </div>
        </div>
      </div>

      {/* Voting row */}
      <div className="row" style={{ marginTop: 16, justifyContent: 'center', gap: 12 }}>
        <button className="pill" style={{ border: '1px solid var(--panel-strong)' }}>Vote Left</button>
        <button className="pill" style={{ border: '1px solid var(--panel-strong)' }}>Vote Right</button>
        <span className="muted">Voting is a placeholder — API coming soon</span>
      </div>
    </section>
  )
}
