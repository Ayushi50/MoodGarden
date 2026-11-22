import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Scene } from './garden/Cottage'
import { params, phaseName, fmtH } from './garden/cottageArt'
import { COMPANIONS, DISCOVERIES, EMO, EmotionId } from './data/emotions'
import { CheckIn, Memory, Season, State, TimeOfDay, Weather, HOURS, pickSpot, realSeason, realHour, uid, useGarden } from './store'
import { BenchSheet, CheckInSheet, CollectionSheet, ExploreSheet, JournalSheet, MailSheet, MemorySheet, MemoryView, PlantSheet, PondBreathing } from './components/Panels'
import { chime, setSound } from './sound'
import { setAmbient } from './ambient'
import { ArrangeSheet, DecorSheet, DrawSheet, PetalDrift, SecretSheet } from './components/Extras'
import { SeedSheet } from './components/SeedSheet'
import { GuideSheet } from './components/Guide'
import { GardensSheet } from './components/Gardens'
import { DECOR } from './garden/Decor'
import { inPond, nearPath } from './store'

type Panel = null | 'checkin' | 'journal' | 'memories' | 'collection' | 'explore' | 'pond' | 'bench' | 'mailbox' | 'guide' | 'gardens' | 'decor' | 'arrange' | 'drift' | 'draw' | 'secret' | 'seed' | { plant: string } | { memory: string }

const I = {
  garden: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 27V15M16 20c-6 0-9-4-9-9 6 0 9 3 9 9ZM16 15c0-5 3-8 9-8 0 5-4 8-9 8ZM8 27h16" /></svg>,
  journal: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 6h15a3 3 0 0 1 3 3v17H10a3 3 0 0 1-3-3V6ZM7 23a3 3 0 0 1 3-3h15M14 11c3 0 5 1 5 4-3 0-5-1-5-4Z" /></svg>,
  memories: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 28V17M16 20l-5-4M16 18l5-5" /><circle cx="16" cy="11" r="7" /><circle cx="12" cy="9" r="1.2" /><circle cx="19" cy="12" r="1.2" /></svg>,
  collection: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 17h14l-2 10H11L9 17ZM8 17h16M16 17v-4M16 13c-4 0-6-3-6-6 4 0 6 2 6 6ZM16 13c0-3 2-6 6-6 0 3-2 6-6 6Z" /></svg>,
  explore: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="16" cy="16" r="10" /><path d="m20.5 11.5-3 6-6 3 3-6 6-3Z" /></svg>,
  seed: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 26V15M16 20c-5 0-7-3-7-7 5 0 7 3 7 7ZM16 16c0-4 2-6 7-6 0 4-3 6-7 6Z" /><circle cx="26" cy="5" r="1" fill="currentColor" /><circle cx="6" cy="6" r="1" fill="currentColor" /></svg>,
  sun: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></svg>,
}

const WEATHERS: [Weather, string][] = [['sunshine', 'Sunshine'], ['clouds', 'Clouds'], ['rain', 'Light rain'], ['mist', 'Mist'], ['wind', 'Wind'], ['snow', 'Snowfall'], ['rainbow', 'Rainbow']]
const SEASONS: (Season | 'auto')[] = ['auto', 'spring', 'summer', 'autumn', 'winter']
const TIMES: (TimeOfDay | 'auto')[] = ['auto', 'dawn', 'morning', 'day', 'golden', 'dusk', 'night']
const TIME_LABEL: Record<string, string> = { auto: 'By your clock', dawn: 'Dawn', morning: 'Morning', day: 'Midday', golden: 'Golden hour', dusk: 'Dusk', night: 'Night' }

