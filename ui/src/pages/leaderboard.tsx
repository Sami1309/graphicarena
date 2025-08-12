type Row = { rank: number; name: string; rating: number; wins: number; losses: number }

const sample: Row[] = [
  { rank: 1, name: 'Gradient Title', rating: 1840, wins: 42, losses: 9 },
  { rank: 2, name: 'Neon Lower Third', rating: 1795, wins: 37, losses: 12 },
  { rank: 3, name: 'Winner Badge', rating: 1722, wins: 29, losses: 10 },
  { rank: 4, name: 'Quote Minimal', rating: 1687, wins: 26, losses: 15 },
]

export function Leaderboard() {
  return (
    <section className="content" style={{ paddingTop: 24, paddingBottom: 60 }}>
      <h2 style={{ marginTop: 0 }}>Leaderboard</h2>
      <div className="glass" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 120px 120px' }}>
          <HeaderCell>#</HeaderCell>
          <HeaderCell>Name</HeaderCell>
          <HeaderCell>Rating</HeaderCell>
          <HeaderCell>Wins</HeaderCell>
          <HeaderCell>Losses</HeaderCell>
        </div>
        {sample.map((r) => (
          <div
            key={r.rank}
            style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr 120px 120px 120px',
              borderTop: '1px solid var(--panel-strong)',
              alignItems: 'center',
            }}
          >
            <Cell>{r.rank}</Cell>
            <Cell>{r.name}</Cell>
            <Cell>{r.rating}</Cell>
            <Cell>{r.wins}</Cell>
            <Cell>{r.losses}</Cell>
          </div>
        ))}
      </div>
    </section>
  )
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--muted)', letterSpacing: 0.2 }}>{
      children
    }</div>
  )
}
function Cell({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '12px 16px' }}>{children}</div>
}
