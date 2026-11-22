import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { EMO, EMOTIONS, EmotionId, stageOf } from '../data/emotions'
import { PlantArt, PlantDefs, PlantPreview } from '../garden/PlantArt'
import { DECOR, DecorArt } from '../garden/Decor'
import { Bouquet, DAY, State, uid } from '../store'
import { Sheet } from './Panels'

const fmt = (t: number, o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }) => new Date(t).toLocaleDateString(undefined, o)

/* ---------- decorate ---------- */
export function DecorSheet({ state, onClose, onPlace, onRemove, onPref }: { state: State; onClose: () => void; onPlace: (kind: string) => void; onRemove: (id: string) => void; onPref: (p: Partial<State['prefs']>) => void }) {
  const placed = (k: string) => state.decor.filter(d => d.kind === k).length
  return (
    <Sheet onClose={onClose} label="Decorate">
      <div className="eyebrow">Make it yours</div><h2>Decorate the garden</h2>
      <p className="lede">Choose something, then tap anywhere in the garden to set it down. Tap a placed piece to pick it back up. New pieces turn up now and then, with no grinding.</p>
      <div className="grid2">
        {DECOR.map(d => {
          const have = state.owned[d.kind] || 0; const free = have - placed(d.kind)
          return (
            <div key={d.kind} className={`pcard ${have ? '' : 'locked'}`}>
              <div className="art" style={{ height: 100 }}><svg viewBox="-40 -90 80 100" width="70" height="88"><DecorArt kind={d.kind} night={false} /></svg></div>
              <h3>{have ? d.name : 'Not yet found'}</h3>
              <div className="hint">{have ? `${free} to place · ${placed(d.kind)} out` : 'Turns up in time'}</div>
              <button className="btn" style={{ marginTop: 8, padding: '6px 16px', fontSize: 14 }} disabled={free <= 0} onClick={() => onPlace(d.kind)}>Place</button>
            </div>
          )
        })}
      </div>
      <h3 style={{ marginTop: 22 }}>Pathway</h3>
      <div className="row">{(['stone', 'moss', 'dirt'] as const).map(k => <button key={k} className={`tab ${state.prefs.path === k ? 'on' : ''}`} onClick={() => onPref({ path: k })}>{{ stone: 'Pale stone', moss: 'Mossy', dirt: 'Warm earth' }[k]}</button>)}</div>
      <h3 style={{ marginTop: 16 }}>Journal paper</h3>
      <div className="row">{(['cream', 'sage', 'lavender'] as const).map(k => <button key={k} className={`tab ${state.prefs.paper === k ? 'on' : ''}`} onClick={() => onPref({ paper: k })}>{{ cream: 'Cream', sage: 'Sage', lavender: 'Lavender' }[k]}</button>)}</div>
      {state.decor.length > 0 && <button className="btn ghost" style={{ marginTop: 18 }} onClick={() => state.decor.forEach(d => onRemove(d.id))}>Put everything back in the shed</button>}
    </Sheet>
  )
}