export default function App() {
  const { state, update, profiles, activeId, switchTo, create, rename, remove, exportGarden, importGarden, cloud } = useGarden()
  const gardenName = profiles.find(p => p.id === activeId)?.name || 'My garden'
  const [panel, setPanel] = useState<Panel>(null)
  const [menu, setMenu] = useState(false)
  const [hover, setHover] = useState<string | null>(null)
  const [toast, setToast] = useState<{ title: string; text: string } | null>(null)
  const [recent, setRecent] = useState<string[]>([])
  const [waterMode, setWaterMode] = useState(false)
  const [watering, setWatering] = useState<{ x: number; y: number; k: number } | null>(null)
  const [greet, setGreet] = useState(true)
  const [placing, setPlacing] = useState<null | { kind: 'decor' | 'seed'; v: string }>(null)
  const [now, setNow] = useState(() => new Date())
  const stageRef = useRef<HTMLDivElement>(null)
  const [portrait, setPortrait] = useState(() => matchMedia('(max-aspect-ratio: 1/1)').matches)
  useEffect(() => { const m = matchMedia('(max-aspect-ratio: 1/1)'); const f = () => setPortrait(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f) }, [])
  const toastT = useRef<number>()

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t) }, [])
  useEffect(() => { setSound(state.prefs.sound) }, [state.prefs.sound])
  useEffect(() => { const t = setTimeout(() => setGreet(false), 7000); return () => clearTimeout(t) }, [])
  useEffect(() => { if (state.prefs.guideSeen) return; const t = setTimeout(() => setPanel(p => p ?? 'guide'), 1400); return () => clearTimeout(t) }, [])
  useEffect(() => { // centre the scene horizontally on load
    const el = stageRef.current; if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
  }, [])

  const hour = state.prefs.time === 'auto' ? realHour(now) : HOURS[state.prefs.time]
  const phase = phaseName(hour)
  const ambientVol = state.prefs.ambient ?? .5
  const season: Season = state.prefs.season === 'auto' ? realSeason(now) : state.prefs.season
  const weather = state.prefs.weather
  const calm = state.prefs.calm
  const night = params(hour).l > .5
  const lightLevel = params(hour).l
  useEffect(() => { setAmbient({ on: state.prefs.sound, volume: ambientVol, daylight: 1 - lightLevel, weather: state.prefs.weather, season }) }, [state.prefs.sound, ambientVol, Math.round(lightLevel * 10), state.prefs.weather, season])

  const say = useCallback((title: string, text: string, ms = 5200) => {
    setToast({ title, text }); window.clearTimeout(toastT.current); toastT.current = window.setTimeout(() => setToast(null), ms)
  }, [])
  const setPref = (p: Partial<State['prefs']>) => update(s => ({ ...s, prefs: { ...s.prefs, ...p } }))

  const greeting = useMemo(() => {
    const p = phaseName(realHour(new Date()))
    const line = { Dawn: 'Good morning. The garden is just waking up, and so are you.', Morning: 'Good morning. The garden is bright and glad you came.', Midday: 'Good afternoon. Nothing wilted while you were away.', 'Golden hour': 'Good evening. The light is turning golden, and the lamps are about to come on.', Dusk: 'Good evening. The lanterns are lit, and the fireflies are coming out.', Night: 'The garden is quiet tonight. Take whatever time you need.' }[p]
    return line
  }, [])

  /* ---- actions ---- */
  const water = (id: string, at?: { x: number; y: number }) => {
    const p = state.plants.find(x => x.id === id); if (!p) return
    update(s => ({ ...s, plants: s.plants.map(x => x.id === id ? { ...x, growth: x.growth + .45, waters: x.waters + 1 } : x) }))
    setWatering({ x: at?.x ?? p.x, y: at?.y ?? p.y, k: Date.now() }); chime(2)
    setTimeout(() => setWatering(null), 2600)
  }
  const onPlant = (id: string) => {
    const p = state.plants.find(x => x.id === id); if (!p) return
    if (waterMode) { water(id); return }
    chime(Math.floor(Math.random() * 5)); setPanel({ plant: id })
  }
  const find = (id: string) => {
    const d = DISCOVERIES.find(x => x.id === id)!
    if (state.found.includes(id)) { say(d.name, 'You already tucked this one away. It still feels warm.'); return }
    update(s => ({ ...s, found: [...s.found, id] })); chime(4); say('A small discovery', `${d.name}. ${d.text}`, 7000)
  }
  const companion = (id: string) => {
    const c = COMPANIONS.find(x => x.id === id)!
    chime(3)
    if (!state.companions.includes(id)) { update(s => ({ ...s, companions: [...s.companions, id] })); say('A visitor', `${c.name}. ${c.text}`, 6500) }
    else if (id === 'butterfly' && Math.random() < .3 && !state.found.includes('silver-seed')) find('silver-seed')
  }

  const finishCheckIn = (sel: { id: EmotionId; level: 1 | 2 | 3 }[], words: { feeling?: string; cause?: string; need?: string }) => {
    const planted: Plant_[] = []
    update(s => {
      const plants = [...s.plants]
      sel.forEach(e => {
        const spot = pickSpot(plants, Math.random() * 1e6, e.id === 'loneliness' ? 110 : 54, e.id === 'loneliness' ? 560 : 740, e.id === 'loneliness' ? 420 : 400)
        const np = { id: uid(), emotion: e.id, ...spot, plantedAt: Date.now(), growth: .3 + e.level * .35, waters: 0 }
        plants.push(np); planted.push(np)
      })
      // same-emotion plants already growing get a little nurture, never a penalty
      const bumped = plants.map(p => sel.some(e => e.id === p.emotion) && !planted.includes(p) ? { ...p, growth: p.growth + .3 } : p)
      const ci: CheckIn = { id: uid(), at: Date.now(), emotions: sel, ...words, weather, plantIds: planted.map(p => p.id) }
      return { ...s, plants: bumped, checkins: [...s.checkins, ci] }
    })
    if ((state.checkins.length + 1) % 2 === 0) update(s => grant(s, true))
    setPanel(null); setRecent(planted.map(p => p.id)); setTimeout(() => setRecent([]), 9000)
    sel.forEach((_, i) => setTimeout(() => chime(i * 2), i * 220))
    const first = EMO[sel[0].id]
    say('Planted', sel.length > 1 ? `${sel.length} seeds have settled into the meadow, side by side. All of it belongs here.` : `A seed of ${first.label.toLowerCase()} has settled into the meadow.`, 6500)
    if (sel.some(e => ['sadness', 'anxiety', 'anger', 'loneliness'].includes(e.id))) update(s => ({ ...s, prefs: { ...s.prefs, weather: s.prefs.weather === 'sunshine' ? 'rain' : s.prefs.weather } }))
  }

  const openLetter = (id: string) => update(s => ({ ...s, letters: s.letters.map(l => l.id === id ? { ...l, opened: true } : l) }))
  const mailUnread = state.letters.some(l => !l.opened && l.openOn <= Date.now())
  const secretUnlocked = state.checkins.length >= 2 || state.found.length + state.companions.length >= 3

  const today = now.toISOString().slice(0, 10)
  const finds = useMemo(() => {
    let sd = Number(today.replace(/-/g, '')) % 2147483647 || 7
    const r = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646 }
    return Array.from({ length: 4 }, (_, i) => {
      for (let k = 0; k < 40; k++) { const x = 60 + r() * 1080, y = 400 + r() * 340; if (!inPond(x, y) && !nearPath(x, y)) return { id: `t:${today}:${i}`, x, y } }
      return { id: `t:${today}:${i}`, x: 100, y: 840 }
    })
  }, [today]).filter(f => !state.leaves[f.id])
  const grant = (s: State, note: boolean): State => {
    const kind = DECOR[Math.floor(Math.random() * DECOR.length)]
    if (note) setTimeout(() => say('Something new', `${kind.name} has appeared in the shed. ${kind.text}`, 6500), 1800)
    return { ...s, owned: { ...s.owned, [kind.kind]: (s.owned[kind.kind] || 0) + 1 } }
  }
  const gather = (id: string) => {
    chime(Math.floor(Math.random() * 6))
    update(s => {
      const total = Object.entries(s.leaves).filter(([k]) => !k.startsWith('t:')).reduce((a, [, v]) => a + v, 0) + 1
      let n: State = { ...s, leaves: { ...s.leaves, [id]: 1, [season]: (s.leaves[season] || 0) + 1 } }
      if (total % 5 === 0) n = grant(n, true)
      return n
    })
  }
  const onPlace = (x: number, y: number) => {
    if (!placing) return
    if (y < 330 || y > 745 || inPond(x, y)) { say('Not quite there', 'Try a spot on the grass.', 2200); return }
    if (placing.kind === 'decor') {
      update(s => ({ ...s, decor: [...s.decor, { id: uid(), kind: placing.v, x, y }] })); chime(1)
      const left = (state.owned[placing.v] || 0) - state.decor.filter(d => d.kind === placing.v).length - 1
      if (left <= 0) setPlacing(null)
    } else {
      if (nearPath(x, y)) { say('Not on the path', 'Seeds like soil better than stones.', 2200); return }
      const np = { id: uid(), emotion: placing.v as EmotionId, x, y, plantedAt: Date.now(), growth: .4, waters: 0 }
      update(s => ({ ...s, plants: [...s.plants, np] })); setRecent([np.id]); setTimeout(() => setRecent([]), 6000); chime(2); setPlacing(null)
      say('Planted', `A ${EMO[np.emotion].species.toLowerCase()} seed, right where you wanted it.`, 4000)
    }
  }
  const go = (z: string) => {
    setPanel(null)
    if (z === 'pond') setTimeout(() => setPanel('pond'), 50)
    else if (z === 'greenhouse') setTimeout(() => setPanel('collection'), 50)
    else if (z === 'tree') setTimeout(() => setPanel('memories'), 50)
    else if (z === 'moon') { setPref({ time: 'night' }); say('The Moon Garden', 'Night-blooming flowers wake, and the fireflies come out. It stays this way until you change the hour.') }
    else if (z === 'water') { setWaterMode(true) }
    else if (z === 'secret') setTimeout(() => setPanel('secret'), 50)
    else if (['decor', 'arrange', 'drift', 'draw', 'seed'].includes(z)) setTimeout(() => setPanel(z as Panel), 50)
  }

  const nav = (k: Panel) => setPanel(panel === k ? null : k)
  const curPlant = panel && typeof panel === 'object' && 'plant' in panel ? state.plants.find(p => p.id === panel.plant) : null
  const curMem = panel && typeof panel === 'object' && 'memory' in panel ? state.memories.find(m => m.id === panel.memory) : null

  return (
    <div className={`season-${season} ${night ? 'night-ui' : ''} ${calm ? 'calm-ui' : ''}`}>
      <div className={`stage ${portrait ? 'portrait' : ''}`} ref={stageRef} onClick={() => { setMenu(false) }} style={portrait ? { background: params(hour).g[0] } : undefined}>
        <Scene portrait={portrait} hour={hour} onGate={() => setPanel('explore')} decor={state.decor} placing={!!placing} onPlace={onPlace} finds={finds} onGather={gather} pathStyle={state.prefs.path}
          onDecor={id => { if (placing) return; update(s => ({ ...s, decor: s.decor.filter(d => d.id !== id) })); chime(1); say('Picked up', 'Back in the shed, ready for somewhere else.', 2200) }}
          plants={state.plants} memories={state.memories} season={season} weather={weather} calm={calm}
          mailUnread={mailUnread} waterMode={waterMode} recent={recent} watering={watering}
          onPlant={onPlant} onPond={() => setPanel('pond')} onBench={() => setPanel('bench')} onMailbox={() => setPanel('mailbox')}
          onGreenhouse={() => setPanel('collection')} onHouse={() => setPanel('journal')} onTree={() => setPanel('memories')}
          onMemory={id => setPanel({ memory: id })} onHover={setHover} onFind={find} onCompanion={companion}
          onCan={() => { setWaterMode(m => !m); say('Watering can', waterMode ? 'Put away for now.' : 'Tap any plant to water it. It will grow a little, in its own time.') }} />
      </div>
      <div className="grain" /><div className="vignette" />

      <div className="hud">
        <div className="brand">
          <div className="name" title={gardenName}>
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 27V14M16 20c-6 0-8-4-8-8 6 0 8 3 8 8ZM16 15c0-5 3-8 8-8 0 5-3 8-8 8Z" /></svg>
            Mood Garden
          </div>
          <div className="sub">{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })} · {season} · {fmtH(hour)}</div>
        </div>

        <div className="topright" onClick={e => e.stopPropagation()}>
          <button className="pill help" onClick={() => setPanel('guide')} aria-label="How to play" title="How to play">?</button>
          <div style={{ position: 'relative' }}>
            <button className="pill" onClick={() => setMenu(!menu)} aria-expanded={menu}>{I.sun}<span>Atmosphere</span></button>
            <AnimatePresence>{menu && (
              <motion.div className="pop-menu" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="group"><div className="cap">Garden</div><button className="opt on" style={{ width: '100%', textAlign: 'left', borderRadius: 14, padding: '8px 12px', marginBottom: 0 }} onClick={() => { setMenu(false); setPanel('gardens') }}>{gardenName} · switch or back up</button></div>
                <div className="group"><div className="cap">Weather</div>{WEATHERS.map(([k, l]) => <button key={k} className={`opt ${weather === k ? 'on' : ''}`} onClick={() => setPref({ weather: k })}>{l}</button>)}</div>
                <div className="group"><div className="cap">Season</div>{SEASONS.map(k => <button key={k} className={`opt ${state.prefs.season === k ? 'on' : ''}`} onClick={() => setPref({ season: k })}>{k === 'auto' ? 'By the calendar' : k[0].toUpperCase() + k.slice(1)}</button>)}</div>
                <div className="group"><div className="cap">Hour</div>{TIMES.map(k => <button key={k} className={`opt ${state.prefs.time === k ? 'on' : ''}`} onClick={() => setPref({ time: k })}>{TIME_LABEL[k]}</button>)}</div>
                <div className="group">
                  <div className="switch"><span>Sound and ambient (off until you ask)</span><button className={state.prefs.sound ? 'on' : ''} aria-pressed={state.prefs.sound} onClick={() => { setPref({ sound: !state.prefs.sound }); setTimeout(() => chime(2), 50) }} /></div>
                  {state.prefs.sound && <div className="switch vol"><span>Ambient volume</span><input type="range" min="0" max="100" value={Math.round(ambientVol * 100)} onChange={e => setPref({ ambient: +e.target.value / 100 })} aria-label="Ambient volume" /></div>}
                  <div className="switch"><span>Reduce motion</span><button className={calm ? 'on' : ''} aria-pressed={calm} onClick={() => setPref({ calm: !calm })} /></div>
                </div>
              </motion.div>
            )}</AnimatePresence>
          </div>
        </div>

        <AnimatePresence>{greet && !toast && !panel && <motion.div className="greeting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.6 }}>{greeting}</motion.div>}</AnimatePresence>
        <AnimatePresence>{toast && <motion.div className="toast" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} onClick={() => setToast(null)}><b>{toast.title}</b>{toast.text}</motion.div>}</AnimatePresence>
        {placing && <div className="modebar pill" style={{ height: 'auto' }}>Tap the garden to place it <button onClick={() => setPlacing(null)}>Cancel</button></div>}
        {waterMode && <div className="modebar pill" style={{ height: 'auto' }}>Tap a plant to water it <button onClick={() => setWaterMode(false)}>Done</button></div>}
        <AnimatePresence>{hover && !panel && <motion.div className="hover-label" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} key={hover}>{hover}</motion.div>}</AnimatePresence>

        <nav className="dock" aria-label="Garden navigation">
          <DockBtn icon={I.garden} label="Garden" on={!panel} onClick={() => setPanel(null)} />
          <DockBtn icon={I.journal} label="Journal" on={panel === 'journal'} onClick={() => nav('journal')} />
          <div className="feel-wrap">
            <span className="feel-say">How are you feeling?</span>
            <button className="feel" onClick={() => setPanel('checkin')} aria-label="How are you feeling? Check in"><span className="halo" /><span className="halo h2" />
              <svg viewBox="0 0 64 64" aria-hidden><g className="bloom-ico">{[0, 1, 2, 3, 4, 5].map(i => <ellipse key={i} cx="32" cy="17" rx="6.5" ry="11" transform={`rotate(${i * 60} 32 32)`} fill={['#FBE3E8', '#FFF4D2', '#F7D4DC', '#FFF4D2', '#FBE3E8', '#F7D4DC'][i]} stroke="#fff" strokeOpacity=".7" strokeWidth="1" />)}<circle cx="32" cy="32" r="7.5" fill="#F0C65A" /><circle cx="29.5" cy="29.5" r="2.6" fill="#fff" opacity=".7" /></g></svg>
            </button>
          </div>
          <DockBtn icon={I.memories} label="Memories" on={panel === 'memories'} onClick={() => nav('memories')} />
          <DockBtn icon={I.collection} label="Collection" on={panel === 'collection'} onClick={() => nav('collection')} />
          <DockBtn icon={I.explore} label="Explore" on={panel === 'explore'} onClick={() => nav('explore')} />
        </nav>
      </div>

      <AnimatePresence>
        {panel === 'checkin' && <CheckInSheet key="ci" onClose={() => setPanel(null)} onDone={finishCheckIn} hasPrompt />}
        {panel === 'journal' && <JournalSheet key="jn" state={state} onClose={() => setPanel(null)} />}
        {panel === 'collection' && <CollectionSheet key="co" state={state} onClose={() => setPanel(null)} onPlant={id => setPanel({ plant: id })} />}
        {panel === 'explore' && <ExploreSheet key="ex" onClose={() => setPanel(null)} go={go} unlocked={secretUnlocked} />}
        {panel === 'bench' && <BenchSheet key="bn" onClose={() => setPanel(null)} />}
        {panel === 'pond' && <PondBreathing key="pd" onClose={() => setPanel(null)} />}
        {panel === 'mailbox' && <MailSheet key="ml" letters={state.letters} onClose={() => setPanel(null)} onOpen={openLetter} onAdd={l => { update(s => ({ ...s, letters: [...s.letters, l] })); chime(3) }} />}
        {panel === 'memories' && <MemorySheet key="mm" state={state} onClose={() => setPanel(null)} onOpen={id => setPanel({ memory: id })} onAdd={(m: Memory) => { update(s => ({ ...s, memories: [...s.memories, m] })); chime(4); say('Hung on the tree', 'It will stay there, quietly, for as long as you like.') }} />}
        {panel === 'gardens' && <GardensSheet key="gs" profiles={profiles} activeId={activeId} onClose={() => setPanel(null)} onSwitch={id => { switchTo(id); setPanel(null); setWaterMode(false); setPlacing(null); say('Switched', `Now tending “${profiles.find(p => p.id === id)?.name}”.`, 3500) }} onCreate={n => { create(n); setPanel(null); say('A new garden', 'Welcome. This one is just yours.', 4000) }} onRename={rename} onRemove={remove} onExport={exportGarden} cloud={cloud} onImport={t => { const r = importGarden(t); if (r.ok) setTimeout(() => setPanel(null), 900); return r }} />}
        {panel === 'guide' && <GuideSheet key="gd" first={!state.prefs.guideSeen} onClose={() => { setPref({ guideSeen: true }); setPanel(null) }} onTry={go => { setPref({ guideSeen: true }); setPanel(null); setTimeout(() => setPanel(go as Panel), 250) }} />}
        {panel === 'decor' && <DecorSheet key="dc" state={state} onClose={() => setPanel(null)} onPlace={k => { setPanel(null); setPlacing({ kind: 'decor', v: k }) }} onRemove={id => update(s => ({ ...s, decor: s.decor.filter(d => d.id !== id) }))} onPref={setPref} />}
        {panel === 'arrange' && <ArrangeSheet key="ar" state={state} onClose={() => setPanel(null)} onSave={b => update(s => ({ ...s, bouquets: [...s.bouquets, b] }))} />}
        {panel === 'drift' && <PetalDrift key="dr" onClose={() => setPanel(null)} />}
        {panel === 'draw' && <DrawSheet key="dw" count={state.sketches.length} onClose={() => setPanel(null)} onSave={d => update(s => ({ ...s, sketches: [...s.sketches.slice(-5), d] }))} />}
        {panel === 'secret' && <SecretSheet key="sc" state={state} onClose={() => setPanel(null)} onFind={find} />}
        {panel === 'seed' && <SeedSheet key="sd" onClose={() => setPanel(null)} onPick={id => { setPanel(null); setPlacing({ kind: 'seed', v: id }) }} />}
        {curMem && <MemoryView key="mv" m={curMem} onClose={() => setPanel(null)} onSave={m => update(s => ({ ...s, memories: s.memories.map(x => x.id === m.id ? m : x) }))} onDelete={() => { update(s => ({ ...s, memories: s.memories.filter(x => x.id !== curMem.id) })); setPanel(null) }} />}
        {curPlant && <PlantSheet key="pl" plant={curPlant} onClose={() => setPanel(null)} onWater={() => { const p = curPlant; setPanel(null); setTimeout(() => water(p.id), 250) }} />}
      </AnimatePresence>
    </div>
  )
}
type Plant_ = import('./store').Plant

function DockBtn({ icon, label, on, onClick }: { icon: ReactNode; label: string; on: boolean; onClick: () => void }) {
  return <button className={`dock-btn ${on ? 'on' : ''}`} onClick={onClick} aria-label={label}>{icon}<span>{label}</span></button>
}
