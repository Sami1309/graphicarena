import React, { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { ArenaView } from './views/ArenaView'
import { LeaderboardView } from './views/LeaderboardView'
import { InfoView } from './views/InfoView'

type Tab = 'arena' | 'leaderboard' | 'info'

export const App: React.FC = () => {
  const [tab, setTab] = useState<Tab>('arena')
  return (
    <div className="layout">
      <Sidebar active={tab} onSelect={setTab} />
      <main className="content">
        <section className={tab === 'arena' ? 'view' : 'view hidden'}><ArenaView /></section>
        <section className={tab === 'leaderboard' ? 'view' : 'view hidden'}><LeaderboardView /></section>
        <section className={tab === 'info' ? 'view' : 'view hidden'}><InfoView /></section>
      </main>
    </div>
  )
}
