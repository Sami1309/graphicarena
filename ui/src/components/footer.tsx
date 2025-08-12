export function Footer() {
  return (
    <footer className="footer">
      <div className="container row" style={{ alignItems: 'flex-end' }}>
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} GraphicArena — Built with Remotion and Hono.
        </p>
        <div style={{ display: 'flex', gap: 16 }}>
          <a className="muted" href="#">Privacy</a>
          <a className="muted" href="#">Terms</a>
          <a className="muted" href="#">Contact</a>
        </div>
      </div>
    </footer>
  )
}

