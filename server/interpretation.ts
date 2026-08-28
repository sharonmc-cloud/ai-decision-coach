import OpenAI from 'openai'
import { DECISION_COACH_INSTRUCTIONS } from './aiInstructions.js'

export const INTERPRETATION_MODEL = 'gpt-5-mini'

export interface AIInterpretation {
  decision: { optionA: string; optionB: string }
  pullingToward: string[]
  holdingBack: string[]
  fears: string[]
  followUpPrompts: string[]
}

const interpretationSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['decision', 'pullingToward', 'holdingBack', 'fears', 'followUpPrompts'],
  properties: {
    decision: {
      type: 'object',
      additionalProperties: false,
      required: ['optionA', 'optionB'],
      properties: { optionA: { type: 'string' }, optionB: { type: 'string' } },
    },
    pullingToward: { type: 'array', items: { type: 'string' }, maxItems: 5 },
    holdingBack: { type: 'array', items: { type: 'string' }, maxItems: 5 },
    fears: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    followUpPrompts: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 3 },
  },
} as const

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const isStringArray = (value: unknown, max: number, min = 0): value is string[] =>
  Array.isArray(value) && value.length >= min && value.length <= max && value.every(isNonEmptyString)

export function validateInterpretation(value: unknown): value is AIInterpretation {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  const decision = item.decision as Record<string, unknown> | undefined
  return Boolean(decision && isNonEmptyString(decision.optionA) && isNonEmptyString(decision.optionB))
    && isStringArray(item.pullingToward, 5)
    && isStringArray(item.holdingBack, 5)
    && isStringArray(item.fears, 4)
    && isStringArray(item.followUpPrompts, 3, 2)
}

export async function interpretBrainDump(brainDump: string, apiKey: string): Promise<AIInterpretation> {
  const client = new OpenAI({ apiKey })
  const response = await client.responses.create({
    model: INTERPRETATION_MODEL,
    instructions: DECISION_COACH_INSTRUCTIONS,
    input: brainDump,
    text: {
      format: {
        type: 'json_schema',
        name: 'decision_interpretation',
        strict: true,
        schema: interpretationSchema,
      },
    },
  })

  let parsed: unknown
  try {
    parsed = JSON.parse(response.output_text)
  } catch {
    throw new Error('Model response was not valid JSON')
  }
  if (!validateInterpretation(parsed)) throw new Error('Model response failed validation')
  return parsed
}
