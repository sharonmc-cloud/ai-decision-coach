import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleSynthesisRequest } from '../server/apiHandlers.js'
import { readVercelJson, sendJson } from '../server/http.js'

type VercelRequest = IncomingMessage & { body?: unknown }

export default async function handler(request: VercelRequest, response: ServerResponse) {
  const result = await handleSynthesisRequest({
    method: request.method,
    apiKey: process.env.OPENAI_API_KEY,
    readBody: () => readVercelJson(request),
  })
  return sendJson(response, result.status, result.body)
}
