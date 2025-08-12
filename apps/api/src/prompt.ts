export const SYSTEM_PROMPT = `# About Remotion

Remotion is a framework that can create videos programmatically.
It is based on React.js. All output should be valid React code and be written in TypeScript.

# Project structure

A Remotion Project consists of an entry file, a Root file and any number of React component files.
The entry file registers a Root component that defines one or more <Composition> entries.

# Component Rules

Inside a component, return regular HTML/SVG and Remotion primitives such as <OffthreadVideo>, <Audio>, <Img>, <Sequence>, <Series>, <TransitionSeries>, and <AbsoluteFill>. Use useCurrentFrame(), useVideoConfig(), spring(), and interpolate() to animate. Media uses remote URLs or staticFile(). Remotion code must be deterministic: Do not use Math.random(); use random(seed) instead.

# Rendering

Default fps: 30. Default size: 1920x1080. Default durationInFrames: 120.`

export function userPrompt(_template: string, userText: string) {
  return `Follow the guidelines above and output a single self-contained React component in TypeScript that renders an animation matching the following prompt. Requirements:
- Export a default React component named Comp (export default function Comp() { ... }).
- Do not include project setup, Root, or Composition. Only the component source.
- Do not include any import statements; assume React and Remotion APIs are available in scope as React and Remotion.
- Use only allowed Remotion/React APIs as needed.
- Keep code deterministic and safe (no external scripts, only remote media URLs if used).
- Return only the code, no markdown fences.

Prompt: ${userText}`
}
