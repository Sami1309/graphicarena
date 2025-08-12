import React, { useEffect, useState } from 'react'

type Row = { model: string; rating: number; games: number }

export const LeaderboardView: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([])
  const API_URL = (import.meta as any).env?.VITE_API_URL || (typeof window !== 'undefined' && window.location?.origin?.includes('onrender.com') ? window.location.origin.replace('graphicarena-1','graphicarena-api') : 'http://localhost:8787')
  useEffect(() => {
    fetch(`${API_URL}/api/leaderboard`)
      .then((r) => r.json())
      .then((d) => setRows(d.data ?? []))
      .catch(() => {})
  }, [API_URL])

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
