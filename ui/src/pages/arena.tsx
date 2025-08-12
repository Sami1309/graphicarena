import { useMemo, useState } from 'react'
import { Player } from '@remotion/player'
import { generateMatch, vote } from '../lib/api'

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
  const [templateId, setTemplateId] = useState(templates[0].id)
  const [leftTitle, setLeftTitle] = useState('Design A')
  const [rightTitle, setRightTitle] = useState('Design B')
  const [prompt, setPrompt] = useState('Neon, crisp lower-third for tech talk')
  const [loading, setLoading] = useState(false)
  const [matchId, setMatchId] = useState<string | null>(null)

  const tplName = useMemo(() => templates.find(t => t.id === templateId)?.name ?? templateId, [templateId])

  return (
    <section className="content" style={{ paddingTop: 24 }}>
      {/* Template bar */}
      <div className="glass" style={{ padding: 12, borderRadius: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="pill badge" aria-hidden>Template</div>
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="pill"
          style={{ background: 'transparent', color: 'var(--text)' }}
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <div className="muted" style={{ marginLeft: 'auto' }}>{tplName}</div>
      </div>

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
          {matchId && (
            <div className="row" style={{ marginTop: 12, justifyContent: 'center' }}>
              <button className="pill" onClick={async () => { await vote(matchId, 'left') }} style={{ border: '1px solid var(--panel-strong)' }}>Vote Left</button>
            </div>
          )}
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
          {matchId && (
            <div className="row" style={{ marginTop: 12, justifyContent: 'center' }}>
              <button className="pill" onClick={async () => { await vote(matchId, 'right') }} style={{ border: '1px solid var(--panel-strong)' }}>Vote Right</button>
            </div>
          )}
        </div>
      </div>

      {/* Prompt + Generate */}
      <div className="glass" style={{ marginTop: 16, padding: 12, borderRadius: 14 }}>
        <div className="row" style={{ gap: 12 }}>
          <input
            className="pill"
            style={{ flex: 1, padding: '10px 12px', background: 'transparent', color: 'var(--text)' }}
            placeholder="Describe your graphic…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            className="button"
            disabled={loading}
            onClick={async () => {
              try {
                setLoading(true)
                const res = await generateMatch({ templateId, prompt })
                setLeftTitle(res.left.title)
                setRightTitle(res.right.title)
                setMatchId(res.matchId)
              } finally {
                setLoading(false)
              }
            }}
          >
            {loading ? 'Generating…' : 'Generate' }
          </button>
        </div>
      </div>
    </section>
  )
}
