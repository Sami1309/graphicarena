import React from 'react'

export const InfoView: React.FC = () => {
  return (
    <div className="info">
      <h2>About</h2>
      <p>
        Compare two LLM-generated Remotion animations side by side and vote for
        the best. Templates render purely from JSON props for safety and speed.
      </p>
      <p>
        Backend calls OpenRouter to ask models for template props; no code from
        models is executed in the browser.
      </p>
      <p>Set <code>OPENROUTER_API_KEY</code> in the API environment.</p>
    </div>
  )
}

