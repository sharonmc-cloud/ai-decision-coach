import type { IncomingMessage, ServerResponse } from 'node:http'

const MAX_BODY_BYTES = 50_000

export function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(body))
}

export async function readJson(request: IncomingMessage): Promise<unknown> {
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

export async function readVercelJson(request: IncomingMessage & { body?: unknown }): Promise<unknown> {
  if (request.body === undefined) return readJson(request)
  if (typeof request.body === 'string') return JSON.parse(request.body)
  if (Buffer.isBuffer(request.body)) return JSON.parse(request.body.toString('utf8'))
  return request.body
}
