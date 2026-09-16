export type AdaptCvBody = {
  prompt?: string
  apiKey?: string
  json?: boolean
}

type GeminiEnv = {
  GEMINI_API_KEY?: string
  GEMINI_MODEL?: string
}

type AdaptCvPayload = { text: string } | { error: string }

type VercelRequest = {
  method?: string
  body?: unknown
}

type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
  end: () => void
}

async function runAdaptCv(
  body: AdaptCvBody,
  env: GeminiEnv,
): Promise<{ status: number; payload: AdaptCvPayload }> {
  const apiKey = body.apiKey?.trim() || env.GEMINI_API_KEY?.trim()

  if (!apiKey) {
    return {
      status: 400,
      payload: {
        error:
          'Falta la API key. Pégala en la app o define GEMINI_API_KEY en .env',
      },
    }
  }

  if (!body.prompt?.trim()) {
    return { status: 400, payload: { error: 'El prompt está vacío' } }
  }

  const model = env.GEMINI_MODEL || 'gemini-3.6-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

  const geminiRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: body.prompt }] }],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 8192,
        ...(body.json
          ? { responseMimeType: 'application/json' as const }
          : {}),
      },
    }),
  })

  const data = (await geminiRes.json()) as {
    error?: { message?: string }
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
    }>
  }

  if (!geminiRes.ok) {
    return {
      status: geminiRes.status,
      payload: { error: data.error?.message || 'Error al llamar a Gemini' },
    }
  }

  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? '')
      .join('')
      .trim() ?? ''

  if (!text) {
    return { status: 502, payload: { error: 'Gemini no devolvió texto' } }
  }

  return { status: 200, payload: { text } }
}

export async function handleAdaptCvRequest(
  request: Request,
  env: GeminiEnv,
): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 })
  }

  if (request.method !== 'POST') {
    return Response.json({ error: 'Método no permitido' }, { status: 405 })
  }

  try {
    const body = (await request.json()) as AdaptCvBody
    const { status, payload } = await runAdaptCv(body, env)
    return Response.json(payload, { status })
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : 'Error interno del proxy',
      },
      { status: 500 },
    )
  }
}

export const maxDuration = 60

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' })
    return
  }

  try {
    const body = (
      typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {})
    ) as AdaptCvBody
    const { status, payload } = await runAdaptCv(body, {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      GEMINI_MODEL: process.env.GEMINI_MODEL,
    })
    res.status(status).json(payload)
  } catch (error) {
    res.status(500).json({
      error:
        error instanceof Error ? error.message : 'Error interno del proxy',
    })
  }
}
