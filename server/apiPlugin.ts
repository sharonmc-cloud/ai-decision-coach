import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { loadEnv } from 'vite'
import { handleInterpretRequest, handleSynthesisRequest } from './apiHandlers'
import { readJson, sendJson } from './http'

export function decisionCoachApiPlugin(): Plugin {
  const attach = (middlewares: { use: (path: string, handler: (request: IncomingMessage, response: ServerResponse) => void) => void }, mode: string) => {
    const apiKey = loadEnv(mode, process.cwd(), '').OPENAI_API_KEY
    middlewares.use('/api/interpret', async (request, response) => {
      const result = await handleInterpretRequest({ method: request.method, apiKey, readBody: () => readJson(request) })
      return sendJson(response, result.status, result.body)
    })
    middlewares.use('/api/synthesize', async (request, response) => {
      const result = await handleSynthesisRequest({ method: request.method, apiKey, readBody: () => readJson(request) })
      return sendJson(response, result.status, result.body)
    })
  }

  return {
    name: 'decision-coach-api',
    configureServer(server) { attach(server.middlewares, server.config.mode) },
    configurePreviewServer(server) { attach(server.middlewares, server.config.mode) },
  }
}
