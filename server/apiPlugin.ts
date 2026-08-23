import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { loadEnv } from 'vite'
import { interpretBrainDump } from './interpretation'
import { synthesizeDecision, type SynthesisContext } from './synthesis'

const MAX_BODY_BYTES = 50_000

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(body))
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk)
    size += buffer.length
    if (size > MAX_BODY_BYTES) throw new Error('Request too large')
    chunks.push(buffer)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

export function decisionCoachApiPlugin(): Plugin {
  const attach = (middlewares: { use: (path: string, handler: (request: IncomingMessage, response: ServerResponse) => void) => void }, mode: string) => {
    const apiKey = loadEnv(mode, process.cwd(), '').OPENAI_API_KEY
    middlewares.use('/api/interpret', async (request, response) => {
      if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed' })
      try {
        const body = await readJson(request) as { brainDump?: unknown }
        if (typeof body.brainDump !== 'string' || !body.brainDump.trim()) {
          return sendJson(response, 400, { error: 'A brain dump is required' })
        }
        if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')
        const interpretation = await interpretBrainDump(body.brainDump.trim(), apiKey)
        return sendJson(response, 200, interpretation)
      } catch (error) {
        console.error('Interpretation request failed:', error instanceof Error ? error.message : 'Unknown error')
        return sendJson(response, 500, { error: 'Interpretation unavailable' })
      }
    })
    middlewares.use('/api/synthesize', async (request, response) => {
      if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed' })
      try {
        const body = await readJson(request) as { context?: SynthesisContext }
        if (!body.context || typeof body.context.brainDump !== 'string' || !body.context.brainDump.trim()) {
          return sendJson(response, 400, { error: 'Decision context is required' })
        }
        if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')
        return sendJson(response, 200, await synthesizeDecision(body.context, apiKey))
      } catch (error) {
        console.error('Synthesis request failed:', error instanceof Error ? error.message : 'Unknown error')
        return sendJson(response, 500, { error: 'Synthesis unavailable' })
      }
    })
  }

  return {
    name: 'decision-coach-api',
    configureServer(server) { attach(server.middlewares, server.config.mode) },
    configurePreviewServer(server) { attach(server.middlewares, server.config.mode) },
  }
}
