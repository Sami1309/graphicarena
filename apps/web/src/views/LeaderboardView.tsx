import React, { useEffect, useState } from 'react'

type Row = { model: string; rating: number; games: number }

export const LeaderboardView: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([])
  useEffect(() => {
    fetch('http://localhost:8787/api/leaderboard')
      .then((r) => r.json())
      .then((d) => setRows(d.data ?? []))
      .catch(() => {})
  }, [])

  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      <div className="table">
        <div className="thead">
          <div>Model</div>
          <div>Rating</div>
          <div>Games</div>
        </div>
        {rows.map((r) => (
          <div className="trow" key={r.model}>
            <div className="cell model">{r.model}</div>
            <div className="cell">{r.rating}</div>
            <div className="cell">{r.games}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

