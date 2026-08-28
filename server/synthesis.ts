import OpenAI from 'openai'
import { SYNTHESIS_INSTRUCTIONS } from './aiInstructions.js'
import { INTERPRETATION_MODEL } from './interpretation.js'

export interface SynthesisContext {
  brainDump: string
  interpretation: {
    decision: { optionA: string; optionB: string }
    pullingToward: string[]
    holdingBack: string[]
    fears: string[]
  }
  userAddedConsiderations: string[]
  influenceRatings: Array<{ consideration: string; category: string; rating: number }>
  highestInfluenceFear: string | null
  fearExploration: { likelihood: number; impact: number; reflection: string }
  strongestPositiveDriver: string | null
  positiveExploration: { outcome: string; meaningfulness: number; conditions: string }
}

export interface DecisionSynthesis {
  coreTension: string
  lessScary: string
  upside: string
  stillNeedToKnow: string[]
  decisionProbes: string[]
}

const synthesisSchema = {
  type: 'object', additionalProperties: false,
  required: ['coreTension', 'lessScary', 'upside', 'stillNeedToKnow', 'decisionProbes'],
  properties: {
    coreTension: { type: 'string' },
    lessScary: { type: 'string' },
    upside: { type: 'string' },
    stillNeedToKnow: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 },
    decisionProbes: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 3 },
  },
} as const

const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const stringArray = (value: unknown, min: number, max: number): value is string[] =>
  Array.isArray(value) && value.length >= min && value.length <= max && value.every(nonEmpty)

export function validateSynthesis(value: unknown): value is DecisionSynthesis {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return nonEmpty(item.coreTension)
    && nonEmpty(item.lessScary)
    && nonEmpty(item.upside)
    && stringArray(item.stillNeedToKnow, 1, 3)
    && stringArray(item.decisionProbes, 2, 3)
}

export async function synthesizeDecision(context: SynthesisContext, apiKey: string): Promise<DecisionSynthesis> {
  const client = new OpenAI({ apiKey })
  const response = await client.responses.create({
    model: INTERPRETATION_MODEL,
    instructions: SYNTHESIS_INSTRUCTIONS,
    input: JSON.stringify(context),
    text: { format: { type: 'json_schema', name: 'decision_synthesis', strict: true, schema: synthesisSchema } },
  })
  let parsed: unknown
  try { parsed = JSON.parse(response.output_text) } catch { throw new Error('Model response was not valid JSON') }
  if (!validateSynthesis(parsed)) throw new Error('Model response failed validation')
  return parsed
}
