import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Footer } from './components/footer'
import { Arena } from './pages/arena'
import { Leaderboard } from './pages/leaderboard'
import { Info } from './pages/info'
import { Sidebar } from './components/sidebar'

export default function App() {
  return (
    <div className="app">
      <div className="bg-grid" aria-hidden="true" />
      <BrowserRouter>
        <div className="layout">
          <aside className="sidebar glass">
            <Sidebar />
          </aside>
          <div className="main">
            <main>
              <Routes>
                <Route path="/" element={<Arena />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/info" element={<Info />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </div>
      </BrowserRouter>
    </div>
  )
}
