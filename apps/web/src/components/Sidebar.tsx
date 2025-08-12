import React from 'react'

type Tab = 'arena' | 'leaderboard' | 'info'

export const Sidebar: React.FC<{
  active: Tab
  onSelect: (t: Tab) => void
}> = ({ active, onSelect }) => {
  const Item: React.FC<{ id: Tab; label: string }> = ({ id, label }) => (
    <button
      className={active === id ? 'nav-item active' : 'nav-item'}
      onClick={() => onSelect(id)}
    >
      {label}
    </button>
  )
  return (
    <nav className="sidebar">
      <div className="brand">Graphicarena</div>
      <Item id="arena" label="Arena" />
      <Item id="leaderboard" label="Leaderboard" />
      <Item id="info" label="Info" />
    </nav>
  )
}

