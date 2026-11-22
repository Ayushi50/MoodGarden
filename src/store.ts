import { useCallback, useEffect, useRef, useState } from 'react'
import { EmotionId, stageOf } from './data/emotions'
import { fetchGarden, listMeta, pushGarden, pushTombstone, syncEnabled, useAuth } from './sync'

export type Weather = 'sunshine' | 'clouds' | 'rain' | 'mist' | 'wind' | 'snow' | 'rainbow'
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type TimeOfDay = 'dawn' | 'morning' | 'day' | 'golden' | 'dusk' | 'night'
export const HOURS: Record<TimeOfDay, number> = { dawn: 6.3, morning: 8.5, day: 13, golden: 17.3, dusk: 19.3, night: 22 }

export interface Plant {
  id: string; emotion: EmotionId; x: number; y: number
  plantedAt: number; growth: number; waters: number
}
export interface CheckIn {
  id: string; at: number; emotions: { id: EmotionId; level: 1 | 2 | 3 }[]
  feeling?: string; cause?: string; need?: string; weather: Weather; plantIds: string[]; photo?: string
}
export interface Memory {
  id: string; at: number; title: string; text: string
  kind: 'blossom' | 'leaf' | 'ornament' | 'fruit'
  private: boolean; x: number; y: number
}
export interface Letter {
  id: string; at: number; kind: 'future' | 'past' | 'unsent' | 'note'
  text: string; openOn: number; opened: boolean; from?: string
}
export interface Decor { id: string; kind: string; x: number; y: number }
export interface Bouquet { id: string; at: number; stems: { e: EmotionId; x: number; y: number; r: number }[] }
export interface State {
  decor: Decor[]; owned: Record<string, number>; leaves: Record<string, number>; bouquets: Bouquet[]; sketches: string[]; day: string
  plants: Plant[]; checkins: CheckIn[]; memories: Memory[]; letters: Letter[]
  found: string[]; companions: string[]
  prefs: { ambient?: number; guideSeen?: boolean; path: 'stone' | 'moss' | 'dirt'; paper: 'cream' | 'sage' | 'lavender'; weather: Weather; season: Season | 'auto'; time: TimeOfDay | 'auto'; sound: boolean; calm: boolean }
  visits: number
}

const KEY = 'mood-garden/v3'
export const DAY = 86400000
export const uid = () => Math.random().toString(36).slice(2, 10)

