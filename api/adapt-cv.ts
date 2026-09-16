import { handleAdaptCvRequest } from '../server/adaptCvCore'

export const maxDuration = 60

export default {
  async fetch(request: Request) {
    return handleAdaptCvRequest(request, {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      GEMINI_MODEL: process.env.GEMINI_MODEL,
    })
  },
}
