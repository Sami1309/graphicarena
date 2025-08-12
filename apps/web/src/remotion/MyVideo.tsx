import React from 'react'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'

type Props = {
  title?: string
}

export const MyVideo: React.FC<Props> = ({ title = 'Hello Remotion' }) => {
  const frame = useCurrentFrame()
  const { durationInFrames, fps } = useVideoConfig()

  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' })
  const y = interpolate(frame, [0, 60], [40, 0], { extrapolateRight: 'clamp' })

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        background: 'linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          transform: `translateY(${y}px)`,
          opacity,
        }}
      >
        <h1 style={{ fontSize: 96, margin: 0 }}>{title}</h1>
        <p style={{ opacity: 0.9, marginTop: 8 }}>
          frame {frame} / {durationInFrames} @ {fps}fps
        </p>
      </div>
    </div>
  )
}

