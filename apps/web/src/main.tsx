import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles.css'
import {
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Easing,
  AbsoluteFill,
  Sequence,
  Series,
  Img,
  Audio,
  OffthreadVideo,
  staticFile,
  random,
} from 'remotion'
import { TransitionSeries, springTiming, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { wipe } from '@remotion/transitions/wipe'

// Expose minimal Remotion API for live-compiled components
;(window as any).Remotion = {
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Easing,
  AbsoluteFill,
  Sequence,
  Series,
  Img,
  Audio,
  OffthreadVideo,
  staticFile,
  random,
  TransitionSeries,
  springTiming,
  linearTiming,
  fade,
  wipe,
}

const el = document.getElementById('root')!
createRoot(el).render(<App />)
