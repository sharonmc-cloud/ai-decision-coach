import type { Interpretation, Synthesis } from './types'

export const mockInterpretation: Interpretation = {
  decision: { optionA: 'Take the job', optionB: 'Keep looking' },
  pullingToward: [
    { id: 'growth', text: 'Career growth', category: 'pullingToward', source: 'ai' },
    { id: 'ai-work', text: 'Interesting AI work', category: 'pullingToward', source: 'ai' },
    { id: 'leave', text: 'Opportunity to leave current situation', category: 'pullingToward', source: 'ai' },
  ],
  holdingBack: [
    { id: 'compensation', text: 'Compensation below target', category: 'holdingBack', source: 'ai' },
    { id: 'company', text: 'Limited excitement about the company', category: 'holdingBack', source: 'ai' },
    { id: 'time', text: 'Giving up time that could go toward other opportunities', category: 'holdingBack', source: 'ai' },
  ],
  fears: [
    { id: 'better-opportunity', text: 'A better opportunity will appear immediately afterward', category: 'fears', source: 'ai' },
    { id: 'settling', text: "You'll regret accepting something that feels like settling", category: 'fears', source: 'ai' },
  ],
  followUpPrompts: [
    'What would you be giving up by saying yes?',
    'How important are the people and culture in this decision?',
    "Is there anything you're excited about but haven't mentioned yet?",
  ],
}

export const mockSynthesis: Synthesis = {
  coreTension: 'Getting momentum now vs. holding out for something that better meets your standards.',
  lessScary: 'A better opportunity appearing afterward still matters, but accepting this opportunity would not eliminate every future option.',
  upside: 'The meaningful upside is gaining experience that could expand your future career options.',
  unknown: 'How much direct ownership would you actually have over the AI product?',
  questions: [
    'If the compensation changed, would this become an easy yes?',
    "If this weren't an AI role, would you still want it?",
    'What would you regret more six months from now: taking an imperfect opportunity or never finding out where it could lead?',
  ],
}
