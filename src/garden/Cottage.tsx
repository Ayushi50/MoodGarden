import { memo, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Decor, Memory, Plant, Season, Weather, plantScale, stageNow } from '../store'
import { EMO } from '../data/emotions'
import { PlantArt, PlantDefs } from './PlantArt'
import { DecorArt } from './Decor'
import { backdrop } from './cottageArt'

/* The cottage front garden: a hand-drawn backdrop that follows the real time of day,
   with interactive objects, plants and companions layered on top. Scene space is 1200x750. */

function rng(seed: number) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 } }
const R = rng(42)
const range = (a: number, b: number) => a + R() * (b - a)
const FALLING = Array.from({ length: 22 }, () => ({ x: range(0, 1200), t: range(11, 22), d: -range(0, 22), dx: range(-120, 120), s: range(.7, 1.3), c: Math.floor(R() * 3), rot: range(180, 720) }))
const RAIN = Array.from({ length: 80 }, () => ({ x: range(-100, 1250), t: range(.55, .95), d: -range(0, 2), l: range(16, 30) }))
const SNOW = Array.from({ length: 80 }, () => ({ x: range(0, 1200), t: range(9, 18), d: -range(0, 18), r: range(1.4, 3.4), dx: range(-50, 50) }))

interface Props {
  plants: Plant[]; memories: Memory[]; season: Season; hour: number; weather: Weather; calm: boolean; portrait: boolean
  decor: Decor[]; placing: boolean; onPlace: (x: number, y: number) => void; onDecor: (id: string) => void
  finds: { id: string; x: number; y: number }[]; onGather: (id: string) => void; pathStyle: string
  mailUnread: boolean; waterMode: boolean; recent: string[]; watering: { x: number; y: number; k: number } | null
  onPlant: (id: string) => void; onPond: () => void; onBench: () => void; onMailbox: () => void
  onGreenhouse: () => void; onHouse: () => void; onTree: () => void; onGate: () => void; onMemory: (id: string) => void
  onHover: (l: string | null) => void; onFind: (id: string) => void; onCompanion: (id: string) => void; onCan: () => void
}

