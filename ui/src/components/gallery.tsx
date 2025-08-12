import { Player } from '@remotion/player'
import type { ComponentType } from 'react'

// Lazy import the demo template from templates package once available.
// Here we provide a tiny inline demo to keep the page working even if deps aren't installed yet.

const Demo: ComponentType<{ title: string }> = ({ title }) => (
  <div style={{
    height: '100%', width: '100%', display: 'grid', placeItems: 'center',
    background: 'linear-gradient(135deg, #14182b, #0f1426)', color: 'white',
    fontSize: 48, fontWeight: 800
  }}>
    <div style={{ textAlign: 'center', lineHeight: 1.1 }}>
      {title}
      <div style={{ fontSize: 16, opacity: .7, marginTop: 8 }}>Remotion Preview</div>
    </div>
  </div>
)

export function Gallery() {
  return (
    <section id="gallery" className="gallery">
      <div className="container">
        <h2 style={{ margin: '0 0 12px' }}>Template Gallery</h2>
        <p className="muted" style={{ margin: 0 }}>A small taste of what you can build.</p>
        <div className="gallery-grid" style={{ marginTop: 20 }}>
          {[
            { t: 'Lower Third – Neon' },
            { t: 'Title Card – Gradient' },
            { t: 'Badge – Winner' },
            { t: 'Quote – Minimal' },
          ].map((item, i) => (
            <div key={i} className="gallery-item glass">
              <div className="frame">
                <Player
                  component={Demo}
                  inputProps={{ title: item.t }}
                  durationInFrames={120}
                  fps={30}
                  compositionWidth={960}
                  compositionHeight={540}
                  style={{ width: '100%' }}
                  controls
                />
              </div>
              <div className="caption">{item.t}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
