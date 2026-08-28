import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleInterpretRequest } from '../server/apiHandlers.js'
import { readVercelJson, sendJson } from '../server/http.js'

type VercelRequest = IncomingMessage & { body?: unknown }

export default async function handler(request: VercelRequest, response: ServerResponse) {
  const result = await handleInterpretRequest({
    method: request.method,
    apiKey: process.env.OPENAI_API_KEY,
    readBody: () => readVercelJson(request),
  })
  return sendJson(response, result.status, result.body)
}