function Hit({ label, onClick, onHover, children }: { label: string; onClick: () => void; onHover: (l: string | null) => void; children: ReactNode }) {
  return (
    <g className="hit" role="button" tabIndex={0} aria-label={label}
      onClick={e => { e.stopPropagation(); onClick() }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      onPointerEnter={() => onHover(label)} onPointerLeave={() => onHover(null)} onFocus={() => onHover(label)} onBlur={() => onHover(null)}>
      {children}
    </g>
  )
}

function Butterflies({ calm, onTap }: { calm: boolean; onTap: (x: number, y: number) => void }) {
  const refs = useRef<(SVGGElement | null)[]>([])
  const cfg = useMemo(() => [
    { cx: 560, cy: 440, ax: 280, ay: 80, fx: .31, fy: .47, c: ['#E8A98A', '#F5D1BD'] },
    { cx: 860, cy: 600, ax: 260, ay: 70, fx: .23, fy: .39, c: ['#A9C1E0', '#D6E3F3'] },
    { cx: 260, cy: 560, ax: 200, ay: 80, fx: .27, fy: .53, c: ['#EBCB6B', '#F6E5AE'] },
  ], [])
  useEffect(() => {
    let raf = 0; const t0 = performance.now()
    const tick = (now: number) => {
      const t = calm ? 3 : (now - t0) / 1000
      cfg.forEach((c, i) => {
        const el = refs.current[i]; if (!el) return
        const x = c.cx + c.ax * Math.sin(t * c.fx + i * 2), y = c.cy + c.ay * Math.sin(t * c.fy + i)
        const dx = Math.cos(t * c.fx + i * 2)
        el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${dx > 0 ? 1 : -1} 1) rotate(${(Math.cos(t * c.fy + i) * 14).toFixed(1)})`)
      })
      if (!calm) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [calm, cfg])
  return (
    <>
      {cfg.map((c, i) => (
        <g key={i} ref={el => { refs.current[i] = el }} className="obj butterfly" role="button" aria-label="A butterfly" tabIndex={0}
          onClick={e => { e.stopPropagation(); const m = refs.current[i]?.getAttribute('transform') || ''; const n = m.match(/translate\(([\d.-]+) ([\d.-]+)\)/); onTap(n ? +n[1] : 600, n ? +n[2] : 500) }}>
          <circle r="24" fill="transparent" />
          <g className="flap-l"><path d="M0 0 C -6 -14 -20 -16 -18 -4 C -17 4 -8 6 0 0Z" fill={c.c[0]} /><path d="M0 1 C -4 8 -12 14 -8 8 C -6 5 -2 4 0 1Z" fill={c.c[1]} /><circle cx="-11" cy="-6" r="2" fill="#fff" opacity=".6" /></g>
          <g className="flap-r"><path d="M0 0 C 6 -14 20 -16 18 -4 C 17 4 8 6 0 0Z" fill={c.c[0]} /><path d="M0 1 C 4 8 12 14 8 8 C 6 5 2 4 0 1Z" fill={c.c[1]} /><circle cx="11" cy="-6" r="2" fill="#fff" opacity=".6" /></g>
          <ellipse cx="0" cy="0" rx="1.6" ry="6" fill="#4f4036" />
        </g>
      ))}
    </>
  )
}

function WateringAnim({ w }: { w: { x: number; y: number; k: number } }) {
  return (
    <g key={w.k} transform={`translate(${w.x} ${w.y})`} pointerEvents="none" className="water-anim">
      <g transform="translate(-52 -118)"><g className="can-tilt">
        <path d="M-18 -30 Q-20 0 -14 0 H12 Q18 0 16 -30Z" fill="#8FB0A2" stroke="#6C9084" strokeWidth="1.5" />
        <path d="M16 -20 L36 -42 L40 -39 L20 -12Z" fill="#8FB0A2" stroke="#6C9084" strokeWidth="1.4" />
        <path d="M-18 -22 q-18 -4 -14 -18 q4 -10 16 -8" fill="none" stroke="#6C9084" strokeWidth="3.4" strokeLinecap="round" />
      </g></g>
      {Array.from({ length: 16 }, (_, i) => <circle key={i} className="drop" cx={-14 + (i % 5) * 7} cy={-96} r="2.4" fill="#BFE0F0" style={{ animationDelay: `${i * .08}s` }} />)}
      <ellipse cx="0" cy="2" rx="26" ry="7" fill="#4d6a74" opacity=".3" className="puddle" />
    </g>
  )
}

export const Scene = memo(function Scene(p: Props) {
  const key = Math.round(p.hour * 20) / 20
  const art = useMemo(() => backdrop(key, p.pathStyle), [key, p.pathStyle])
  const lit = art.lit
  const night = lit > .5
  const svgRef = useRef<SVGSVGElement>(null)
  const [birdAway, setBirdAway] = useState(false)
  const [frogMsg, setFrogMsg] = useState(false)
  const [sparkle, setSparkle] = useState<{ x: number; y: number; k: number } | null>(null)
  const sorted = useMemo(() => [...p.plants].sort((a, b) => a.y - b.y), [p.plants])
  const glowPlants = sorted.filter(pl => EMO[pl.emotion].glows && stageNow(pl) >= 1)
  const snowing = p.weather === 'snow' || (p.season === 'winter' && p.weather !== 'rain' && p.weather !== 'mist')
  const bird = () => { if (birdAway) return; p.onCompanion('bird'); setBirdAway(true); setTimeout(() => setBirdAway(false), 9000) }
  const frog = () => { p.onCompanion('frog'); setFrogMsg(true); setTimeout(() => setFrogMsg(false), 1800) }
  const spark = (x: number, y: number) => { p.onCompanion('butterfly'); setSparkle({ x, y, k: Date.now() }); setTimeout(() => setSparkle(null), 1800) }
  const H = p.onHover

  return (
    <svg ref={svgRef} viewBox="0 0 1200 750" preserveAspectRatio="xMidYMid slice"
      onClick={e => {
        if (!p.placing || !svgRef.current) return
        const pt = svgRef.current.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY
        const q = pt.matrixTransform(svgRef.current.getScreenCTM()!.inverse()); p.onPlace(q.x, q.y)
      }}
      style={{ cursor: p.placing ? 'crosshair' : undefined }}
      className={`scene cottage ${p.portrait ? 'portrait' : ''} ${p.placing ? 'placing' : ''} ${p.calm ? 'still' : ''} ${p.weather === 'wind' ? 'windy' : ''}`} role="img" aria-label="Your cottage garden">
      <defs><PlantDefs /></defs>
      <g dangerouslySetInnerHTML={{ __html: art.back }} />
      {p.season === 'autumn' && <rect width="1200" height="750" fill="#E8902A" opacity=".2" pointerEvents="none" />}
      {p.season === 'winter' && <rect width="1200" height="750" fill="#DCE8F2" opacity=".42" pointerEvents="none" />}
      {p.season === 'spring' && <rect width="1200" height="750" fill="#FFD6E4" opacity=".06" pointerEvents="none" />}
      {p.season === 'winter' && <g pointerEvents="none"><rect y="330" width="1200" height="420" fill="#fff" opacity=".22" /><path d="M0 560 Q300 520 600 548 T1200 540 V750 H0Z" fill="#fff" opacity=".25" /></g>}

      {/* interactive places (the art is already painted; these add hover glow + clicks) */}
      <Hit label="The cottage · your journal" onClick={p.onHouse} onHover={H}><rect x="440" y="110" width="320" height="240" fill="transparent" /><ellipse className="hl" cx="600" cy="250" rx="190" ry="120" fill="url(#gl-sun)" /></Hit>
      <Hit label="The fountain · a quiet place to breathe" onClick={p.onPond} onHover={H}><ellipse cx="930" cy="470" rx="130" ry="100" fill="transparent" /><ellipse className="hl" cx="930" cy="470" rx="150" ry="110" fill="url(#gl-sun)" /></Hit>
      <Hit label="The Memory Tree · tend your memories" onClick={p.onTree} onHover={H}><ellipse cx="90" cy="215" rx="165" ry="125" fill="transparent" /><rect x="40" y="300" width="100" height="150" fill="transparent" /><ellipse className="hl" cx="90" cy="230" rx="170" ry="130" fill="url(#gl-sun)" /></Hit>
      <Hit label="The gate · explore the garden" onClick={p.onGate} onHover={H}><rect x="480" y="690" width="240" height="60" fill="transparent" /><ellipse className="hl" cx="600" cy="735" rx="130" ry="50" fill="url(#gl-sun)" /></Hit>
      <Hit label={p.mailUnread ? 'The mailbox · a letter is waiting' : 'The mailbox · garden letters'} onClick={p.onMailbox} onHover={H}><rect x="262" y="350" width="76" height="110" fill="transparent" /><ellipse className="hl" cx="300" cy="400" rx="60" ry="70" fill="url(#gl-sun)" /></Hit>
      <Hit label="The bench · pause for a moment" onClick={p.onBench} onHover={H}><rect x="750" y="345" width="140" height="75" fill="transparent" /><ellipse className="hl" cx="820" cy="395" rx="90" ry="45" fill="url(#gl-sun)" /></Hit>
      <Hit label="The greenhouse · your plant collection" onClick={p.onGreenhouse} onHover={H}><rect x="1035" y="420" width="170" height="115" fill="transparent" /><ellipse className="hl" cx="1120" cy="480" rx="100" ry="70" fill="url(#gl-sun)" /></Hit>
      <Hit label={p.waterMode ? 'Watering can · tap a plant to water it' : 'The watering can'} onClick={p.onCan} onHover={H}><rect x="360" y="605" width="100" height="62" fill="transparent" /><ellipse className="hl" cx="410" cy="640" rx="60" ry="36" fill="url(#gl-sun)" /></Hit>
      {[[150, 685], [200, 470]].map(([x, y], i) => <Hit key={i} label="A ring of mushrooms" onClick={() => p.onFind('speckled-mushroom')} onHover={H}><rect x={x - 40} y={y - 56} width="90" height="64" fill="transparent" /><ellipse className="hl" cx={x} cy={y - 20} rx="55" ry="38" fill="url(#gl-sun)" /></Hit>)}

      {/* mailbox flag and envelope */}
      <g transform="translate(300 450) scale(1.1)" pointerEvents="none">
        <g style={{ transformBox: 'fill-box', transformOrigin: '0 100%', transform: p.mailUnread ? 'rotate(0)' : 'rotate(80deg)', transition: 'transform .6s' }}><rect x="24" y="-90" width="3" height="26" fill="#8a6a4e" /><rect x="26" y="-90" width="15" height="10" rx="1" fill="#D98A6A" /></g>
        {p.mailUnread && <g className="envelope"><rect x="-13" y="-120" width="26" height="18" rx="2" fill="#FFFBF0" stroke="#d6c9ac" /><path d="M-13 -120 l13 10 l13 -10" fill="none" stroke="#d6c9ac" /><circle cx="0" cy="-110" r="3" fill="#D98A6A" /></g>}
      </g>

      {/* memory ornaments hanging in the tree */}
      {p.memories.map(m => {
        const x = 90 + m.x * 120, y = 205 + m.y * 70
        return (
          <g key={m.id} className="ornament" role="button" tabIndex={0} aria-label={`Memory: ${m.title}`}
            onClick={e => { e.stopPropagation(); p.onMemory(m.id) }} onKeyDown={e => { if (e.key === 'Enter') p.onMemory(m.id) }}
            onPointerEnter={() => H(m.private ? 'A private memory' : m.title)} onPointerLeave={() => H(null)}>
            <circle cx={x} cy={y} r="16" fill="transparent" />
            {m.kind === 'blossom' && <g transform={`translate(${x} ${y}) scale(1.4)`}>{[0, 1, 2, 3, 4].map(i => <ellipse key={i} cy="-5" rx="3.6" ry="5.2" transform={`rotate(${i * 72})`} fill="#F7C9CF" stroke="#D9808F" strokeWidth=".5" />)}<circle r="2.4" fill="#F0CB66" /></g>}
            {m.kind === 'leaf' && <g transform={`translate(${x} ${y}) rotate(25) scale(1.3)`}><path d="M0 0 C 4 -6 12 -6 16 0 C 12 6 4 6 0 0Z" fill="#9CE07F" stroke="#4f9a46" strokeWidth=".6" /></g>}
            {m.kind === 'ornament' && <g><path d={`M${x} ${y - 24} V${y - 8}`} stroke="#C9A86A" strokeWidth="1.2" /><circle cx={x} cy={y} r="8" fill="#F0C65A" stroke="#B88A33" strokeWidth="1" /><circle cx={x - 2.6} cy={y - 2.6} r="2.6" fill="#fff" opacity=".6" /></g>}
            {m.kind === 'fruit' && <g><circle cx={x} cy={y} r="12" fill="url(#fruitglow)" className="pulse" /><circle cx={x} cy={y} r="6" fill="#F7D27A" stroke="#E0A93E" strokeWidth="1" /></g>}
          </g>
        )
      })}

      {/* the wren on the bench */}
      <g role="button" tabIndex={0} aria-label="A little wren" className="obj" onClick={e => { e.stopPropagation(); bird() }} onPointerEnter={() => H('A little wren')} onPointerLeave={() => H(null)}>
        <g className={birdAway ? 'bird-away' : 'bird-perch'}><g transform="translate(846 352)"><g className="bob">
          <ellipse cx="0" cy="-6" rx="9" ry="7.5" fill="#9A7A62" /><path d="M-9 -6 Q-17 -10 -15 -2 Q-12 0 -8 -2Z" fill="#7D6049" /><ellipse cx="2" cy="-3" rx="5.5" ry="4.5" fill="#EFDFC6" />
          <circle cx="6" cy="-13" r="5.5" fill="#9A7A62" /><circle cx="8" cy="-14" r="1.2" fill="#2e2a26" /><path d="M11 -13 l5 1.5 l-5 1.5Z" fill="#E4A94B" /><path d="M-2 0 v4 M3 0 v4" stroke="#6d553f" strokeWidth="1.2" />
        </g></g></g>
        <rect x="826" y="330" width="46" height="34" fill="transparent" />
      </g>
      {/* frog on the fountain rim */}
      <g role="button" tabIndex={0} aria-label="A frog" className="obj" onClick={e => { e.stopPropagation(); frog() }} onPointerEnter={() => H('A little frog')} onPointerLeave={() => H(null)}>
        <g transform="translate(838 512)" className={frogMsg ? 'hop-c' : ''}>
          <ellipse cx="0" cy="-4" rx="10" ry="7.5" fill="#8DB174" /><ellipse cx="0" cy="-2" rx="6.5" ry="4" fill="#CFE0A8" />
          <circle cx="-5.5" cy="-10" r="3.8" fill="#8DB174" /><circle cx="5.5" cy="-10" r="3.8" fill="#8DB174" /><circle cx="-5.5" cy="-10.4" r="2" fill="#fff" /><circle cx="5.5" cy="-10.4" r="2" fill="#fff" />
          <circle className="blink" cx="-5.5" cy="-10.4" r="1.1" fill="#2d3b2a" /><circle className="blink" cx="5.5" cy="-10.4" r="1.1" fill="#2d3b2a" />
        </g>
        {frogMsg && <g className="bubble"><rect x="826" y="474" width="44" height="20" rx="10" fill="#FFFBF0" stroke="#d9cfb7" /><text x="848" y="488" textAnchor="middle" fontFamily="Fraunces" fontStyle="italic" fontSize="12" fill="#5a6a52">ribbit</text></g>}
        <circle cx="838" cy="508" r="22" fill="transparent" />
      </g>

      {/* decorations, gentle finds */}
      {p.decor.map(d => (
        <g key={d.id} transform={`translate(${d.x} ${d.y}) scale(${plantScale(d.y) * .9})`}>
          <g className="obj" role="button" tabIndex={0} aria-label="Garden decoration" onClick={e => { e.stopPropagation(); p.onDecor(d.id) }} onPointerEnter={() => H('A decoration')} onPointerLeave={() => H(null)}>
            <ellipse cy="2" rx="22" ry="5" fill="#04100a" opacity=".25" /><DecorArt kind={d.kind} night={night} />
            <rect x="-26" y="-80" width="52" height="84" fill="transparent" />
          </g>
        </g>
      ))}
      {p.finds.map(f => (
        <g key={f.id} transform={`translate(${f.x} ${f.y})`} className="obj find" role="button" tabIndex={0} aria-label="Something small on the ground"
          onClick={e => { e.stopPropagation(); p.onGather(f.id) }} onPointerEnter={() => H(p.season === 'autumn' ? 'A fallen leaf' : p.season === 'spring' ? 'A fallen petal' : p.season === 'summer' ? 'A four-leaf clover' : 'A frost crystal')} onPointerLeave={() => H(null)}>
          <circle r="16" fill="transparent" />
          {p.season === 'autumn' && <path d="M-9 4 C-6 -8 6 -10 10 -2 C6 8 -4 10 -9 4Z M-9 4 L9 -2" fill="#D8903F" stroke="#8A4A2A" strokeWidth=".8" transform="rotate(-20)" />}
          {p.season === 'spring' && <g>{[0, 72, 144, 216, 288].map(a => <ellipse key={a} cy="-5" rx="3.6" ry="5.4" transform={`rotate(${a})`} fill="#F4D9D2" stroke="#d9a49a" strokeWidth=".5" />)}<circle r="2" fill="#F0CB66" /></g>}
          {p.season === 'summer' && <g fill="#6FA05A" stroke="#4f7d41" strokeWidth=".6">{[0, 90, 180, 270].map(a => <path key={a} d="M0 0 C-6 -4 -6 -10 0 -8 C6 -10 6 -4 0 0" transform={`rotate(${a})`} />)}</g>}
          {p.season === 'winter' && <g stroke="#CFE6F2" strokeWidth="1.8" strokeLinecap="round">{[0, 60, 120].map(a => <path key={a} d="M0 -9 V9 M-3 -6 L0 -9 L3 -6 M-3 6 L0 9 L3 6" transform={`rotate(${a})`} />)}</g>}
          <circle r="11" fill="none" stroke="#fff" strokeWidth="1" className="newring" opacity=".7" />
        </g>
      ))}

      {/* plants, back to front */}
      {sorted.map(pl => {
        const st = stageNow(pl)
        const s = plantScale(pl.y)
        const isNew = p.recent.includes(pl.id)
        const wide = st >= 4 && pl.emotion === 'loneliness'
        return (
          <g key={pl.id} transform={`translate(${pl.x} ${pl.y}) scale(${s})`}>
            <g className={`plant ${isNew ? 'pop' : ''} ${p.waterMode ? 'waterable' : ''} ${EMO[pl.emotion].glows ? 'glowy' : ''}`}
              role="button" tabIndex={0} aria-label={`${EMO[pl.emotion].species}, ${['seed', 'sprout', 'bud', 'bloom', 'mature'][st]}`}
              onClick={e => { e.stopPropagation(); p.onPlant(pl.id) }} onKeyDown={e => { if (e.key === 'Enter') p.onPlant(pl.id) }}
              onPointerEnter={() => H(p.waterMode ? `Water the ${EMO[pl.emotion].species.toLowerCase()}` : EMO[pl.emotion].species)} onPointerLeave={() => H(null)}>
              <g className="sway" style={{ animationDelay: `${-(pl.x % 7) * .6}s` }}><PlantArt id={pl.emotion} stage={st} /></g>
              <rect x={wide ? -60 : -34} y="-112" width={wide ? 120 : 68} height="116" fill="transparent" />
              {isNew && <circle r="40" cy="-30" fill="none" stroke="#fff" strokeWidth="2" className="newring" />}
            </g>
          </g>
        )
      })}

      {/* companions */}
      <Butterflies calm={p.calm} onTap={spark} />
      {sparkle && <g key={sparkle.k} transform={`translate(${sparkle.x} ${sparkle.y})`} pointerEvents="none">{Array.from({ length: 9 }, (_, i) => <circle key={i} className="spark" r="2.6" fill={['#F6E3A1', '#fff', '#F0B9A5'][i % 3]} style={{ ['--a' as string]: `${i * 40}deg` }} />)}</g>}
      <g className="obj snail-walk" style={{ animationDuration: '120s' }} role="button" tabIndex={0} aria-label="A snail" onClick={e => { e.stopPropagation(); p.onCompanion('snail') }} onPointerEnter={() => H('A very patient snail')} onPointerLeave={() => H(null)}>
        <g transform="translate(40 728)"><circle cx="-1" cy="-9" r="9" fill="#C99D7C" stroke="#9B7658" /><path d="M-1 -9 m-5 0 a5 5 0 1 1 5 5 a2.6 2.6 0 1 1 -2.6 -2.6" fill="none" stroke="#9B7658" /><path d="M-12 0 Q-10 -4 4 -4 Q16 -4 16 0Z" fill="#D9C7A6" /><path d="M13 -3 Q15 -10 15 -13 M16 -3 Q19 -9 20 -11" stroke="#D9C7A6" strokeWidth="1.6" fill="none" strokeLinecap="round" /><rect x="-14" y="-18" width="38" height="22" fill="transparent" /></g>
      </g>
      {(p.season === 'autumn' || p.season === 'spring') && lit < .5 && (
        <g className="obj" role="button" tabIndex={0} aria-label="A hedgehog" onClick={e => { e.stopPropagation(); p.onCompanion('hedgehog') }} onPointerEnter={() => H('A shy hedgehog')} onPointerLeave={() => H(null)}>
          <g transform="translate(1150 735)"><ellipse cx="0" cy="-9" rx="17" ry="11" fill="#8A6C52" />{Array.from({ length: 11 }, (_, i) => <path key={i} d={`M${-14 + i * 2.8} -14 l${-3 + (i % 3)} -8`} stroke="#6b513c" strokeWidth="2" strokeLinecap="round" />)}<ellipse cx="15" cy="-6" rx="8" ry="6" fill="#E3CDB0" /><circle cx="19" cy="-8" r="1.3" fill="#2b2420" /><circle cx="22.5" cy="-5.5" r="1.6" fill="#2b2420" /><rect x="-18" y="-22" width="44" height="26" fill="transparent" /></g>
        </g>
      )}
      {(p.season === 'spring' || p.season === 'summer') && lit < .5 && (
        <g className="obj" role="button" tabIndex={0} aria-label="A rabbit" onClick={e => { e.stopPropagation(); p.onCompanion('rabbit') }} onPointerEnter={() => H('A rabbit, pretending not to be here')} onPointerLeave={() => H(null)}>
          <g transform="translate(1160 470)"><ellipse cx="0" cy="-12" rx="15" ry="12" fill="#CDBBA6" /><circle cx="-12" cy="-18" r="8" fill="#D8C8B4" /><ellipse cx="-14" cy="-36" rx="3.4" ry="11" fill="#D8C8B4" transform="rotate(-8 -14 -36)" /><ellipse cx="-8" cy="-37" rx="3.2" ry="10" fill="#D8C8B4" transform="rotate(8 -8 -37)" /><circle cx="-16" cy="-19" r="1.3" fill="#2b2420" /><circle cx="14" cy="-12" r="5" fill="#F3EBDD" /><rect x="-24" y="-48" width="48" height="52" fill="transparent" /></g>
        </g>
      )}
      {lit >= .5 && (
        <g className="obj" role="button" tabIndex={0} aria-label="A moth" onClick={e => { e.stopPropagation(); p.onCompanion('moth') }} onPointerEnter={() => H('A moth, drawn to the window')} onPointerLeave={() => H(null)}>
          <g transform="translate(520 210)"><g className="mothfly"><g className="flap-l"><path d="M0 0 C-8 -8 -14 -2 -10 4 C-6 6 -2 4 0 0Z" fill="#E9E1CF" /></g><g className="flap-r"><path d="M0 0 C8 -8 14 -2 10 4 C6 6 2 4 0 0Z" fill="#E9E1CF" /></g><circle r="18" fill="transparent" /></g></g>
        </g>
      )}

      <g dangerouslySetInnerHTML={{ __html: art.front }} pointerEvents="none" />

      {/* glowing plants after dark */}
      <g pointerEvents="none" style={{ opacity: Math.min(1, lit * 1.2), transition: 'opacity 2s' }}>
        {glowPlants.map(pl => <circle key={pl.id} cx={pl.x} cy={pl.y - 44 * plantScale(pl.y)} r={60 * plantScale(pl.y)} fill={pl.emotion === 'hope' ? 'url(#fruitglow)' : 'url(#moonhalo)'} className="pulse" />)}
      </g>

      {/* seasonal drift + weather */}
      <g pointerEvents="none">
        {p.season !== 'winter' && FALLING.slice(0, p.weather === 'wind' ? 22 : 12).map((f, i) => (
          <g key={i} className="fall" style={{ ['--dx' as string]: `${f.dx}px`, ['--rot' as string]: `${f.rot}deg`, animationDuration: `${p.weather === 'wind' ? f.t * .45 : f.t}s`, animationDelay: `${f.d}s` }}>
            <g transform={`translate(${f.x} -30) scale(${f.s})`}>
              {p.season === 'autumn' && <path d="M0 0 C 6 -8 14 -6 16 2 C 10 10 2 8 0 0Z M0 0 L14 2" fill={['#D8903F', '#BD5B33', '#E3B552'][f.c]} stroke="#8A4A2A" strokeWidth=".6" />}
              {p.season === 'spring' && <ellipse rx="5" ry="3.2" fill={['#F4D9D2', '#FBEFE9', '#EDBFB4'][f.c]} />}
              {p.season === 'summer' && <g><circle r="1.8" fill="#FFF8DC" /><path d="M0 0 l-4 -5 M0 0 l4 -5 M0 0 l0 -7" stroke="#fff" strokeWidth=".6" opacity=".8" /></g>}
            </g>
          </g>
        ))}
        {snowing && SNOW.slice(0, p.weather === 'snow' ? 80 : 30).map((f, i) => <circle key={i} className="snowflake" cx={f.x} cy={-10} r={f.r} fill="#fff" style={{ ['--dx' as string]: `${f.dx}px`, animationDuration: `${f.t}s`, animationDelay: `${f.d}s` }} />)}
        {p.weather === 'rain' && <><rect width="1200" height="750" fill="#6f8294" opacity=".22" style={{ mixBlendMode: 'multiply' }} />{RAIN.map((f, i) => <path key={i} className="raindrop" d={`M${f.x} -40 l-5 ${f.l}`} stroke="#EAF3F6" strokeWidth="1.4" strokeLinecap="round" style={{ animationDuration: `${f.t}s`, animationDelay: `${f.d}s` }} />)}</>}
        {p.weather === 'clouds' && <rect width="1200" height="750" fill="#7E8C99" opacity=".16" />}
        {p.weather === 'mist' && [0, 1, 2].map(i => <ellipse key={i} className="mist" cx={300 + i * 300} cy={420 + i * 120} rx="420" ry="80" fill="url(#mistg)" style={{ animationDelay: `${-i * 6}s`, opacity: .9 }} />)}
        {p.weather === 'wind' && [0, 1, 2, 3, 4].map(i => <path key={i} className="gust" d={`M-200 ${160 + i * 120} q 120 -30 240 0 t 240 0 t 240 0`} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".5" style={{ animationDelay: `${-i * 1.7}s` }} />)}
        {p.weather === 'rainbow' && lit < .5 && <g fill="none" strokeWidth="10" opacity=".45">{['#E39A8D', '#EBBE86', '#F1DE95', '#B4D3A0', '#9CC4D8', '#B3A7D6'].map((c, i) => <path key={i} d={`M100 330 Q600 ${-60 + i * 10} 1100 330`} stroke={c} />)}</g>}
      </g>
      <defs>
        <radialGradient id="fruitglow"><stop offset="0" stopColor="#FFE7A0" stopOpacity=".95" /><stop offset="1" stopColor="#FFE7A0" stopOpacity="0" /></radialGradient>
        <radialGradient id="moonhalo"><stop offset="0" stopColor="#EDEBFF" stopOpacity=".6" /><stop offset="1" stopColor="#EDEBFF" stopOpacity="0" /></radialGradient>
        <radialGradient id="mistg"><stop offset="0" stopColor="#fff" stopOpacity=".7" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
      </defs>
      {p.watering && <WateringAnim w={p.watering} />}
    </svg>
  )
})
