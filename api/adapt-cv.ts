export type AdaptCvBody = {
  prompt?: string
  apiKey?: string
  json?: boolean
}

type GeminiEnv = {
  GEMINI_API_KEY?: string
  GEMINI_MODEL?: string
}

type AdaptCvPayload = { text: string } | { error: string; retryAfterSec?: number }

type VercelRequest = {
  method?: string
  body?: unknown
  headers?: Record<string, string | string[] | undefined>
}

type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
  end: () => void
  setHeader: (name: string, value: string) => void
}

const MAX_PROMPT_CHARS = 60_000
const IP_WINDOW_MS = 10 * 60 * 1000
const IP_MAX_REQUESTS = 6
const SHARED_WINDOW_MS = 60 * 60 * 1000
const SHARED_MAX_REQUESTS = 20

const hitWindows = new Map<string, number[]>()
const inflightIps = new Set<string>()

function headerValue(
  headers: VercelRequest['headers'] | Headers | undefined,
  name: string,
): string {
  if (!headers) return ''
  if (headers instanceof Headers) return headers.get(name) ?? ''
  const value = headers[name] ?? headers[name.toLowerCase()]
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
}

function clientIp(
  headers: VercelRequest['headers'] | Headers | undefined,
): string {
  const forwarded = headerValue(headers, 'x-forwarded-for')
  const realIp = headerValue(headers, 'x-real-ip')
  const raw = forwarded.split(',')[0]?.trim() || realIp.trim()
  return raw || 'unknown'
}

function takeSlot(
  key: string,
  max: number,
  windowMs: number,
  now = Date.now(),
): { ok: true } | { ok: false; retryAfterSec: number } {
  const cutoff = now - windowMs
  const stamps = (hitWindows.get(key) ?? []).filter((stamp) => stamp > cutoff)
  if (stamps.length >= max) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((stamps[0] + windowMs - now) / 1000),
    )
    hitWindows.set(key, stamps)
    return { ok: false, retryAfterSec }
  }
  stamps.push(now)
  hitWindows.set(key, stamps)
  return { ok: true }
}

function rateLimitMessage(retryAfterSec: number): string {
  const minutes = Math.ceil(retryAfterSec / 60)
  return minutes > 1
    ? `Demasiadas solicitudes. Espera ${minutes} min para no saturar Gemini.`
    : `Demasiadas solicitudes. Espera ${retryAfterSec} s para no saturar Gemini.`
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

  if (body.prompt.length > MAX_PROMPT_CHARS) {
    return {
      status: 413,
      payload: {
        error: `El CV u oferta es demasiado largo (máx. ${MAX_PROMPT_CHARS.toLocaleString('es')} caracteres).`,
      },
    }
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

function applyRateLimits(
  ip: string,
  usesSharedKey: boolean,
): { status: number; payload: AdaptCvPayload } | null {
  if (inflightIps.has(ip)) {
    return {
      status: 429,
      payload: {
        error: 'Ya hay una solicitud en curso. Espera a que termine.',
        retryAfterSec: 15,
      },
    }
  }

  const ipLimit = takeSlot(`ip:${ip}`, IP_MAX_REQUESTS, IP_WINDOW_MS)
  if (!ipLimit.ok) {
    return {
      status: 429,
      payload: {
        error: rateLimitMessage(ipLimit.retryAfterSec),
        retryAfterSec: ipLimit.retryAfterSec,
      },
    }
  }

  if (usesSharedKey) {
    const sharedLimit = takeSlot(
      'shared-env-key',
      SHARED_MAX_REQUESTS,
      SHARED_WINDOW_MS,
    )
    if (!sharedLimit.ok) {
      return {
        status: 429,
        payload: {
          error: rateLimitMessage(sharedLimit.retryAfterSec),
          retryAfterSec: sharedLimit.retryAfterSec,
        },
      }
    }
  }

  return null
}

async function processAdaptCv(
  body: AdaptCvBody,
  env: GeminiEnv,
  ip: string,
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

  if (body.prompt.length > MAX_PROMPT_CHARS) {
    return {
      status: 413,
      payload: {
        error: `El CV u oferta es demasiado largo (máx. ${MAX_PROMPT_CHARS.toLocaleString('es')} caracteres).`,
      },
    }
  }

  const usesSharedKey = !body.apiKey?.trim()
  const limited = applyRateLimits(ip, usesSharedKey)
  if (limited) return limited

  inflightIps.add(ip)
  try {
    return await runAdaptCv(body, env)
  } finally {
    inflightIps.delete(ip)
  }
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
    const { status, payload } = await processAdaptCv(
      body,
      env,
      clientIp(request.headers),
    )
    const headers = new Headers({ 'Content-Type': 'application/json' })
    if ('retryAfterSec' in payload && payload.retryAfterSec) {
      headers.set('Retry-After', String(payload.retryAfterSec))
    }
    return new Response(JSON.stringify(payload), { status, headers })
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
    const { status, payload } = await processAdaptCv(
      body,
      {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        GEMINI_MODEL: process.env.GEMINI_MODEL,
      },
      clientIp(req.headers),
    )
    if ('retryAfterSec' in payload && payload.retryAfterSec) {
      res.setHeader('Retry-After', String(payload.retryAfterSec))
    }
    res.status(status).json(payload)
  } catch (error) {
    res.status(500).json({
      error:
        error instanceof Error ? error.message : 'Error interno del proxy',
    })
  }
}