/* ---------- arrange flowers ---------- */
export function ArrangeSheet({ state, onClose, onSave }: { state: State; onClose: () => void; onSave: (b: Bouquet) => void }) {
  const have = [...new Set(state.plants.map(p => p.emotion))] as EmotionId[]
  const [pick, setPick] = useState<EmotionId>(have[0] || 'joy')
  const [stems, setStems] = useState<Bouquet['stems']>([])
  const [saved, setSaved] = useState(false)
  const ref = useRef<SVGSVGElement>(null)
  const add = (e: React.MouseEvent) => {
    const svg = ref.current!; const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY
    const q = pt.matrixTransform(svg.getScreenCTM()!.inverse())
    if (q.y > 250 || q.y < -20) return
    setStems(s => [...s, { e: pick, x: q.x, y: q.y, r: (q.x - 150) / 6 }]); setSaved(false)
  }
  return (
    <Sheet onClose={onClose} label="Arrange flowers">
      <div className="eyebrow">A quiet activity</div><h2>Arrange a bouquet</h2>
      <p className="lede">Pick a flower, then tap above the vase to tuck it in. There is no wrong arrangement.</p>
      <div className="row" style={{ marginBottom: 6 }}>{have.map(id => <button key={id} className={`tab ${pick === id ? 'on' : ''}`} onClick={() => setPick(id)}>{EMO[id].species}</button>)}</div>
      <svg ref={ref} viewBox="0 0 300 320" style={{ width: '100%', maxHeight: 400, cursor: 'copy', background: 'radial-gradient(ellipse at 50% 40%, #fffaf0, #efe5cb)', borderRadius: 20, border: '1px solid rgba(138,106,82,.2)' }} onClick={add}>
        <PlantDefs />
        {stems.map((s, i) => (
          <g key={i}>
            <path d={`M150 250 Q ${(150 + s.x) / 2} ${(250 + s.y) / 2 + 20} ${s.x} ${s.y + 8}`} stroke="#6F9A5E" strokeWidth="3" fill="none" strokeLinecap="round" />
            <g transform={`translate(${s.x} ${s.y + 40}) rotate(${s.r}) scale(.62)`} pointerEvents="none"><PlantArt id={s.e} stage={3} /></g>
          </g>
        ))}
        <path d="M110 232 H190 L182 304 Q150 314 118 304Z" fill="#B7CBD0" stroke="#8aa3aa" strokeWidth="2" />
        <path d="M118 250 q32 10 64 0" stroke="#fff" strokeWidth="3" opacity=".5" fill="none" />
        <rect x="104" y="226" width="92" height="10" rx="5" fill="#C9DCDF" stroke="#8aa3aa" />
      </svg>
      <div className="row spread" style={{ marginTop: 12 }}>
        <button className="btn ghost" onClick={() => setStems(s => s.slice(0, -1))} disabled={!stems.length}>Undo</button>
        <button className="btn" disabled={!stems.length || saved} onClick={() => { onSave({ id: uid(), at: Date.now(), stems }); setSaved(true) }}>{saved ? 'Kept in the greenhouse' : 'Keep this bouquet'}</button>
      </div>
      {state.bouquets.length > 0 && <p className="hint" style={{ marginTop: 10 }}>{state.bouquets.length} bouquet{state.bouquets.length > 1 ? 's' : ''} kept so far.</p>}
    </Sheet>
  )
}

