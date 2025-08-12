import { NavLink, Link } from 'react-router-dom'
import { Logo } from './logo'

export function Sidebar() {
  return (
    <div className="sidebar-inner">
      <Link to="/" className="brand" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={22} />
          <span className="pill badge">Beta</span>
        </div>
      </Link>

      <nav className="side-nav">
        <SideLink to="/">Arena</SideLink>
        <SideLink to="/leaderboard">Leaderboard</SideLink>
        <SideLink to="/info">Info</SideLink>
      </nav>

      <div className="sidebar-footer muted">
        <small>© {new Date().getFullYear()} GraphicArena</small>
      </div>
    </div>
  )
}

function SideLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
      end
    >
      {children}
    </NavLink>
  )
}

