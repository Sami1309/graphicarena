import React from 'react'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'

export type KineticProps = {
  lines?: string[]
  palette?: 'sunset' | 'aqua' | 'grape' | 'mono'
  bpm?: number
  seed?: number
}

const palettes: Record<KineticProps['palette'], string[]> = {
  sunset: ['#fb7185', '#f472b6', '#f59e0b'],
  aqua: ['#22d3ee', '#0ea5e9', '#34d399'],
  grape: ['#a78bfa', '#7c3aed', '#f472b6'],
  mono: ['#e5e7eb', '#9ca3af', '#374151'],
}

export const Kinetic: React.FC<KineticProps> = (props) => {
  const lines = Array.isArray(props.lines) && props.lines.length > 0 ? props.lines : ['the animation code failed']
  const palette = (props.palette && ['sunset','aqua','grape','mono'].includes(props.palette)) ? props.palette as KineticProps['palette'] : 'mono'
  const bpm = typeof props.bpm === 'number' && isFinite(props.bpm) ? Math.min(180, Math.max(60, props.bpm)) : 120
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const beat = 60 / Math.max(60, Math.min(180, bpm))
  const beatFrames = beat * fps
  const color = palettes[palette] ?? palettes.mono
  return (
    <div style={{ height: '100%', width: '100%', background: '#0b1020', display: 'grid', placeItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        {lines.slice(0, 6).map((l, i) => {
          const start = i * beatFrames
          const opacity = interpolate(frame, [start, start + 10], [0, 1], { extrapolateRight: 'clamp' })
          const y = interpolate(frame, [start, start + 30], [20, 0], { extrapolateRight: 'clamp' })
          return (
            <div key={i} style={{
              color: color[i % color.length],
              fontSize: i === 0 ? 64 : 40,
              fontWeight: 700,
              margin: 8,
              opacity,
              transform: `translateY(${y}px)`,
            }}>{l}</div>
          )
        })}
      </div>
    </div>
  )
}

export type TemplateKind = 'kinetic'
export type TemplateProps = { kind: 'kinetic'; props: KineticProps }

export function renderTemplate(kind: TemplateKind): React.FC<any> {
  switch (kind) {
    case 'kinetic':
    default:
      return Kinetic as React.FC<any>
  }
}
