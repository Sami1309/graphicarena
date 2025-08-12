import React, { useEffect, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { ArenaView } from './views/ArenaView'
import { LeaderboardView } from './views/LeaderboardView'
import { InfoView } from './views/InfoView'
import { WelcomeModal } from './components/WelcomeModal'

type Tab = 'arena' | 'leaderboard' | 'info'

export const App: React.FC = () => {
  const [tab, setTab] = useState<Tab>('arena')
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    try {
      const seen = localStorage.getItem('welcomeSeen')
      if (!seen) setShowWelcome(true)
    } catch {}
  }, [])

  function closeWelcome() {
    try { localStorage.setItem('welcomeSeen', '1') } catch {}
    setShowWelcome(false)
  }
  return (
    <div className="layout">
      <Sidebar active={tab} onSelect={setTab} />
      <main className="content">
        <WelcomeModal open={showWelcome} onClose={closeWelcome} />
        <section className={tab === 'arena' ? 'view' : 'view hidden'}><ArenaView /></section>
        <section className={tab === 'leaderboard' ? 'view' : 'view hidden'}><LeaderboardView /></section>
        <section className={tab === 'info' ? 'view' : 'view hidden'}><InfoView /></section>
      </main>
    </div>
  )
}
