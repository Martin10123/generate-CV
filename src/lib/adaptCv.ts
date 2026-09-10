import { buildCvAdaptPrompt, parseCvJson } from './prompt'
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

function extractOfferKeywords(offer: string): string[] {
  const stop = new Set([
    'para',
    'con',
    'los',
    'las',
    'del',
    'una',
    'uno',
    'que',
    'por',
    'como',
    'the',
    'and',
    'or',
    'of',
    'to',
    'in',
    'a',
    'an',
    'de',
    'el',
    'la',
    'en',
    'y',
    'o',
    'un',
    'se',
    'al',
  ])
  return [
    ...new Set(
      offer
        .toLowerCase()
        .match(/[a-z0-9+#./-]{3,}/gi)
        ?.map((w) => w.toLowerCase())
        .filter((w) => !stop.has(w)) ?? [],
    ),
  ].slice(0, 40)
}

function findMissingSpacesAroundBold(text: string): string[] {
  const issues: string[] = []
  const re = /([^\s*])?\*\*([^*]+)\*\*([^\s*]?)?/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    const before = m[1] ?? ''
    const after = m[3] ?? ''
    if (before && /[A-Za-zÁÉÍÓÚáéíóú0-9]/.test(before)) {
      issues.push(`before:**${m[2]}**`)
    }
    if (after && /[A-Za-zÁÉÍÓÚáéíóú0-9]/.test(after)) {
      issues.push(`after:**${m[2]}**→${after}`)
    }
  }
  return issues.slice(0, 20)
}

export async function adaptCv(input: {
  jobOffer: string
  currentCv: string
  apiKey: string
}): Promise<CvData> {
  const prompt = buildCvAdaptPrompt(input.jobOffer, input.currentCv)

  // #region agent log
  fetch('http://127.0.0.1:7464/ingest/84290af7-0843-4e28-966d-cd283818b1e1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'ff1c74',
    },
    body: JSON.stringify({
      sessionId: 'ff1c74',
      runId: 'post-fix',
      hypothesisId: 'E',
      location: 'adaptCv.ts:entry',
      message: 'adaptCv start',
      data: {
        offerLen: input.jobOffer.length,
        cvLen: input.currentCv.length,
        offerKeywords: extractOfferKeywords(input.jobOffer).slice(0, 25),
        criticalOfferTerms: ['aws', 'serverless', 'apis', 'integrations', 'ai', 'llm'],
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  const response = await fetch('/api/adapt-cv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      apiKey: input.apiKey.trim() || undefined,
      json: true,
    }),
  })

  const data = (await response.json()) as { text?: string; error?: string }

  if (!response.ok) {
    throw new Error(data.error || `Error ${response.status}`)
  }

  if (!data.text?.trim()) {
    throw new Error('No se recibió texto adaptado')
  }

  // #region agent log
  {
    const boldSpaceIssues = findMissingSpacesAroundBold(data.text)
    const keywords = extractOfferKeywords(input.jobOffer)
    const hay = data.text.toLowerCase()
    const matched = keywords.filter((k) => hay.includes(k))
    const missing = keywords.filter((k) => !hay.includes(k))
    fetch('http://127.0.0.1:7464/ingest/84290af7-0843-4e28-966d-cd283818b1e1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'ff1c74',
      },
      body: JSON.stringify({
        sessionId: 'ff1c74',
        runId: 'post-fix',
        hypothesisId: 'E',
        location: 'adaptCv.ts:rawResponse',
        message: 'Gemini raw + keyword coverage',
        data: {
          status: response.status,
          rawLen: data.text.length,
          summarySnippet: data.text.slice(0, 280),
          boldSpaceIssues,
          keywordMatchedCount: matched.length,
          keywordTotal: keywords.length,
          keywordCoveragePct:
            keywords.length === 0
              ? 0
              : Math.round((matched.length / keywords.length) * 100),
          missingKeywords: missing.slice(0, 20),
          matchedSample: matched.slice(0, 20),
          hasAws: hay.includes('aws'),
          hasServerless: hay.includes('serverless'),
          hasApis: hay.includes('api'),
          hasAiOrLlm: /ai\/llms|\bllms?\b|\bai\b/.test(hay),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
  }
  // #endregion

  try {
    const parsed = parseCvJson(data.text)

    // #region agent log
    fetch('http://127.0.0.1:7464/ingest/84290af7-0843-4e28-966d-cd283818b1e1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'ff1c74',
      },
      body: JSON.stringify({
        sessionId: 'ff1c74',
        runId: 'post-fix',
        hypothesisId: 'E',
        location: 'adaptCv.ts:parsed',
        message: 'Parsed CV text space checks',
        data: {
          name: parsed.name,
          nameHasSpaces: /\s/.test(parsed.name),
          summaryHasSpaces: /\s/.test(parsed.summary),
          summaryBoldIssues: findMissingSpacesAroundBold(parsed.summary),
          bullet0: parsed.experience[0]?.bullets[0]?.slice(0, 180),
          bullet0BoldIssues: findMissingSpacesAroundBold(
            parsed.experience[0]?.bullets[0] ?? '',
          ),
          role0: parsed.experience[0]?.role,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion

    return parsed
  } catch {
    throw new Error('Gemini no devolvió JSON válido del CV')
  }
}