/* ---------- petal drift ---------- */
export function PetalDrift({ onClose }: { onClose: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = cv.current!; const g = c.getContext('2d')!
    const fit = () => { c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio }; fit(); addEventListener('resize', fit)
    const cols = ['#F4D9D2', '#EDBFB4', '#FBEFE9', '#DCCFEF', '#F6E7B0']
    const P = Array.from({ length: 42 }, (_, i) => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, vx: 0, vy: 0, a: Math.random() * 6, va: (Math.random() - .5) * .02, s: 8 + Math.random() * 10, c: cols[i % 5] }))
    let mx = -999, my = -999, pvx = 0, pvy = 0, raf = 0
    const mv = (e: PointerEvent) => { pvx = e.clientX - mx; pvy = e.clientY - my; mx = e.clientX; my = e.clientY }
    addEventListener('pointermove', mv)
    const tick = () => {
      g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); g.clearRect(0, 0, innerWidth, innerHeight)
      for (const p of P) {
        const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy)
        if (d < 140) { const f = (1 - d / 140) * .5; p.vx += (dx / (d || 1)) * f * 2 + pvx * .03; p.vy += (dy / (d || 1)) * f * 2 + pvy * .03 }
        p.vy += .006; p.vx *= .985; p.vy *= .985; p.vx += Math.sin(p.y * .01 + p.a) * .01
        p.x += p.vx; p.y += p.vy; p.a += p.va + p.vx * .02
        if (p.y > innerHeight + 20) { p.y = -20; p.x = Math.random() * innerWidth; p.vy = 0 }
        if (p.x < -30) p.x = innerWidth + 20; if (p.x > innerWidth + 30) p.x = -20
        g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.scale(1, .62); g.fillStyle = p.c; g.beginPath(); g.ellipse(0, 0, p.s, p.s * .62, 0, 0, 7); g.fill(); g.restore()
      }
      pvx *= .8; pvy *= .8; raf = requestAnimationFrame(tick)
    }
    tick()
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); addEventListener('keydown', k)
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', fit); removeEventListener('pointermove', mv); removeEventListener('keydown', k) }
  }, [onClose])
  return (
    <motion.div className="pondbg" style={{ background: 'linear-gradient(#c9dcd4, #a9c4b2 60%, #8fb09a)', touchAction: 'none' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <canvas ref={cv} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none' }} onTouchMove={() => { /* pointer events cover touch */ }} />
      <div style={{ position: 'absolute', top: 40, textAlign: 'center', color: '#3e4a38', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, pointerEvents: 'none' }}>Move your hand through the air. The petals will follow.</div>
      <button className="btn ghost" style={{ position: 'absolute', bottom: 50, color: '#3e4a38', borderColor: 'rgba(62,74,56,.4)' }} onClick={onClose}>Let them settle</button>
    </motion.div>
  )
}

/* ---------- drawing ---------- */
const INKS = ['#5E7D4F', '#A99BCB', '#E9B949', '#E48B6D', '#7F9FD0', '#C85A45', '#3E4A38', '#F4EDDC']
export function DrawSheet({ onClose, onSave, count }: { onClose: () => void; onSave: (d: string) => void; count: number }) {
  const cv = useRef<HTMLCanvasElement>(null)
  const [ink, setInk] = useState(INKS[0]); const [size, setSize] = useState(6); const [saved, setSaved] = useState(false)
  const drawing = useRef(false); const last = useRef<[number, number]>([0, 0])
  useEffect(() => { const g = cv.current!.getContext('2d')!; g.fillStyle = '#FBF6E8'; g.fillRect(0, 0, 600, 400) }, [])
  const pos = (e: React.PointerEvent) => { const r = cv.current!.getBoundingClientRect(); return [(e.clientX - r.left) * 600 / r.width, (e.clientY - r.top) * 400 / r.height] as [number, number] }
  const down = (e: React.PointerEvent) => { drawing.current = true; last.current = pos(e); (e.target as Element).setPointerCapture(e.pointerId); move(e) }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return; const g = cv.current!.getContext('2d')!; const p = pos(e)
    g.strokeStyle = ink; g.lineWidth = size; g.lineCap = 'round'; g.lineJoin = 'round'; g.globalAlpha = .85
    g.beginPath(); g.moveTo(...last.current); g.lineTo(p[0] + .01, p[1]); g.stroke(); last.current = p; setSaved(false)
  }
  return (
    <Sheet onClose={onClose} label="Garden drawing">
      <div className="eyebrow">A quiet activity</div><h2>Garden sketchbook</h2>
      <p className="lede">Draw a leaf, a path, a feeling. It doesn’t have to be anything.</p>
      <canvas ref={cv} width={600} height={400} style={{ width: '100%', borderRadius: 16, border: '1px solid rgba(138,106,82,.3)', touchAction: 'none', cursor: 'crosshair' }}
        onPointerDown={down} onPointerMove={move} onPointerUp={() => { drawing.current = false }} onPointerLeave={() => { drawing.current = false }} />
      <div className="row spread" style={{ marginTop: 12 }}>
        <div className="row">{INKS.map(c => <button key={c} aria-label="ink colour" onClick={() => setInk(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: ink === c ? '3px solid #3e4a38' : '2px solid rgba(0,0,0,.15)' }} />)}
          <input type="range" min={2} max={22} value={size} onChange={e => setSize(+e.target.value)} aria-label="brush size" /></div>
        <div className="row"><button className="btn ghost" onClick={() => { const g = cv.current!.getContext('2d')!; g.fillStyle = '#FBF6E8'; g.fillRect(0, 0, 600, 400) }}>Clear</button>
          <button className="btn" disabled={saved} onClick={() => { onSave(cv.current!.toDataURL('image/jpeg', .6)); setSaved(true) }}>{saved ? 'Tucked away' : 'Keep it'}</button></div>
      </div>
      {count > 0 && <p className="hint" style={{ marginTop: 8 }}>{count} sketch{count > 1 ? 'es' : ''} in the sketchbook.</p>}
    </Sheet>
  )
}

