import { useMemo, useState } from 'react'
import { mockInterpretation, mockSynthesis } from './mockData'
import type { AIInterpretation, Consideration, ConsiderationCategory, DecisionJourneyState, Interpretation } from './types'

const allMockItems = [
  ...mockInterpretation.pullingToward,
  ...mockInterpretation.holdingBack,
  ...mockInterpretation.fears,
]

const initialState: DecisionJourneyState = {
  brainDump: '',
  interpretation: mockInterpretation,
  addedConsiderations: [],
  influenceRatings: Object.fromEntries(allMockItems.map((item) => [item.id, 5])),
  selectedFearId: null,
  fearExploration: { likelihood: 5, impact: 5, response: '' },
  selectedPositiveId: null,
  upsideExploration: { outcome: '', meaningfulness: 5, conditions: '' },
  synthesis: mockSynthesis,
}

const categoryLabels: Record<ConsiderationCategory, string> = {
  pullingToward: 'Pulling you toward it',
  holdingBack: 'Holding you back',
  fears: "You're afraid that...",
}

function Slider({ id, value, onChange, low, high }: { id: string; value: number; onChange: (value: number) => void; low?: string; high?: string }) {
  return <div className="slider-wrap">
    <input id={id} type="range" min="1" max="10" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    <div className="slider-labels"><span>{low ?? 'Low influence'}</span><strong aria-live="polite">{value}</strong><span>{high ?? 'High influence'}</span></div>
  </div>
}

