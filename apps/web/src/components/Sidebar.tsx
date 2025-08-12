import React from 'react'
// If logo.png exists at project root (apps/web/logo.png), import as module
// Vite will bundle it correctly
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import logoUrl from '../../logo.png'

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
      <div className="brand">
        {logoUrl ? <img src={logoUrl} alt="Graphicarena" className="brand-logo" /> : 'Graphicarena'}
      </div>
      <Item id="arena" label="Arena" />
      <Item id="leaderboard" label="Leaderboard" />
      <Item id="info" label="Info" />
    </nav>
  )
}