/* ---------- secret corner ---------- */
export function SecretSheet({ state, onClose, onFind }: { state: State; onClose: () => void; onFind: (id: string) => void }) {
  const items = [
    { id: 'sea-glass', x: 70, y: 232, el: <ellipse rx="9" ry="6" fill="#9FD0BE" stroke="#6FA591" /> },
    { id: 'old-key', x: 232, y: 150, el: <g stroke="#B88A33" strokeWidth="2.4" fill="none"><circle r="5" /><path d="M5 0 H20 M15 0 v5 M19 0 v4" /></g> },
    { id: 'feather', x: 150, y: 70, el: <path d="M-10 6 C-4 -10 8 -12 12 -8 C8 2 0 8 -10 6 M-10 6 L10 -8" fill="#EFDFC6" stroke="#9A7A62" /> },
  ]
  return (
    <Sheet onClose={onClose} label="The Secret Corner">
      <div className="eyebrow">The Secret Corner</div><h2>Behind the ivy</h2>
      <p className="lede">A hidden nook, usually overlooked. Look closely: three small things have been left here.</p>
      <svg viewBox="0 0 300 280" style={{ width: '100%', borderRadius: 20, background: 'linear-gradient(#cfe0cf, #a9c28e)' }}>
        <defs><radialGradient id="nookglow"><stop offset="0" stopColor="#FFF3C2" stopOpacity=".9" /><stop offset="1" stopColor="#FFF3C2" stopOpacity="0" /></radialGradient></defs>
        <circle cx="150" cy="120" r="120" fill="url(#nookglow)" />
        <path d="M0 280 V150 Q40 90 100 100 Q150 40 200 100 Q260 90 300 150 V280Z" fill="#6F9A5E" opacity=".75" />
        {Array.from({ length: 26 }, (_, i) => <ellipse key={i} cx={(i * 47) % 300} cy={40 + ((i * 71) % 150)} rx="16" ry="8" fill={i % 2 ? '#5E8A4F' : '#7FAE68'} transform={`rotate(${(i * 37) % 180} ${(i * 47) % 300} ${40 + ((i * 71) % 150)})`} opacity=".8" />)}
        <ellipse cx="150" cy="250" rx="130" ry="26" fill="#8BAE70" />
        <path d="M120 250 V190 Q150 150 180 190 V250Z" fill="#8A6A4E" stroke="#6b4f38" strokeWidth="3" /><circle cx="170" cy="215" r="3" fill="#E8C466" />
        {EMOTIONS.slice(0, 0).map(() => null)}
        {items.map(it => {
          const got = state.found.includes(it.id)
          return <g key={it.id} transform={`translate(${it.x} ${it.y})`} style={{ cursor: got ? 'default' : 'pointer', opacity: got ? .35 : 1 }} onClick={() => !got && onFind(it.id)}><circle r="20" fill="transparent" />{it.el}</g>
        })}
      </svg>
      <p className="hint" style={{ marginTop: 10 }}>{items.filter(i => state.found.includes(i.id)).length} of 3 found. You can come back to this any time.</p>
    </Sheet>
  )
}

