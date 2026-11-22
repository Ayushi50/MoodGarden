import { ReactNode, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { COMPANIONS, DISCOVERIES, EMO, EMOTIONS, EmotionId, PROMPTS, STAGES } from '../data/emotions'
import { PlantPreview } from '../garden/PlantArt'
import { HistoryView, Scrapbook } from './Extras'
import { CheckIn, DAY, Letter, Memory, Plant, State, growthNow, stageNow, uid } from '../store'

export function Sheet({ children, onClose, narrow = false, label, paper = 'cream' }: { children: ReactNode; onClose: () => void; narrow?: boolean; label: string; paper?: string }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <motion.div className="scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .25 }}>
      <motion.div className={`sheet ${narrow ? 'narrow' : ''} paper-${paper}`} role="dialog" aria-label={label} onClick={e => e.stopPropagation()}
        initial={{ y: 40, scale: .96, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: 'spring', damping: 24, stiffness: 260 }}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        {children}
      </motion.div>
    </motion.div>
  )
}

const fmt = (t: number, o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }) => new Date(t).toLocaleDateString(undefined, o)

/* ---------------- check-in ---------------- */
export function CheckInSheet({ onClose, onDone, hasPrompt }: { onClose: () => void; onDone: (sel: { id: EmotionId; level: 1 | 2 | 3 }[], words: { feeling?: string; cause?: string; need?: string; photo?: string }) => void; hasPrompt: boolean }) {
  const [sel, setSel] = useState<Record<string, 1 | 2 | 3>>({})
  const [step, setStep] = useState(0)
  const [w, setW] = useState({ feeling: '', cause: '', need: '' })
  const [photo, setPhoto] = useState<string>()
  const pick = (f?: File) => {
    if (!f) return
    const img = new Image(); const url = URL.createObjectURL(f)
    img.onload = () => {
      const k = Math.min(1, 520 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height); setPhoto(c.toDataURL('image/jpeg', .6)); URL.revokeObjectURL(url)
    }
    img.src = url
  }
  const ids = Object.keys(sel) as EmotionId[]
  const toggle = (id: EmotionId) => setSel(s => { const n = { ...s }; if (n[id]) delete n[id]; else n[id] = 2; return n })
  const prompt = PROMPTS[new Date().getDate() % PROMPTS.length]
  return (
    <Sheet onClose={onClose} label="Mood check-in">
      <AnimatePresence mode="wait">
        {step === 0 ? (
          <motion.div key="a" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <div className="eyebrow">A moment with the garden</div>
            <h2>What is blooming in you?</h2>
            <p className="lede">Choose as many as feel true. Tap a flower again to let it go. Each one will find a place in the meadow.</p>
            <div className="bloom-grid">
              {EMOTIONS.map(e => {
                const on = !!sel[e.id]
                return (
                  <div key={e.id} className={`bloom ${on ? 'sel' : ''}`} style={{ ['--c' as string]: e.deep }}>
                    <button onClick={() => toggle(e.id)} aria-pressed={on} style={{ all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                      <span className="art"><PlantPreview id={e.id} stage={on ? 4 : 3} size={on ? 96 : 88} /></span>
                      <span className="lbl">{e.label}</span>
                    </button>
                    <div className="lvl" style={{ opacity: on ? 1 : 0, pointerEvents: on ? 'auto' : 'none' }} aria-label={`${e.label} intensity`}>
                      {[1, 2, 3].map(n => <i key={n} className={(sel[e.id] || 0) >= n ? 'on' : ''} onClick={() => setSel(s => ({ ...s, [e.id]: n as 1 | 2 | 3 }))} title={['a little', 'some', 'a lot'][n - 1]} />)}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="row spread">
              <span className="hint">{ids.length ? `${ids.length} feeling${ids.length > 1 ? 's' : ''} · petals show how strongly` : 'Nothing is required. Even “neutral” is a flower.'}</span>
              <button className="btn" disabled={!ids.length} onClick={() => setStep(1)}>Continue</button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="b" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <div className="eyebrow">If you feel like it</div>
            <h2>A few words, or none</h2>
            <p className="lede">Everything below is optional. You can plant your seeds without writing a thing.</p>
            <label className="label">What am I feeling?</label>
            <textarea className="field hand" rows={2} value={w.feeling} onChange={e => setW({ ...w, feeling: e.target.value })} placeholder="…" />
            <label className="label">What might have contributed?</label>
            <textarea className="field hand" rows={2} value={w.cause} onChange={e => setW({ ...w, cause: e.target.value })} placeholder="…" />
            <label className="label">What do I need right now?</label>
            <textarea className="field hand" rows={2} value={w.need} onChange={e => setW({ ...w, need: e.target.value })} placeholder="…" />
            <label className="label">A photo, if there is one</label>
            <div className="row">
              <input type="file" accept="image/*" onChange={e => pick(e.target.files?.[0])} className="hint" />
              {photo && <img src={photo} alt="" style={{ height: 54, borderRadius: 6, border: '3px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,.2)' }} />}
            </div>
            {hasPrompt && <p className="hint" style={{ marginTop: 14, fontFamily: 'var(--serif)', fontStyle: 'italic' }}>A thought, should you want one: {prompt}</p>}
            <div className="row spread" style={{ marginTop: 18 }}>
              <button className="btn ghost" onClick={() => setStep(0)}>Back</button>
              <button className="btn" onClick={() => onDone(ids.map(id => ({ id, level: sel[id] })), { ...w, photo })}>Plant {ids.length > 1 ? 'these seeds' : 'this seed'}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  )
}

/* ---------------- plant card ---------------- */
export function PlantSheet({ plant, onClose, onWater }: { plant: Plant; onClose: () => void; onWater: () => void }) {
  const e = EMO[plant.emotion]; const st = stageNow(plant)
  return (
    <Sheet onClose={onClose} narrow label={e.species}>
      <div style={{ textAlign: 'center' }}>
        <div className="eyebrow" style={{ color: e.deep }}>{e.label} · {STAGES[st]}</div>
        <h2>{e.species}</h2>
        <div style={{ margin: '10px 0 0', display: 'grid', placeItems: 'end center', height: 190 }}><PlantPreview id={plant.emotion} stage={st} size={170} /></div>
        <div className="stagebar" style={{ margin: '14px 0 16px' }}>{STAGES.map((s, i) => <i key={s} className={i <= st ? 'on' : ''} title={s} />)}</div>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 18, fontStyle: 'italic', margin: '0 0 6px' }}>“{e.meaning}”</p>
        <p className="lede" style={{ marginBottom: 14 }}>{e.poem}</p>
        <p className="hint">First planted {fmt(plant.plantedAt, { day: 'numeric', month: 'long', year: 'numeric' })} · watered {plant.waters} time{plant.waters === 1 ? '' : 's'}</p>
        <div className="row" style={{ justifyContent: 'center', marginTop: 14 }}>
          <button className="btn" onClick={onWater}>Water it gently</button>
        </div>
        <p className="hint" style={{ marginTop: 10 }}>It grows in its own time. Nothing here wilts when you are away.</p>
      </div>
    </Sheet>
  )
}

/* ---------------- collection ---------------- */
export function CollectionSheet({ state, onClose, onPlant }: { state: State; onClose: () => void; onPlant: (id: string) => void }) {
  const [tab, setTab] = useState<'plants' | 'friends' | 'finds'>('plants')
  return (
    <Sheet onClose={onClose} label="Greenhouse collection">
      <div className="eyebrow">The Greenhouse</div>
      <h2>Your collection</h2>
      <p className="lede">Everything the garden has grown, and everyone who has visited.</p>
      <div className="tabs">{(['plants', 'friends', 'finds'] as const).map(t => <button key={t} className={`tab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>{{ plants: 'Plants', friends: 'Visitors', finds: 'Discoveries' }[t]}</button>)}</div>
      {tab === 'plants' && (
        <div className="grid2">
          {EMOTIONS.map(e => {
            const mine = state.plants.filter(p => p.emotion === e.id).sort((a, b) => growthNow(b) - growthNow(a))
            const best = mine[0]
            return (
              <button key={e.id} className={`pcard ${best ? '' : 'locked'}`} style={{ all: 'unset', display: 'block', cursor: best ? 'pointer' : 'default' }} onClick={() => best && onPlant(best.id)} disabled={!best}>
                <div className={`pcard ${best ? '' : 'locked'}`}>
                  <div className="art"><PlantPreview id={e.id} stage={best ? stageNow(best) : 3} size={96} /></div>
                  <h3 style={{ marginTop: 6 }}>{best ? e.species : 'Not yet found'}</h3>
                  <div className="hint">{best ? `${mine.length} growing · ${e.label}` : `grows from ${e.label.toLowerCase()}`}</div>
                  <div className="stagebar">{STAGES.map((s, i) => <i key={s} className={best && i <= stageNow(best) ? 'on' : ''} />)}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}
      {tab === 'friends' && COMPANIONS.map(c => {
        const got = state.companions.includes(c.id)
        return <div key={c.id} className="entry" style={{ gridTemplateColumns: '1fr', opacity: got ? 1 : .5 }}><div><h3>{got ? c.name : 'Someone is yet to visit'}</h3><div className="hint">{got ? c.text : 'Try sitting still near the pond, the bench, or the meadow.'}</div></div></div>
      })}
      {tab === 'finds' && <div className="refl">Gathered so far: {Object.entries(state.leaves).filter(([k]) => !k.startsWith('t:')).map(([k, v]) => `${v} from ${k}`).join(' · ') || 'nothing yet. Small things appear on the ground each day.'} · {state.bouquets.length} bouquet{state.bouquets.length === 1 ? '' : 's'} · {state.sketches.length} sketch{state.sketches.length === 1 ? '' : 'es'}</div>}
      {tab === 'finds' && DISCOVERIES.map(c => {
        const got = state.found.includes(c.id)
        return <div key={c.id} className="entry" style={{ gridTemplateColumns: '1fr', opacity: got ? 1 : .5 }}><div><h3>{got ? c.name : 'Something is hidden somewhere'}</h3><div className="hint">{got ? c.text : 'The garden keeps small secrets. Wander, and look closely.'}</div></div></div>
      })}
    </Sheet>
  )
}

/* ---------------- journal ---------------- */
function reflections(s: State): string[] {
  const now = Date.now(); const month = s.checkins.filter(c => now - c.at < 31 * DAY)
  const out: string[] = []
  if (!month.length) return ['Your journal is a blank page for now. When you plant a feeling, it will be kept here.']
  const kinds = new Set(month.flatMap(c => c.emotions.map(e => e.id)))
  if (kinds.size >= 3) out.push('You made space for several different feelings this month.')
  const tally: Record<string, number> = {}; month.forEach(c => c.emotions.forEach(e => tally[e.id] = (tally[e.id] || 0) + 1))
  const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]
  if (top) out.push(`Your garden has been growing lots of ${EMO[top[0] as EmotionId].species.toLowerCase()} lately.`)
  const outside = month.filter(c => /outside|walk|park|sun|air|garden/i.test((c.cause || '') + (c.feeling || ''))).length
  if (outside) out.push(`${outside} of your entries mention time outdoors.`)
  if (s.memories.length) out.push(`You have kept ${s.memories.length} moment${s.memories.length > 1 ? 's' : ''} on the Memory Tree.`)
  return out
}
export function JournalSheet({ state, onClose }: { state: State; onClose: () => void }) {
  const [tab, setTab] = useState<'timeline' | 'calendar' | 'history' | 'scrap'>('timeline')
  const [ref, setRef] = useState(() => new Date())
  const entries = [...state.checkins].sort((a, b) => b.at - a.at)
  const first = new Date(ref.getFullYear(), ref.getMonth(), 1); const days = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate()
  const offset = (first.getDay() + 6) % 7
  return (
    <Sheet onClose={onClose} label="Garden journal" paper={state.prefs.paper}>
      <div className="eyebrow">The Garden Journal</div>
      <h2>Pressed flowers</h2>
      <div className="refl">{reflections(state).map((r, i) => <div key={i}>{r}</div>)}</div>
      <div className="tabs">{(['timeline', 'calendar', 'history', 'scrap'] as const).map(t => <button key={t} className={`tab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>{{ timeline: 'Timeline', calendar: 'Botanical calendar', history: 'Garden history', scrap: 'Monthly scrapbook' }[t]}</button>)}</div>
      {tab === 'timeline' && (entries.length ? entries.map(c => (
        <div key={c.id} className="entry">
          <div className="date"><b>{new Date(c.at).getDate()}</b>{fmt(c.at, { month: 'short' })}</div>
          <div>
            <div className="chips">{c.emotions.map(e => <span key={e.id} className="chip" style={{ ['--c' as string]: EMO[e.id].color }}><i />{EMO[e.id].label}</span>)}</div>
            {c.photo && <img src={c.photo} alt="" style={{ maxWidth: 200, borderRadius: 4, border: '6px solid #fff', boxShadow: '0 3px 10px rgba(0,0,0,.2)', transform: 'rotate(-1.5deg)', margin: '4px 0' }} />}
            {c.feeling && <p style={{ margin: '4px 0', fontFamily: 'var(--hand)', fontSize: 21 }}>{c.feeling}</p>}
            {c.cause && <p className="hint" style={{ margin: '2px 0' }}>Contributing: {c.cause}</p>}
            {c.need && <p className="hint" style={{ margin: '2px 0' }}>Needing: {c.need}</p>}
            <div className="hint" style={{ fontStyle: 'italic' }}>{c.weather} in the garden · {c.plantIds.length} seed{c.plantIds.length === 1 ? '' : 's'} planted</div>
          </div>
        </div>
      )) : <p className="lede">Nothing here yet, and that is perfectly fine.</p>)}
      {tab === 'history' && <HistoryView state={state} />}
      {tab === 'scrap' && <Scrapbook state={state} />}
      {tab === 'calendar' && (
        <div>
          <div className="row spread" style={{ marginBottom: 10 }}>
            <button className="btn ghost" onClick={() => setRef(new Date(ref.getFullYear(), ref.getMonth() - 1, 1))}>‹</button>
            <h3>{ref.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3>
            <button className="btn ghost" onClick={() => setRef(new Date(ref.getFullYear(), ref.getMonth() + 1, 1))}>›</button>
          </div>
          <div className="cal">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={i} className="dow">{d}</div>)}
            {Array.from({ length: offset }, (_, i) => <div key={'o' + i} />)}
            {Array.from({ length: days }, (_, i) => {
              const d = i + 1
              const todays = state.checkins.filter(c => { const x = new Date(c.at); return x.getFullYear() === ref.getFullYear() && x.getMonth() === ref.getMonth() && x.getDate() === d })
              const set = [...new Set(todays.flatMap(c => c.emotions.map(e => e.id)))]
              return <div key={d} className="day"><span>{d}</span>{set.slice(0, 4).map(id => <i key={id} style={{ ['--c' as string]: EMO[id].color }} />)}</div>
            })}
          </div>
        </div>
      )}
    </Sheet>
  )
}

/* ---------------- memories ---------------- */
const KINDS: { k: Memory['kind']; l: string; d: string }[] = [
  { k: 'blossom', l: 'Blossom', d: 'a happy moment' }, { k: 'leaf', l: 'Leaf', d: 'something meaningful' },
  { k: 'ornament', l: 'Ornament', d: 'a milestone' }, { k: 'fruit', l: 'Glowing fruit', d: 'an important date' },
]
export function MemorySheet({ state, onClose, onAdd, onOpen }: { state: State; onClose: () => void; onAdd: (m: Memory) => void; onOpen: (id: string) => void }) {
  const [title, setTitle] = useState(''); const [text, setText] = useState(''); const [kind, setKind] = useState<Memory['kind']>('blossom'); const [priv, setPriv] = useState(true)
  const add = () => {
    const a = Math.random() * Math.PI * 2, r = .25 + Math.random() * .75
    onAdd({ id: uid(), at: Date.now(), title: title || 'A small moment', text, kind, private: priv, x: Math.cos(a) * r, y: Math.sin(a) * r * .8 })
    setTitle(''); setText('')
  }
  return (
    <Sheet onClose={onClose} label="Memory tree">
      <div className="eyebrow">The Memory Tree</div>
      <h2>Hang a memory</h2>
      <p className="lede">Happy days, hard days, people, places. Each one becomes something small on the tree, and stays as long as you want it to.</p>
      <div className="row" style={{ marginBottom: 10 }}>{KINDS.map(k => <button key={k.k} className={`tab ${kind === k.k ? 'on' : ''}`} onClick={() => setKind(k.k)} title={k.d}>{k.l}</button>)}</div>
      <input className="field" placeholder="A title for this memory" value={title} onChange={e => setTitle(e.target.value)} style={{ marginBottom: 8 }} />
      <textarea className="field hand" rows={3} placeholder="What happened? What do you want to remember?" value={text} onChange={e => setText(e.target.value)} />
      <div className="row spread" style={{ marginTop: 12 }}>
        <div className="switch" style={{ gap: 10 }}><span>Private to me</span><button className={priv ? 'on' : ''} onClick={() => setPriv(!priv)} aria-pressed={priv} /></div>
        <button className="btn" onClick={add}>Hang it on the tree</button>
      </div>
      {state.memories.length > 0 && <>
        <h3 style={{ marginTop: 24 }}>On the tree</h3>
        {[...state.memories].reverse().map(m => (
          <button key={m.id} className="zone" style={{ gridTemplateColumns: '1fr auto' }} onClick={() => onOpen(m.id)}>
            <span><b style={{ fontFamily: 'var(--serif)', fontWeight: 500 }}>{m.title}</b><span className="hint" style={{ display: 'block' }}>{fmt(m.at)} · {KINDS.find(k => k.k === m.kind)?.l}{m.private ? ' · private' : ''}</span></span>
            <span className="hint">open</span>
          </button>
        ))}
      </>}
    </Sheet>
  )
}
export function MemoryView({ m, onClose, onDelete, onSave }: { m: Memory; onClose: () => void; onDelete: () => void; onSave: (m: Memory) => void }) {
  const [edit, setEdit] = useState(false); const [t, setT] = useState(m.title); const [x, setX] = useState(m.text)
  return (
    <Sheet onClose={onClose} narrow label="Memory">
      <div className="eyebrow">{fmt(m.at, { day: 'numeric', month: 'long', year: 'numeric' })}{m.private ? ' · private' : ''}</div>
      {edit ? <>
        <input className="field" value={t} onChange={e => setT(e.target.value)} style={{ marginBottom: 8 }} />
        <textarea className="field hand" rows={5} value={x} onChange={e => setX(e.target.value)} />
        <div className="row" style={{ marginTop: 12 }}><button className="btn" onClick={() => { onSave({ ...m, title: t, text: x }); setEdit(false) }}>Save</button><button className="btn ghost" onClick={() => setEdit(false)}>Cancel</button></div>
      </> : <>
        <h2>{m.title}</h2>
        <div className="letter" style={{ marginTop: 14 }}>{m.text || 'No words. Just the moment, kept.'}</div>
        <div className="row" style={{ marginTop: 16 }}><button className="btn ghost" onClick={() => setEdit(true)}>Edit</button><button className="btn ghost" onClick={onDelete}>Let it fall from the tree</button></div>
      </>}
    </Sheet>
  )
}

/* ---------------- mailbox ---------------- */
export function MailSheet({ letters, onClose, onAdd, onOpen }: { letters: Letter[]; onClose: () => void; onAdd: (l: Letter) => void; onOpen: (id: string) => void }) {
  const [kind, setKind] = useState<Letter['kind']>('future'); const [text, setText] = useState(''); const [when, setWhen] = useState(30)
  const [read, setRead] = useState<string | null>(null)
  const cur = letters.find(l => l.id === read)
  const now = Date.now()
  if (cur) return (
    <Sheet onClose={() => setRead(null)} narrow label="Letter">
      <div className="eyebrow">{cur.from ? `From ${cur.from}` : `Written ${fmt(cur.at)}`}</div>
      <div className="letter" style={{ marginTop: 10 }}>{cur.text}</div>
      <div className="row" style={{ marginTop: 16 }}><button className="btn ghost" onClick={() => setRead(null)}>Back to the mailbox</button></div>
    </Sheet>
  )
  return (
    <Sheet onClose={onClose} label="Garden letters">
      <div className="eyebrow">The Mailbox</div>
      <h2>Garden letters</h2>
      <p className="lede">Write something, seal it, and choose when it may be opened again. Or write one you never intend to send.</p>
      <div className="tabs">{([['future', 'To my future self'], ['past', 'To my past self'], ['unsent', 'Unsent'], ['note', 'A note to remember']] as const).map(([k, l]) => <button key={k} className={`tab ${kind === k ? 'on' : ''}`} onClick={() => setKind(k)}>{l}</button>)}</div>
      <textarea className="field hand" rows={4} value={text} onChange={e => setText(e.target.value)} placeholder="Dear…" />
      <div className="row spread" style={{ marginTop: 12 }}>
        <span className="row hint">Reopen in <select className="field" style={{ width: 'auto', padding: '6px 10px' }} value={when} onChange={e => setWhen(+e.target.value)}>
          <option value={0}>right away</option><option value={7}>a week</option><option value={30}>a month</option><option value={90}>three months</option><option value={365}>a year</option></select></span>
        <button className="btn" disabled={!text.trim()} onClick={() => { onAdd({ id: uid(), at: now, kind, text, openOn: now + when * DAY, opened: false }); setText('') }}>Seal &amp; post</button>
      </div>
      <h3 style={{ marginTop: 24 }}>In the mailbox</h3>
      {letters.map(l => {
        const ready = l.openOn <= now
        return (
          <button key={l.id} className="zone" disabled={!ready} style={{ gridTemplateColumns: '1fr auto' }} onClick={() => { onOpen(l.id); setRead(l.id) }}>
            <span><b style={{ fontFamily: 'var(--serif)', fontWeight: 500 }}>{l.from ? `A letter from ${l.from}` : { future: 'To my future self', past: 'To my past self', unsent: 'An unsent letter', note: 'A note' }[l.kind]}</b>
              <span className="hint" style={{ display: 'block' }}>{ready ? (l.opened ? 'opened' : 'waiting to be read') : `sealed until ${fmt(l.openOn, { day: 'numeric', month: 'long', year: 'numeric' })}`}</span></span>
            <span className="hint">{ready ? 'read' : 'sealed'}</span>
          </button>
        )
      })}
    </Sheet>
  )
}

/* ---------------- bench ---------------- */
export function BenchSheet({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(() => Math.floor(Math.random() * PROMPTS.length))
  return (
    <Sheet onClose={onClose} narrow label="The bench">
      <div style={{ textAlign: 'center' }}>
        <div className="eyebrow">A pause on the bench</div>
        <h2>Sit for a while</h2>
        <p className="lede">There is nothing to do here. If a thought wants company, here is one:</p>
        <div className="letter" style={{ transform: 'rotate(.6deg)' }}>{PROMPTS[i]}</div>
        <div className="row" style={{ justifyContent: 'center', marginTop: 18 }}>
          <button className="btn ghost" onClick={() => setI((i + 1) % PROMPTS.length)}>Another thought</button>
          <button className="btn" onClick={onClose}>Just sit</button>
        </div>
      </div>
    </Sheet>
  )
}

/* ---------------- explore ---------------- */
export function ExploreSheet({ onClose, go, unlocked }: { onClose: () => void; go: (z: string) => void; unlocked: boolean }) {
  const groups: { h: string; z: { id: string; n: string; d: string; bg: string; locked?: boolean }[] }[] = [
    { h: 'Places', z: [
      { id: 'pond', n: 'The Pond', d: 'Breathe, and watch the ripples.', bg: '#CFE2E6' },
      { id: 'greenhouse', n: 'The Greenhouse', d: 'Plants, visitors and discoveries.', bg: '#E4EFDD' },
      { id: 'tree', n: 'The Memory Tree', d: 'Hang a moment from its branches.', bg: '#F3DCD5' },
      { id: 'moon', n: 'The Moon Garden', d: 'Night-blooming flowers and fireflies.', bg: '#D5D3EA' },
      { id: 'secret', n: 'The Secret Corner', d: unlocked ? 'Behind the ivy, a few small things.' : 'Wander a little longer, and it may appear.', bg: '#EADFC5', locked: !unlocked },
    ] },
    { h: 'Gentle things to do', z: [
      { id: 'water', n: 'Water the garden', d: 'Take the watering can around.', bg: '#D4E4EA' },
      { id: 'seed', n: 'Plant a seed', d: 'Choose one, and pick its spot.', bg: '#E3EBCF' },
      { id: 'decor', n: 'Decorate', d: 'Lanterns, pots, paths and paper.', bg: '#F1E3C9' },
      { id: 'arrange', n: 'Arrange flowers', d: 'A bouquet, with no wrong answers.', bg: '#F3DCD5' },
      { id: 'drift', n: 'Petal drift', d: 'Guide the petals with your hand.', bg: '#EBDDEB' },
      { id: 'draw', n: 'Sketchbook', d: 'Draw something, or nothing.', bg: '#E8E4D0' },
    ] },
  ]
  return (
    <Sheet onClose={onClose} narrow label="Explore">
      <div className="eyebrow">Explore</div><h2>Wander somewhere</h2>
      <p className="lede">Nothing here is locked behind effort. Places open as you spend time. Small things also turn up on the ground each day; look for them in the garden.</p>
      {groups.map(g => <div key={g.h}><h3 style={{ margin: '14px 0 8px' }}>{g.h}</h3>{g.z.map(a => (
        <button key={a.id} className="zone" disabled={a.locked} onClick={() => go(a.id)}>
          <span className="ico" style={{ ['--bg' as string]: a.bg }}><svg viewBox="0 0 32 32" fill="none" stroke="#5E7D4F" strokeWidth="1.8" strokeLinecap="round"><path d="M16 28V14M16 20c-6 0-8-5-8-9 6 0 8 4 8 9ZM16 16c0-4 2-7 8-7 0 4-3 7-8 7Z" /></svg></span>
          <span><b style={{ fontFamily: 'var(--serif)', fontWeight: 500, fontSize: 17 }}>{a.n}</b><span className="hint" style={{ display: 'block' }}>{a.d}</span></span>
          <span className="hint">{a.locked ? '·' : '→'}</span>
        </button>))}</div>)}
    </Sheet>
  )
}

/* ---------------- pond breathing ---------------- */
export function PondBreathing({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'in' | 'hold' | 'out'>('idle'); const [rounds, setRounds] = useState(0)
  useEffect(() => {
    if (phase === 'idle') return
    const d = { in: 4000, hold: 2000, out: 6000 }[phase]
    const t = setTimeout(() => { if (phase === 'in') setPhase('hold'); else if (phase === 'hold') setPhase('out'); else { setRounds(r => r + 1); setPhase('in') } }, d)
    return () => clearTimeout(t)
  }, [phase])
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [onClose])
  const scale = phase === 'in' || phase === 'hold' ? 1.35 : .8
  return (
    <motion.div className="pondbg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .8 }}>
      {[0, 1, 2, 3].map(i => <motion.div key={i} className="ring" style={{ width: 240 + i * 120, height: 240 + i * 120 }} animate={{ scale: phase === 'idle' ? 1 : scale, opacity: .5 - i * .1 }} transition={{ duration: phase === 'in' ? 4 : phase === 'out' ? 6 : .5, ease: 'easeInOut', delay: i * .12 }} />)}
      <div className="breath">
        <motion.div className="orb" animate={{ scale: phase === 'idle' ? 1 : scale }} transition={{ duration: phase === 'in' ? 4 : phase === 'out' ? 6 : .5, ease: 'easeInOut' }} />
        <div className="word">{{ idle: 'Rest here', in: 'Breathe in…', hold: 'Hold softly', out: 'Let it go…' }[phase]}</div>
      </div>
      <div style={{ position: 'absolute', bottom: 60, textAlign: 'center' }}>
        {phase === 'idle' ? <button className="btn" onClick={() => setPhase('in')}>Begin</button> : <div className="hint" style={{ color: '#d6e6e6' }}>{rounds} slow breath{rounds === 1 ? '' : 's'}</div>}
        <div><button className="btn ghost" style={{ color: '#eaf3ef', borderColor: 'rgba(255,255,255,.4)', marginTop: 14 }} onClick={onClose}>Leave the pond</button></div>
      </div>
    </motion.div>
  )
}
