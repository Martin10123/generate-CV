import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { handleAdaptCvRequest } from './server/adaptCvCore.ts'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

function geminiProxy(): Plugin {
  return {
    name: 'gemini-proxy',
    configureServer(server) {
      server.middlewares.use('/api/adapt-cv', async (req, res) => {
        try {
          const chunks: Buffer[] = []
          if (req.method === 'POST') {
            for await (const chunk of req) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
            }
          }

          const env = loadEnv(server.config.mode, rootDir, '')
          const request = new Request('http://localhost/api/adapt-cv', {
            method: req.method,
            headers: {
              'content-type': req.headers['content-type'] ?? 'application/json',
            },
            body: chunks.length > 0 ? Buffer.concat(chunks) : undefined,
          })

          const response = await handleAdaptCvRequest(request, {
            GEMINI_API_KEY: env.GEMINI_API_KEY,
            GEMINI_MODEL: env.GEMINI_MODEL,
          })

          res.statusCode = response.status
          response.headers.forEach((value, key) => {
            res.setHeader(key, value)
          })
          res.end(Buffer.from(await response.arrayBuffer()))
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