/* seeded rng so the starter garden is always the same composition */
function rng(seed: number) {
  let s = seed
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

/* the cottage front garden (scene coordinates 1200x750) */
export const edgeL = (y: number) => 560 - (y - 330) * (220 / 420)
export const edgeR = (y: number) => 640 + (y - 330) * (220 / 420)
export const nearPath = (x: number, y: number) => y > 330 && x > edgeL(y) - 110 && x < edgeR(y) + 50
export const inPond = (x: number, y: number) => ((x - 930) / 150) ** 2 + ((y - 500) / 105) ** 2 < 1
const RECTS: [number, number, number, number][] = [
  [430, 770, 100, 350], [0, 200, 330, 450], [750, 890, 350, 430], [260, 340, 390, 470],
  [960, 1130, 540, 660], [750, 890, 590, 700], [1040, 1200, 430, 550], [370, 450, 610, 670],
  [490, 710, 690, 750], [470, 530, 420, 475], [670, 730, 420, 475], [100, 210, 660, 725], [150, 240, 450, 505],
  [380, 440, 690, 740], [770, 830, 700, 750], [0, 320, 650, 750],
]
export const nearObjects = (x: number, y: number) => RECTS.some(([x0, x1, y0, y1]) => x > x0 && x < x1 && y > y0 && y < y1)
export const plantScale = (y: number) => 0.55 + ((y - 330) / 420) * 0.85

export function pickSpot(plants: { x: number; y: number }[], seed = Math.random() * 1e6, minD = 58, yMax = 740, yMin = 400) {
  const r = rng(Math.floor(seed) + 7)
  for (let i = 0; i < 600; i++) {
    const y = yMin + r() * (yMax - yMin)
    const x = 30 + r() * 1140
    if (inPond(x, y) || nearPath(x, y) || nearObjects(x, y)) continue
    if (plants.some(p => Math.hypot((p.x - x), (p.y - y) * 1.5) < minD)) continue
    return { x, y }
  }
  return { x: 80 + Math.random() * 200, y: 560 + Math.random() * 80 }
}

function starter(): State {
  const now = Date.now()
  const seeds: [EmotionId, number, number][] = [
    ['loneliness', 5.8, 11], ['calm', 5.7, 40], ['joy', 4.2, 23], ['gratitude', 4.4, 17],
    ['hope', 3.9, 52], ['neutral', 5.0, 8], ['excitement', 3.8, 31], ['sadness', 3.7, 64],
    ['anxiety', 3.0, 71], ['tiredness', 3.7, 5], ['joy', 2.5, 90], ['calm', 3.7, 12],
    ['gratitude', 1.4, 88], ['confusion', 3.8, 99], ['anger', 3.7, 3], ['hope', 1.1, 44],
    ['neutral', 2.3, 66], ['excitement', 4.1, 77],
    ['joy', 4.0, 30], ['calm', 4.6, 45], ['gratitude', 3.9, 22], ['sadness', 3.2, 58], ['anger', 4.2, 9], ['hope', 4.4, 36],
    ['neutral', 3.8, 14], ['excitement', 3.5, 28], ['confusion', 2.6, 41], ['joy', 3.7, 52], ['calm', 3.8, 19], ['gratitude', 4.5, 6],
    ['tiredness', 3.9, 20], ['anxiety', 3.8, 33], ['sadness', 4.0, 11], ['hope', 3.7, 25],
  ].slice(0, 26) as [EmotionId, number, number][]
  const plants: Plant[] = []
  seeds.forEach(([emotion, growth, daysAgo], i) => {
    const spot = pickSpot(plants, 100 + i * 37, emotion === 'loneliness' ? 110 : 54, emotion === 'loneliness' ? 560 : 740, emotion === 'loneliness' ? 420 : 400)
    plants.push({ id: 'p' + i, emotion, ...spot, plantedAt: now - daysAgo * DAY, growth: growth - daysAgo * 0.6 > 0 ? growth - daysAgo * 0.6 : growth * 0.6, waters: 0 })
  })
  // growth is stored at planting; recompute so display stage matches intention
  plants.forEach((p, i) => { p.growth = Math.max(0.2, seeds[i][1] - (now - p.plantedAt) / DAY * 0.6) })
  const welcome: Letter = {
    id: 'welcome', at: now, kind: 'note', openOn: now, opened: false, from: 'The Garden',
    text: 'Hello, and welcome.\n\nThere is no streak to keep here, and nothing that can wither while you are away. The garden grows in its own time, and it will make room for whatever you bring: bright days, heavy days, days with no name.\n\nStay as long as you like.',
  }
  return {
    decor: [], owned: { lantern: 1, pot: 2 }, leaves: {}, bouquets: [], sketches: [], day: '',
    plants, checkins: [], memories: [], letters: [welcome], found: [], companions: [],
    prefs: { path: 'stone', paper: 'cream', weather: 'sunshine', season: 'auto', time: 'auto', sound: false, calm: false },
    visits: 0,
  }
}

/* ---------- gardens (local profiles) ----------
   Each garden lives in its own localStorage key on this device. Nothing leaves the device. */
export interface Profile { id: string; name: string; created: number; visited: number; cid?: string }
interface Index { active: string; list: Profile[] }
const IDX = 'mood-garden/profiles'
const LEGACY = 'mood-garden/v3'
const keyFor = (id: string) => `mood-garden/p/${id}`

function readIdx(): Index {
  try {
    const raw = localStorage.getItem(IDX)
    if (raw) { const i = JSON.parse(raw) as Index; if (i.list?.length && i.list.some(p => p.id === i.active)) return i }
  } catch { /* ignore */ }
  /* first run, or an older single-garden install: adopt it as "My garden" */
  const p: Profile = { id: 'default', name: 'My garden', created: Date.now(), visited: Date.now() }
  try { const old = localStorage.getItem(LEGACY); if (old && !localStorage.getItem(keyFor('default'))) localStorage.setItem(keyFor('default'), old) } catch { /* ignore */ }
  return { active: p.id, list: [p] }
}
const writeIdx = (i: Index) => { try { localStorage.setItem(IDX, JSON.stringify(i)) } catch { /* ignore */ } }

function normalise(s: State): State {
  const d = starter()
  return { ...d, ...s, prefs: { ...d.prefs, ...s.prefs } }
}
function load(id: string): State {
  try {
    const raw = localStorage.getItem(keyFor(id))
    if (raw) { const s = JSON.parse(raw) as State; if (s.plants) return { ...normalise(s), visits: (s.visits || 0) + 1 } }
  } catch { /* ignore */ }
  return starter()
}
export function peekGarden(id: string): { plants: number; checkins: number; memories: number } | null {
  try { const raw = localStorage.getItem(keyFor(id)); if (!raw) return { plants: 0, checkins: 0, memories: 0 }; const s = JSON.parse(raw) as State; return { plants: s.plants?.length || 0, checkins: s.checkins?.length || 0, memories: s.memories?.length || 0 } } catch { return null }
}


/* ---------- optional cloud sync ----------
   Local storage stays the source of truth. When signed in, each garden is mirrored to the cloud
   (last write wins per garden, using a per-garden "modified" time). Signed out, none of this runs. */
const mkey = (id: string) => `mood-garden/m/${id}`
const getMod = (id: string) => { try { return Number(localStorage.getItem(mkey(id))) || 0 } catch { return 0 } }
const setMod = (id: string, t: number) => { try { localStorage.setItem(mkey(id), String(t)) } catch { /* ignore */ } }
const TOMBS = 'mood-garden/tombstones'
interface Tomb { cid: string; at: number }
const readTombs = (): Tomb[] => { try { return JSON.parse(localStorage.getItem(TOMBS) || '[]') } catch { return [] } }
const writeTombs = (t: Tomb[]) => { try { localStorage.setItem(TOMBS, JSON.stringify(t)) } catch { /* ignore */ } }
const sig = (s: State) => JSON.stringify({ ...s, visits: 0 })
function readState(id: string): State | null {
  try { const raw = localStorage.getItem(keyFor(id)); if (raw) { const s = JSON.parse(raw) as State; if (s.plants) return normalise(s) } } catch { /* ignore */ }
  return null
}
export type CloudStatus = 'idle' | 'syncing' | 'ok' | 'error'
export interface Cloud {
  enabled: boolean; ready: boolean; email: string | null; status: CloudStatus; at?: number; error?: string
  signIn: (email: string) => Promise<void>; signOut: () => Promise<void>; syncNow: () => void
}

export function useGarden() {
  const auth = useAuth()
  const [idx, setIdx] = useState<Index>(readIdx)
  const [state, setState] = useState<State>(() => load(idx.active))
  const [cloud, setCloud] = useState<{ status: CloudStatus; at?: number; error?: string }>({ status: 'idle' })
  const idxRef = useRef(idx); idxRef.current = idx
  const stateRef = useRef(state); stateRef.current = state
  const sigRef = useRef(sig(state))
  const busy = useRef(false); const again = useRef(false)

  useEffect(() => { writeIdx(idx) }, [idx])
  useEffect(() => {
    try { localStorage.setItem(keyFor(idx.active), JSON.stringify(state)) } catch { /* ignore */ }
    const s = sig(state)
    if (s !== sigRef.current) { sigRef.current = s; setMod(idx.active, Date.now()) } /* a real edit, not just a visit */
  }, [state, idx.active])
  const update = useCallback((fn: (s: State) => State) => setState(fn), [])

  const open = useCallback((id: string) => { const s = load(id); sigRef.current = sig(s); setState(s) }, [])
  const switchTo = useCallback((id: string) => {
    if (id === idx.active) return
    setIdx(i => ({ active: id, list: i.list.map(p => p.id === id ? { ...p, visited: Date.now() } : p) })); open(id)
  }, [idx.active, open])
  const create = useCallback((name: string, data?: State) => {
    const id = uid(); const nm = name.trim() || 'New garden'
    const next: State = data ? { ...normalise(data) } : { ...starter() }
    next.prefs = { ...next.prefs, guideSeen: true }
    try { localStorage.setItem(keyFor(id), JSON.stringify(next)) } catch { /* ignore */ }
    setMod(id, Date.now()); sigRef.current = sig(next)
    setIdx(i => ({ active: id, list: [...i.list, { id, name: nm, created: Date.now(), visited: Date.now() }] })); setState(next)
    return id
  }, [])
  const rename = useCallback((id: string, name: string) => {
    setMod(id, Date.now())
    setIdx(i => ({ ...i, list: i.list.map(p => p.id === id ? { ...p, name: name.trim() || p.name } : p) }))
  }, [])
  const remove = useCallback((id: string) => {
    if (idx.list.length <= 1) return
    const gone = idx.list.find(p => p.id === id)
    if (gone?.cid) writeTombs([...readTombs(), { cid: gone.cid, at: Date.now() }])
    try { localStorage.removeItem(keyFor(id)); localStorage.removeItem(mkey(id)) } catch { /* ignore */ }
    const rest = idx.list.filter(p => p.id !== id)
    if (id === idx.active) { setIdx({ active: rest[0].id, list: rest }); open(rest[0].id) } else setIdx({ ...idx, list: rest })
  }, [idx, open])
  const exportGarden = useCallback(() => {
    const name = idx.list.find(p => p.id === idx.active)?.name || 'garden'
    return { filename: `mood-garden-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'garden'}.json`, text: JSON.stringify({ app: 'mood-garden', version: 3, name, exportedAt: new Date().toISOString(), data: state }) }
  }, [idx, state])
  const importGarden = useCallback((text: string): { ok: boolean; error?: string } => {
    try {
      const j = JSON.parse(text)
      if (j?.app !== 'mood-garden' || !j.data || !Array.isArray(j.data.plants)) return { ok: false, error: 'That file is not a Mood Garden backup.' }
      create(`${j.name || 'Imported garden'} (restored)`, j.data as State); return { ok: true }
    } catch { return { ok: false, error: 'That file could not be read.' } }
  }, [create])
  const reset = useCallback(() => setState(starter()), [])

  const email = auth.email
  const syncAll = useCallback(async () => {
    if (!syncEnabled || !email) return
    if (busy.current) { again.current = true; return }
    busy.current = true; setCloud(c => ({ ...c, status: 'syncing', error: undefined }))
    const patch = new Map<string, Partial<Profile>>()
    const added: Profile[] = []; const gone = new Set<string>()
    let failed: string | undefined
    try {
      const start = idxRef.current
      const meta = await listMeta()
      const byId = new Map(meta.map(m => [m.id, m]))

      /* deletions made here while offline or signed out */
      const keep: Tomb[] = []
      for (const t of readTombs()) {
        const r = byId.get(t.cid)
        if (r && !r.deleted && r.updatedAt > t.at) continue /* edited elsewhere after the delete: let it come back */
        try { await pushTombstone(t.cid, t.at); if (r) { r.deleted = true; r.updatedAt = t.at } } catch { keep.push(t) }
      }
      writeTombs(keep)

      for (const p of start.list) {
        const lm = getMod(p.id)
        let cid = p.cid
        if (!cid) {
          if (lm === 0) continue /* untouched starter garden: nothing worth uploading */
          cid = uid() + uid() + uid(); patch.set(p.id, { cid })
        }
        const r = byId.get(cid)
        if (r?.deleted) {
          if (r.updatedAt >= lm) gone.add(p.id) /* deleted on another device */
          else { const d = p.id === start.active ? stateRef.current : readState(p.id); if (d) await pushGarden(cid, p.name, d, lm) }
        } else if (!r || lm > r.updatedAt) {
          const d = p.id === start.active ? stateRef.current : readState(p.id)
          if (d) await pushGarden(cid, p.name, d, lm || Date.now())
        } else if (r.updatedAt > lm) {
          const g = await fetchGarden(cid)
          if (getMod(p.id) !== lm) continue /* edited while we were fetching: keep the local edit, next pass will reconcile */
          const d = normalise(g.data as State)
          try { localStorage.setItem(keyFor(p.id), JSON.stringify(d)) } catch { /* ignore */ }
          setMod(p.id, r.updatedAt); patch.set(p.id, { ...patch.get(p.id), name: g.name || p.name })
          if (p.id === start.active) { sigRef.current = sig(d); setState({ ...d, visits: stateRef.current.visits }) }
        }
      }

      /* gardens that exist in the cloud but not on this device */
      const known = new Set([...start.list.map(p => patch.get(p.id)?.cid || p.cid)].filter(Boolean))
      for (const r of meta) {
        if (r.deleted || known.has(r.id)) continue
        const g = await fetchGarden(r.id); const d = normalise(g.data as State); const id = uid()
        try { localStorage.setItem(keyFor(id), JSON.stringify(d)) } catch { /* ignore */ }
        setMod(id, r.updatedAt)
        added.push({ id, name: g.name || 'My garden', created: Date.now(), visited: r.updatedAt, cid: r.id })
      }
      setCloud({ status: 'ok', at: Date.now() })
    } catch (e) {
      failed = e instanceof Error ? e.message : 'Could not reach the cloud.'
      setCloud({ status: 'error', error: failed })
    } finally {
      /* apply what we learned to the garden list in one step */
      const cur = idxRef.current
      let list = cur.list.map(p => patch.has(p.id) ? { ...p, ...patch.get(p.id) } : p)
      list = [...list, ...added]
      const synced = list.some(p => p.cid)
      for (const p of list) if (!p.cid && getMod(p.id) === 0 && synced) gone.add(p.id) /* replace an untouched starter once real gardens arrive */
      list = list.filter(p => !gone.has(p.id))
      if (!list.length) { const f: Profile = { id: uid(), name: 'My garden', created: Date.now(), visited: Date.now() }; try { localStorage.setItem(keyFor(f.id), JSON.stringify(starter())) } catch { /* ignore */ } list = [f] }
      for (const id of gone) { try { localStorage.removeItem(keyFor(id)); localStorage.removeItem(mkey(id)) } catch { /* ignore */ } }
      let active = cur.active
      if (!list.some(p => p.id === active)) { active = list[0].id; open(active) }
      if (list.length !== cur.list.length || active !== cur.active || list.some((p, i) => p !== cur.list[i])) setIdx({ active, list })
      busy.current = false
      if (again.current) { again.current = false; setTimeout(() => { void syncAll() }, 1500) }
    }
  }, [email, open])

  /* sync shortly after any change, and whenever the tab comes back or goes away */
  useEffect(() => {
    if (!email) return
    const t = setTimeout(() => { void syncAll() }, 2500)
    return () => clearTimeout(t)
  }, [email, state, idx.list, syncAll])
  useEffect(() => {
    if (!email) return
    const f = () => { void syncAll() }
    document.addEventListener('visibilitychange', f); window.addEventListener('focus', f)
    return () => { document.removeEventListener('visibilitychange', f); window.removeEventListener('focus', f) }
  }, [email, syncAll])

  const cloudApi: Cloud = {
    enabled: syncEnabled, ready: auth.ready, email, status: cloud.status, at: cloud.at, error: cloud.error,
    signIn: auth.signIn, signOut: auth.signOut, syncNow: () => { void syncAll() },
  }
  return { state, update, reset, profiles: idx.list, activeId: idx.active, switchTo, create, rename, remove, exportGarden, importGarden, cloud: cloudApi }
}

export const growthNow = (p: Plant, now = Date.now()) => p.growth + ((now - p.plantedAt) / DAY) * 0.6
export const stageNow = (p: Plant) => stageOf(growthNow(p))

export function realSeason(d = new Date()): Season {
  const m = d.getMonth()
  return m >= 2 && m <= 4 ? 'spring' : m >= 5 && m <= 7 ? 'summer' : m >= 8 && m <= 10 ? 'autumn' : 'winter'
}
export function realHour(d = new Date()) { return d.getHours() + d.getMinutes() / 60 }
