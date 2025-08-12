import React from 'react'

type Props = {
  open: boolean
  onClose: () => void
}

export const WelcomeModal: React.FC<Props> = ({ open, onClose }) => {
  if (!open) return null
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <h2>Welcome to GraphicArena</h2>
        <p className="muted">Side-by-side AI‑generated Remotion animations. Enter a prompt or pick a suggestion, then vote for the one you prefer. We reveal model names after voting and update an Elo leaderboard.</p>
        <ul className="modal-list">
          <li>Click a suggested prompt to try a cached comparison fast.</li>
          <li>Use the Generate button to ask two models for new animations.</li>
          <li>Vote left or right to see which model you chose.</li>
        </ul>
        <div className="modal-actions">
          <button className="primary xl" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  )
}

