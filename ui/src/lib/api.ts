export type GenerateBody = { templateId: string; prompt: string }
export type GenerateResponse = {
  matchId: string
  left: { title: string }
  right: { title: string }
}

export async function generateMatch(body: GenerateBody): Promise<GenerateResponse> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Generate failed: ${res.status}`)
  return res.json()
}

export async function vote(matchId: string, side: 'left' | 'right'): Promise<{ ok: true }>
{
  const res = await fetch('/api/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId, side }),
  })
  if (!res.ok) throw new Error(`Vote failed: ${res.status}`)
  return res.json()
}

