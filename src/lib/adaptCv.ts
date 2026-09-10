import {
  buildCvAdaptPrompt,
  buildCvIngestPrompt,
  parseCvJson,
} from './prompt'
import type { CvData } from './cvTypes'

const API_KEY_STORAGE = 'cv_adapt_gemini_api_key'

export function loadStoredApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE) ?? ''
  } catch {
    return ''
  }
}

export function saveApiKey(apiKey: string): void {
  try {
    if (apiKey.trim()) {
      localStorage.setItem(API_KEY_STORAGE, apiKey.trim())
    } else {
      localStorage.removeItem(API_KEY_STORAGE)
    }
  } catch {
    // ignore storage errors
  }
}

async function requestCvJson(input: {
  prompt: string
  apiKey: string
  emptyError: string
}): Promise<CvData> {
  const response = await fetch('/api/adapt-cv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: input.prompt,
      apiKey: input.apiKey.trim() || undefined,
      json: true,
    }),
  })

  const data = (await response.json()) as { text?: string; error?: string }

  if (!response.ok) {
    throw new Error(data.error || `Error ${response.status}`)
  }

  if (!data.text?.trim()) {
    throw new Error(input.emptyError)
  }

  try {
    return parseCvJson(data.text)
  } catch {
    throw new Error('Gemini no devolvió JSON válido del CV')
  }
}

/** Carga un CV libre a la plantilla fija (sin oferta laboral). */
export async function ingestCv(input: {
  currentCv: string
  apiKey: string
}): Promise<CvData> {
  return requestCvJson({
    prompt: buildCvIngestPrompt(input.currentCv),
    apiKey: input.apiKey,
    emptyError: 'No se recibió el CV estructurado',
  })
}

export async function adaptCv(input: {
  jobOffer: string
  currentCv: string
  apiKey: string
}): Promise<CvData> {
  return requestCvJson({
    prompt: buildCvAdaptPrompt(input.jobOffer, input.currentCv),
    apiKey: input.apiKey,
    emptyError: 'No se recibió texto adaptado',
  })
}
