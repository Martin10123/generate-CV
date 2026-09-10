import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

function geminiProxy(): Plugin {
  return {
    name: 'gemini-proxy',
    configureServer(server) {
      server.middlewares.use('/api/adapt-cv', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Método no permitido' }))
          return
        }

        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
          }
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
            prompt?: string
            apiKey?: string
            json?: boolean
          }

          const env = loadEnv(server.config.mode, rootDir, '')
          const apiKey = body.apiKey?.trim() || env.GEMINI_API_KEY?.trim()

          if (!apiKey) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error:
                  'Falta la API key. Pégala en la app o define GEMINI_API_KEY en .env',
              }),
            )
            return
          }

          if (!body.prompt?.trim()) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'El prompt está vacío' }))
            return
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
            res.statusCode = geminiRes.status
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: data.error?.message || 'Error al llamar a Gemini',
              }),
            )
            return
          }

          const text =
            data.candidates?.[0]?.content?.parts
              ?.map((part) => part.text ?? '')
              .join('')
              .trim() ?? ''

          if (!text) {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Gemini no devolvió texto' }))
            return
          }

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ text }))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error:
                error instanceof Error
                  ? error.message
                  : 'Error interno del proxy',
            }),
          )
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), geminiProxy()],
  resolve: {
    alias: {
      '@': rootDir,
    },
  },
})
