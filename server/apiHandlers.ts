import { interpretBrainDump } from './interpretation'
import { synthesizeDecision, type SynthesisContext } from './synthesis'

export interface ApiResult {
  status: number
  body: unknown
}

interface ApiRequest {
  method?: string
  apiKey?: string
  readBody: () => Promise<unknown>
}

export async function handleInterpretRequest(request: ApiRequest): Promise<ApiResult> {
  if (request.method !== 'POST') return { status: 405, body: { error: 'Method not allowed' } }

  try {
    const body = await request.readBody() as { brainDump?: unknown }
    if (typeof body?.brainDump !== 'string' || !body.brainDump.trim()) {
      return { status: 400, body: { error: 'A brain dump is required' } }
    }
    if (!request.apiKey) throw new Error('OPENAI_API_KEY is not configured')
    return {
      status: 200,
      body: await interpretBrainDump(body.brainDump.trim(), request.apiKey),
    }
  } catch {
    console.error('Interpretation request failed')
    return { status: 500, body: { error: 'Interpretation unavailable' } }
  }
}

export async function handleSynthesisRequest(request: ApiRequest): Promise<ApiResult> {
  if (request.method !== 'POST') return { status: 405, body: { error: 'Method not allowed' } }

  try {
    const body = await request.readBody() as { context?: SynthesisContext }
    if (!body?.context || typeof body.context.brainDump !== 'string' || !body.context.brainDump.trim()) {
      return { status: 400, body: { error: 'Decision context is required' } }
    }
    if (!request.apiKey) throw new Error('OPENAI_API_KEY is not configured')
    return {
      status: 200,
      body: await synthesizeDecision(body.context, request.apiKey),
    }
  } catch {
    console.error('Synthesis request failed')
    return { status: 500, body: { error: 'Synthesis unavailable' } }
  }
}