/* ---------- garden history ---------- */
export function HistoryView({ state }: { state: State }) {
  const first = Math.min(...state.plants.map(p => p.plantedAt), Date.now() - DAY)
  const [t, setT] = useState(Date.now())
  const shown = state.plants.filter(p => p.plantedAt <= t).sort((a, b) => a.y - b.y)
  const stageAt = (p: State['plants'][0]) => stageOf(p.growth + (Math.max(0, t - p.plantedAt) / DAY) * .6)
  return (
    <div>
      <p className="hint" style={{ marginBottom: 8 }}>Drag back through time and watch the meadow fill in. {fmt(t, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <svg viewBox="0 560 1600 340" style={{ width: '100%', borderRadius: 16, background: 'linear-gradient(#e4eed3, #c9dcab)', border: '1px solid rgba(138,106,82,.2)' }}>
        <PlantDefs />
        {shown.map(p => <g key={p.id} transform={`translate(${p.x} ${p.y}) scale(${1.4 + (p.y - 600) / 270 * .8})`}><PlantArt id={p.emotion} stage={stageAt(p)} /></g>)}
      </svg>
      <input type="range" min={first} max={Date.now()} step={DAY / 4} value={t} onChange={e => setT(+e.target.value)} style={{ width: '100%', marginTop: 10 }} aria-label="Garden history" />
      <div className="hint">{shown.length} plant{shown.length === 1 ? '' : 's'} growing</div>
    </div>
  )
}

/* ---------- monthly scrapbook ---------- */
export function Scrapbook({ state }: { state: State }) {
  const [ref, setRef] = useState(() => new Date())
  const inMonth = (t: number) => { const d = new Date(t); return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear() }
  const cis = state.checkins.filter(c => inMonth(c.at)); const mem = state.memories.filter(m => inMonth(m.at))
  const planted = state.plants.filter(p => inMonth(p.plantedAt))
  const kinds = [...new Set(cis.flatMap(c => c.emotions.map(e => e.id)))]
  const rot = (i: number) => ((i * 53) % 7) - 3
  return (
    <div>
      <div className="row spread" style={{ marginBottom: 12 }}>
        <button className="btn ghost" onClick={() => setRef(new Date(ref.getFullYear(), ref.getMonth() - 1, 1))}>‹</button>
        <h3 style={{ fontSize: 24 }}>{ref.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3>
        <button className="btn ghost" onClick={() => setRef(new Date(ref.getFullYear(), ref.getMonth() + 1, 1))}>›</button>
      </div>
      {!cis.length && !mem.length && !planted.length ? <p className="lede">This page is still blank. It will fill itself in as the month goes by.</p> : (
        <div className="scrap">
          <div className="scrap-title"><span>{ref.toLocaleDateString(undefined, { month: 'long' })}, in the garden</span>
            <em>{planted.length} seed{planted.length === 1 ? '' : 's'} planted · {mem.length} memor{mem.length === 1 ? 'y' : 'ies'} kept</em></div>
          {kinds.length > 0 && <div className="scrap-flowers">{kinds.slice(0, 6).map((k, i) => <div key={k} style={{ transform: `rotate(${rot(i)}deg)` }}><PlantPreview id={k} stage={4} size={84} /><small>{EMO[k].species}</small></div>)}</div>}
          {cis.slice(-6).map((c, i) => (
            <div key={c.id} className={`scrap-note ${c.photo ? 'photo' : ''}`} style={{ transform: `rotate(${rot(i + 2)}deg)` }}>
              <i className="tape" />
              {c.photo && <img src={c.photo} alt="" />}
              <b>{fmt(c.at)}</b>
              <div className="chips">{c.emotions.map(e => <span key={e.id} className="chip" style={{ ['--c' as string]: EMO[e.id].color }}><i />{EMO[e.id].label}</span>)}</div>
              {c.feeling && <p>{c.feeling}</p>}
            </div>
          ))}
          {mem.map((m, i) => <div key={m.id} className="scrap-tag" style={{ transform: `rotate(${rot(i + 5)}deg)` }}><b>{m.title}</b><small>{fmt(m.at)}{m.private ? ' · private' : ''}</small></div>)}
        </div>
      )}
    </div>
  )
}
