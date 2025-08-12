import { Gallery } from '../components/gallery'

export function Info() {
  return (
    <section className="content" style={{ paddingTop: 24, paddingBottom: 60 }}>
      <h2 style={{ marginTop: 0 }}>Information</h2>
      <p className="muted" style={{ maxWidth: 760 }}>
        GraphicArena revolves around deterministic Remotion templates. Each template exposes a JSON
        schema for its props. In the arena, two variations face off. The crowd watches, votes, and
        the winner climbs an Elo‑style leaderboard.
      </p>
      <div style={{ height: 12 }} />
      <Gallery />
    </section>
  )
}