function App() {
  const [screen, setScreen] = useState(1)
  const [journey, setJourney] = useState(initialState)
  const [newItem, setNewItem] = useState('')
  const [loading, setLoading] = useState(false)
  const [interpretationError, setInterpretationError] = useState(false)

  const considerations = useMemo(() => [
    ...journey.interpretation.pullingToward,
    ...journey.interpretation.holdingBack,
    ...journey.interpretation.fears,
    ...journey.addedConsiderations,
  ], [journey.interpretation, journey.addedConsiderations])
  const highest = (items: Consideration[]) => items.length ? items.reduce((best, item) =>
    (journey.influenceRatings[item.id] ?? 5) > (journey.influenceRatings[best.id] ?? 5) ? item : best, items[0]) : undefined

  const next = (prepare?: () => void) => {
    prepare?.()
    setScreen((current) => Math.min(6, current + 1))
    window.scrollTo(0, 0)
  }
  const previous = () => { setScreen((current) => Math.max(1, current - 1)); window.scrollTo(0, 0) }
  const interpret = async () => {
    if (loading) return
    setLoading(true)
    setInterpretationError(false)
    try {
      const response = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brainDump: journey.brainDump }),
      })
      if (!response.ok) throw new Error('Interpretation request failed')
      const result = await response.json() as AIInterpretation
      const makeItems = (items: string[], category: ConsiderationCategory): Consideration[] =>
        items.map((text, index) => ({ id: `ai-${category}-${index}`, text, category, source: 'ai' }))
      const interpretation: Interpretation = {
        decision: result.decision,
        pullingToward: makeItems(result.pullingToward, 'pullingToward'),
        holdingBack: makeItems(result.holdingBack, 'holdingBack'),
        fears: makeItems(result.fears, 'fears'),
        followUpPrompts: result.followUpPrompts,
      }
      const aiItems = [...interpretation.pullingToward, ...interpretation.holdingBack, ...interpretation.fears]
      setJourney((current) => ({
        ...current,
        interpretation,
        influenceRatings: Object.fromEntries(aiItems.map((item) => [item.id, 5])),
        selectedFearId: null,
        selectedPositiveId: null,
      }))
      next()
    } catch {
      setInterpretationError(true)
    } finally {
      setLoading(false)
    }
  }
  const addConsideration = () => {
    const text = newItem.trim()
    if (!text) return
    const item: Consideration = { id: `user-${Date.now()}`, text, category: 'holdingBack', source: 'user' }
    setJourney((current) => ({
      ...current,
      addedConsiderations: [...current.addedConsiderations, item],
      influenceRatings: { ...current.influenceRatings, [item.id]: 5 },
    }))
    setNewItem('')
  }
  const selectFear = () => {
    const fear = highest(journey.interpretation.fears)
    setJourney((current) => ({ ...current, selectedFearId: fear?.id ?? null }))
  }
  const selectPositive = () => {
    const positive = highest(journey.interpretation.pullingToward)
    setJourney((current) => ({ ...current, selectedPositiveId: positive?.id ?? null }))
  }
  const selectedFear = journey.interpretation.fears.find((item) => item.id === journey.selectedFearId) ?? highest(journey.interpretation.fears)
  const selectedPositive = journey.interpretation.pullingToward.find((item) => item.id === journey.selectedPositiveId) ?? highest(journey.interpretation.pullingToward)

  return <main>
    <header className="topbar"><span className="brand">AI Decision Coach</span><span>Step {screen} of 6</span></header>
    <div className="progress" aria-label={`Step ${screen} of 6`}><span style={{ width: `${screen / 6 * 100}%` }} /></div>
    <section className="page">
      {screen === 1 && <>
        <p className="eyebrow">Start with what you know</p>
        <h1>What are you trying to figure out?</h1>
        <p className="intro">Put it all here. The context, the options, what's exciting, what's worrying you. It doesn't need to be organized.</p>
        <label htmlFor="brain-dump">Your thoughts</label>
        <textarea id="brain-dump" className="large" placeholder="I've been offered a new role, and I'm trying to decide..." value={journey.brainDump} onChange={(e) => { setJourney({ ...journey, brainDump: e.target.value }); setInterpretationError(false) }} />
        {interpretationError && <div className="error-message" role="alert"><strong>We couldn't untangle that just yet.</strong> Your thoughts are still here—try again.</div>}
        <div className="actions end"><button className="primary" disabled={!journey.brainDump.trim() || loading} onClick={interpret}>{loading ? 'Organizing your thoughts…' : interpretationError ? 'Retry →' : 'Help me untangle this →'}</button></div>
      </>}

      {screen === 2 && <>
        <p className="eyebrow">A first interpretation</p><h1>Here's what I'm hearing</h1>
        <p className="intro">This is a starting point, not a judgment. You can add anything that's missing.</p>
        <div className="groups">{(['pullingToward', 'holdingBack', 'fears'] as const).map((category) => <div className="card" key={category}>
          <h2>{categoryLabels[category]}</h2><ul>{journey.interpretation[category].map((item) => <li key={item.id}>{item.text}</li>)}</ul>
        </div>)}</div>
        {journey.addedConsiderations.length > 0 && <div className="card added"><h2>Things you added</h2><ul>{journey.addedConsiderations.map((item) => <li key={item.id}>{item.text}</li>)}</ul></div>}
        <div className="add-section"><h2>What should we add?</h2><p>Before we unpack anything, let's make sure we got it all.</p>
          <ul className="prompts">{journey.interpretation.followUpPrompts.map((prompt) => <li key={prompt}>{prompt}</li>)}</ul>
          <label htmlFor="consideration">Missing consideration</label><input id="consideration" value={newItem} placeholder="Something else that matters..." onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addConsideration() }} />
          <button className="text-button" disabled={!newItem.trim()} onClick={addConsideration}>+ Add something else</button>
        </div>
        <div className="actions"><button className="secondary" onClick={previous}>Previous</button><button className="primary" onClick={() => next()}>That's everything →</button></div>
      </>}

      {screen === 3 && <>
        <p className="eyebrow">Your perspective</p><h1>What's driving you?</h1><p className="intro">How much is each of these affecting your decision?</p>
        <div className="rating-list">{considerations.map((item) => <div className="rating" key={item.id}><div><span className="tag">{categoryLabels[item.category]}</span><label htmlFor={`rating-${item.id}`}>{item.text}</label></div><Slider id={`rating-${item.id}`} value={journey.influenceRatings[item.id] ?? 5} onChange={(value) => setJourney({ ...journey, influenceRatings: { ...journey.influenceRatings, [item.id]: value } })} /></div>)}</div>
        <div className="actions"><button className="secondary" onClick={previous}>Previous</button><button className="primary" onClick={() => next(selectFear)}>Continue →</button></div>
      </>}

      {screen === 4 && <>
        <p className="eyebrow">Look closer</p><h1>Let's look at what you're afraid of.</h1>{selectedFear ? <div className="focus"><span>The fear with the most influence</span><strong>{selectedFear.text}</strong></div> : <p className="intro">You didn't identify a specific fear, so there's nothing to rate here.</p>}
        {selectedFear && <>
        <div className="field"><label htmlFor="fear-likelihood">How likely does this feel?</label><Slider id="fear-likelihood" low="Very unlikely" high="Very likely" value={journey.fearExploration.likelihood} onChange={(value) => setJourney({ ...journey, fearExploration: { ...journey.fearExploration, likelihood: value } })} /></div>
        <div className="field"><label htmlFor="fear-impact">If it happened, how difficult would it actually be?</label><Slider id="fear-impact" low="Manageable" high="Very difficult" value={journey.fearExploration.impact} onChange={(value) => setJourney({ ...journey, fearExploration: { ...journey.fearExploration, impact: value } })} /></div>
        <div className="field"><label htmlFor="fear-response">If that happened, what options would you still have?</label><textarea id="fear-response" value={journey.fearExploration.response} onChange={(e) => setJourney({ ...journey, fearExploration: { ...journey.fearExploration, response: e.target.value } })} /></div></>}
        <div className="actions"><button className="secondary" onClick={previous}>Previous</button><button className="primary" onClick={() => next(selectPositive)}>Continue →</button></div>
      </>}

      {screen === 5 && <>
        <p className="eyebrow">Make room for possibility</p><h1>Now imagine it goes really well.</h1><p className="intro">You've spent some time thinking about what could go wrong. Let's give the best outcome the same attention.</p>
        {selectedPositive ? <div className="focus positive"><span>Your strongest positive driver</span><strong>{selectedPositive.text}</strong></div> : <p className="intro">You didn't identify a specific positive driver, so there's nothing to explore here.</p>}
        {selectedPositive && <>
        <p className="scenario">Imagine you choose this path and a year from now you're genuinely glad you did.</p>
        <div className="field"><label htmlFor="outcome">What happened?</label><textarea id="outcome" value={journey.upsideExploration.outcome} onChange={(e) => setJourney({ ...journey, upsideExploration: { ...journey.upsideExploration, outcome: e.target.value } })} /></div>
        <div className="field"><label htmlFor="meaning">How meaningful would that outcome be?</label><Slider id="meaning" low="Nice" high="Transformative" value={journey.upsideExploration.meaningfulness} onChange={(value) => setJourney({ ...journey, upsideExploration: { ...journey.upsideExploration, meaningfulness: value } })} /></div>
        <div className="field"><label htmlFor="conditions">What would need to be true for this outcome to happen?</label><textarea id="conditions" value={journey.upsideExploration.conditions} onChange={(e) => setJourney({ ...journey, upsideExploration: { ...journey.upsideExploration, conditions: e.target.value } })} /></div></>}
        <div className="actions"><button className="secondary" onClick={previous}>Previous</button><button className="primary" onClick={() => next()}>Continue →</button></div>
      </>}

      {screen === 6 && <>
        <p className="eyebrow">Step back</p><h1>Here's what seems to matter.</h1><p className="intro">A reflection on what you've explored—not a verdict.</p>
        <div className="synthesis">
          <div><h2>The core tension</h2><p>{journey.synthesis.coreTension}</p></div>
          <div><h2>What seems less scary than it did</h2><p>{journey.synthesis.lessScary}</p></div>
          <div><h2>The upside you're drawn to</h2><p>{journey.synthesis.upside}</p></div>
          <div><h2>What you still need to know</h2><p>{journey.synthesis.unknown}</p></div>
        </div>
        <div className="questions"><h2>Questions worth sitting with</h2><ul>{journey.synthesis.questions.map((question) => <li key={question}>{question}</li>)}</ul></div>
        <p className="closing">You don't have to decide right now. But you understand the decision better than when you started.</p>
        <div className="actions"><button className="secondary" onClick={previous}>Previous</button></div>
      </>}
    </section>
  </main>
}

export default App
