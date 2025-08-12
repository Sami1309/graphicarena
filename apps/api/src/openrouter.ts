export type OpenRouterModel = {
  id: string
  name?: string
  pricing?: unknown
}

const MODELS_URL = 'https://openrouter.ai/api/v1/models'
const CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions'

function buildHeaders(apiKey?: string) {
  const origin = process.env.PUBLIC_ORIGIN || 'http://localhost:5173'
  const title = process.env.OPENROUTER_APP_TITLE || 'Graphicarena Dev'
  const headers: Record<string, string> = {
    'HTTP-Referer': origin,
    'X-Title': title,
  }
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`
  return headers
}

export async function listModels(apiKey?: string): Promise<OpenRouterModel[]> {
  const res = await fetch(MODELS_URL, { headers: buildHeaders(apiKey) })
  if (!res.ok) throw new Error(`OpenRouter models error: ${res.status}`)
  const json = (await res.json()) as { data?: OpenRouterModel[] }
  return json.data ?? []
}

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export async function chatComplete(
  model: string,
  messages: ChatMessage[],
  apiKey: string
): Promise<string> {
  const res = await fetch(CHAT_URL, {
    method: 'POST',
    headers: { ...buildHeaders(apiKey), 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, temperature: 0.7 }),
  })
  if (!res.ok) throw new Error(`OpenRouter chat error: ${res.status}`)
  const json = await res.json()
  const content: string | undefined = json?.choices?.[0]?.message?.content
  if (!content) throw new Error('No content in completion')
  return content
}
