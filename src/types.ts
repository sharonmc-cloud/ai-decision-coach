export type ConsiderationCategory = 'pullingToward' | 'holdingBack' | 'fears'

export interface Consideration {
  id: string
  text: string
  category: ConsiderationCategory
  source: 'ai' | 'user'
}

export interface Interpretation {
  decision: { optionA: string; optionB: string }
  pullingToward: Consideration[]
  holdingBack: Consideration[]
  fears: Consideration[]
  followUpPrompts: string[]
}

export interface AIInterpretation {
  decision: { optionA: string; optionB: string }
  pullingToward: string[]
  holdingBack: string[]
  fears: string[]
  followUpPrompts: string[]
}

export interface FearExploration {
  likelihood: number
  impact: number
  response: string
}

export interface UpsideExploration {
  outcome: string
  meaningfulness: number
  conditions: string
}

export interface Synthesis {
  coreTension: string
  lessScary: string
  upside: string
  stillNeedToKnow: string[]
  decisionProbes: string[]
}

export interface DecisionJourneyState {
  brainDump: string
  interpretation: Interpretation
  addedConsiderations: Consideration[]
  influenceRatings: Record<string, number>
  selectedFearId: string | null
  fearExploration: FearExploration
  selectedPositiveId: string | null
  upsideExploration: UpsideExploration
  synthesis: Synthesis
}
