import { EmotionId, EMO } from '../data/emotions'

/* Hand-built botanical illustrations. Each plant is drawn upward from (0,0), roughly 120 units tall when mature. */

const STEM = '#6F9A5E'
const STEM_D = '#557F4A'
const LEAF = 'var(--leaf, #7DA56D)'

const leafPath = (l: number, w: number) =>
  `M0 0 C ${l * .25} ${-w}, ${l * .75} ${-w * 1.1}, ${l} 0 C ${l * .75} ${w * .9}, ${l * .25} ${w * .8}, 0 0Z`

function Leaf({ x = 0, y = 0, rot = 0, l = 24, w = 8, fill = LEAF }: { x?: number; y?: number; rot?: number; l?: number; w?: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={leafPath(l, w)} fill={fill} />
      <path d={leafPath(l, w)} fill="url(#leafgloss)" />
      <path d={`M1 0 L${l * .85} 0`} stroke="#fff" strokeOpacity=".28" strokeWidth=".9" />
      <path d={leafPath(l, w)} fill="none" stroke="#3d5a38" strokeOpacity=".22" strokeWidth=".7" />
    </g>
  )
}

function Petals({ n, r, l, w, fill, rot = 0, stroke }: { n: number; r: number; l: number; w: number; fill: string; rot?: number; stroke?: string }) {
  return <>{Array.from({ length: n }, (_, i) => (
    <g key={i} transform={`rotate(${rot + (i * 360) / n})`}>
      <ellipse cx={0} cy={-r} rx={w} ry={l} fill={fill} stroke={stroke || '#000'} strokeWidth=".6" strokeOpacity=".28" />
      <ellipse cx={-w * .2} cy={-r - l * .28} rx={w * .5} ry={l * .52} fill="url(#gloss)" />
      <path d={`M0 ${-r + l * .8} L0 ${-r - l * .6}`} stroke="#000" strokeOpacity=".08" strokeWidth=".7" />
    </g>
  ))}</>
}

function Bud({ color, deep, s = 1 }: { color: string; deep: string; s?: number }) {
  return (
    <g transform={`scale(${s})`}>
      <path d="M0 2 C -8 -3 -8 -15 0 -23 C 8 -15 8 -3 0 2Z" fill={color} stroke={deep} strokeOpacity=".4" strokeWidth=".7" />
      <path d="M0 -22 C -3 -14 -3 -6 0 2" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth=".9" />
      <path d="M-7 3 Q-6 -5 0 -3 Q6 -5 7 3 Q0 6 -7 3Z" fill={STEM} />
    </g>
  )
}

/* ---------- heads ---------- */
function SunflowerHead() {
  return (
    <g>
      <Petals n={16} r={17} l={12} w={4.6} fill="#E3AE3E" />
      <Petals n={16} r={15} l={11} w={4.2} fill="#F1CB68" rot={11} />
      <circle r="11" fill="#6B4829" />
      <circle r="7.5" fill="#54361F" />
      {[0, 1, 2, 3, 4, 5].map(i => <circle key={i} cx={Math.cos(i) * 4} cy={Math.sin(i) * 4} r=".9" fill="#a6804f" />)}
    </g>
  )
}
function PoppyHead() {
  return (
    <g>
      {[[-8, -4], [8, -4], [-6, 7], [6, 7]].map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx="12" ry="13" fill={i % 2 ? '#C4503C' : '#D0634D'} transform={`rotate(${x * 3} ${x} ${y})`} />
          <ellipse cx={x * .5} cy={y * .5 + 1} rx="4" ry="5" fill="#6d2620" opacity=".55" />
        </g>
      ))}
      <circle r="4.5" fill="#33262a" />
      {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={Math.cos(i * .7) * 7} cy={Math.sin(i * .7) * 7} r="1" fill="#33262a" />)}
    </g>
  )
}
function DaisyHead() {
  const d = (x: number, y: number, s: number, k: number) => (
    <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
      <Petals n={13} r={8} l={7} w={2.3} fill="#FBF6EA" stroke="#d9cba7" />
      <circle r="4.2" fill="#E7BE4A" />
      <circle cx="-1" cy="-1" r="1.4" fill="#f5dc8a" />
    </g>
  )
  return <g>{[d(-15, 8, .8, 0), d(14, 9, .8, 1), d(0, -7, 1, 2)]}</g>
}
function MoonHead() {
  return (
    <g>
      <circle r="26" fill="url(#moonglow)" />
      <Petals n={5} r={11} l={13} w={7.5} fill="#EEEBF9" stroke="#b9b2e0" />
      <Petals n={5} r={6} l={7} w={4} fill="#fff" rot={36} />
      <circle r="3.4" fill="#E4D58C" />
    </g>
  )
}
function CosmosHead() {
  return (
    <g>
      <Petals n={8} r={12} l={12} w={6.4} fill="#E48765" stroke="#b9603f" />
      <Petals n={8} r={11} l={10} w={5} fill="#F2AE90" rot={22} />
      <circle r="4.6" fill="#E8B544" />
      <circle r="2" fill="#b98324" />
    </g>
  )
}

const HEADS: Partial<Record<EmotionId, () => JSX.Element>> = {
  joy: SunflowerHead, anger: PoppyHead, gratitude: DaisyHead, tiredness: MoonHead, excitement: CosmosHead,
}

function StemPlant({ id, stage }: { id: EmotionId; stage: number }) {
  const e = EMO[id]
  const H = [0, 26, 50, 68, 84][stage]
  const bend = id === 'excitement' ? 14 : id === 'tiredness' ? -6 : 4
  const Head = HEADS[id]!
  const headScale = stage === 3 ? .78 : 1
  const lean = id === 'excitement' ? 8 : 0
  return (
    <g>
      <path d={`M0 0 Q ${bend} ${-H / 2} ${lean} ${-H}`} stroke={STEM} strokeWidth={stage > 1 ? 3.2 : 2.4} fill="none" strokeLinecap="round" />
      <Leaf x={1} y={-H * .22} rot={-35} l={22} w={7} />
      <Leaf x={1} y={-H * .34} rot={-148} l={20} w={6.5} />
      {stage >= 3 && <Leaf x={2} y={-H * .52} rot={-30} l={17} w={5.5} />}
      {stage >= 4 && <Leaf x={2} y={-H * .6} rot={-155} l={16} w={5} />}
      {stage === 1 && <Leaf x={lean} y={-H} rot={-70} l={13} w={4.5} />}
      {stage === 2 && <g transform={`translate(${lean} ${-H})`}><Bud color={e.color} deep={e.deep} /></g>}
      {stage >= 3 && <g transform={`translate(${lean} ${-H}) scale(${headScale})`} className="bloom-sway"><Head /></g>}
      {stage >= 4 && id !== 'gratitude' && (
        <g>
          <path d={`M2 ${-H * .45} Q 20 ${-H * .6} 24 ${-H * .78}`} stroke={STEM} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <g transform={`translate(24 ${-H * .78}) scale(.5) rotate(18)`}><Head /></g>
        </g>
      )}
    </g>
  )
}

function Spike({ rot, len, cols, scale = 1 }: { rot: number; len: number; cols: string[]; scale?: number }) {
  const n = Math.floor(len / 5.5)
  return (
    <g transform={`rotate(${rot})`}>
      <path d={`M0 0 L0 ${-len - 6}`} stroke={STEM} strokeWidth="2" strokeLinecap="round" />
      {Array.from({ length: n }, (_, i) => {
        const y = -len * .35 - i * (len * .65 / n) * 1.0
        const s = (1 - i / (n * 1.5)) * scale
        return (
          <g key={i}>
            <ellipse cx={-2.4 * s} cy={y} rx={2.8 * s} ry={3.8 * s} fill={cols[i % cols.length]} transform={`rotate(-20 ${-2.4 * s} ${y})`} />
            <ellipse cx={2.4 * s} cy={y - 2} rx={2.8 * s} ry={3.8 * s} fill={cols[(i + 1) % cols.length]} transform={`rotate(20 ${2.4 * s} ${y - 2})`} />
          </g>
        )
      })}
    </g>
  )
}
function Lavender({ stage }: { stage: number }) {
  const cols = ['#A99BCB', '#9285BD', '#B9AEDA']
  const cols2 = ['#8FA586', '#9BB08F']
  const grass = [-24, -12, 10, 20].map((r, i) => (
    <path key={i} d={`M0 0 Q ${r} -14 ${r * 1.3} -${24 + i * 4}`} stroke="#7FA070" strokeWidth="2.2" fill="none" strokeLinecap="round" />
  ))
  if (stage === 1) return <g>{grass.slice(0, 3)}</g>
  const spikes = stage === 2 ? [[0, 34, cols2]] : stage === 3 ? [[-12, 44, cols], [0, 56, cols], [11, 46, cols]] : [[-22, 44, cols], [-10, 62, cols], [0, 72, cols], [11, 60, cols], [22, 46, cols]]
  return <g>{grass}{(spikes as [number, number, string[]][]).map(([r, l, c], i) => <Spike key={i} rot={r} len={l} cols={c} />)}</g>
}

function Bell({ x, y, rot, s = 1 }: { x: number; y: number; rot: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 0 C -6 3 -7 10 -9 15 Q 0 19 9 15 C 7 10 6 3 0 0Z" fill="#86A5D2" stroke="#5576A8" strokeOpacity=".5" strokeWidth=".7" />
      <path d="M-1 2 C -3 6 -4 11 -5 15" stroke="#fff" strokeOpacity=".4" strokeWidth="1" fill="none" />
      <path d="M-9 15 q2 3 4 0 q3 3 5 0 q3 3 5 0 q2 3 4 0" fill="#9DB8DD" />
    </g>
  )
}
function Bluebell({ stage }: { stage: number }) {
  const H = [0, 24, 44, 62, 74][stage]
  return (
    <g>
      <path d={`M0 0 Q 2 ${-H * .8} ${H * .34} ${-H}`} stroke={STEM} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <Leaf rot={-20} l={26} w={6} y={-2} x={0} />
      <Leaf rot={-160} l={24} w={6} y={-2} x={0} />
      {stage === 1 && <Leaf x={H * .34} y={-H} rot={-60} l={10} w={4} />}
      {stage === 2 && [0, 1, 2].map(i => <ellipse key={i} cx={H * .3 - i * 3} cy={-H + 7 + i * 7} rx="2.6" ry="4.4" fill="#92AACB" />)}
      {stage >= 3 && <>
        <Bell x={H * .3} y={-H + 3} rot={14} s={.9} />
        <Bell x={H * .2} y={-H + 22} rot={8} s={.9} />
        <Bell x={H * .1} y={-H + 40} rot={-4} s={.85} />
      </>}
      {stage >= 4 && <>
        <path d={`M-2 -6 Q -14 ${-H * .6} -24 ${-H * .72}`} stroke={STEM} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <Bell x={-24} y={-H * .72} rot={-14} s={.8} />
        <Bell x={-20} y={-H * .72 + 17} rot={-6} s={.7} />
      </>}
    </g>
  )
}

function Frond({ rot, len, curl = 1 }: { rot: number; len: number; curl?: number }) {
  const P0 = [0, 0], P1 = [len * .1 * curl, -len * .75], P2 = [len * .55 * curl, -len * .85]
  const pt = (t: number) => [(1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0], (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1]]
  const tan = (t: number) => Math.atan2(2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]), 2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0])) * 180 / Math.PI
  const n = 11
  return (
    <g transform={`rotate(${rot})`}>
      <path d={`M0 0 Q ${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}`} stroke="#5E8C60" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {Array.from({ length: n }, (_, i) => {
        const t = .2 + i * (.8 / n)
        const [x, y] = pt(t); const a = tan(t); const s = 1 - t * .78
        return [70, -70].map(o => (
          <ellipse key={i + '' + o} cx={x} cy={y} rx={len * .15 * s} ry={2.3 * s + .6} fill={i % 2 ? '#78A57B' : '#6A9A6E'}
            transform={`rotate(${a + o} ${x} ${y}) translate(${len * .1 * s} 0)`} />
        ))
      })}
    </g>
  )
}
function Fern({ stage }: { stage: number }) {
  if (stage === 1) return <g><path d="M0 0 Q 0 -14 6 -20 Q 12 -24 10 -17 Q 8 -13 4 -17" stroke="#6A9A6E" strokeWidth="2.4" fill="none" strokeLinecap="round" /><path d="M-8 0 Q-10 -9 -5 -14" stroke="#7EAA80" strokeWidth="2" fill="none" strokeLinecap="round" /></g>
  const fr = stage === 2 ? [[-30, 36], [10, 42]] : stage === 3 ? [[-52, 52], [-24, 62], [6, 68], [34, 58]] : [[-62, 54], [-38, 66], [-14, 74], [10, 78], [34, 70], [58, 56]]
  return (
    <g>
      {(fr as [number, number][]).map(([r, l], i) => <Frond key={i} rot={r} len={l} curl={r < 0 ? -1 : 1} />)}
      {stage >= 3 && <path d="M4 0 Q 4 -14 10 -20 Q 17 -23 15 -15 Q 13 -11 9 -15" stroke="#7EAA80" strokeWidth="2.4" fill="none" strokeLinecap="round" />}
    </g>
  )
}

function Tree({ stage }: { stage: number }) {
  if (stage === 1) return <g><path d="M0 0 Q 2 -12 0 -22" stroke="#7a5e48" strokeWidth="2.6" fill="none" strokeLinecap="round" /><Leaf x={0} y={-22} rot={-70} l={11} w={4} /><Leaf x={0} y={-16} rot={-150} l={10} w={4} /></g>
  const th = [0, 0, 40, 70, 96][stage]
  const rc = [0, 0, 16, 36, 54][stage]
  const bl = ['#EBC3BB', '#F3DAD3', '#E3AFA5', '#F6E4DD']
  const cl = [[-1, -.2, .7], [.9, -.35, .65], [0, -1, .8], [-.55, -.7, .65], [.6, -.75, .6], [0, -.3, .9]]
  return (
    <g>
      <path d={`M-5 0 Q -3 ${-th * .5} 0 ${-th} Q 3 ${-th * .5} 5 0Z`} fill="#8A6A52" />
      <path d={`M0 ${-th * .45} Q -16 ${-th * .6} -20 ${-th * .8}`} stroke="#8A6A52" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d={`M0 ${-th * .55} Q 14 ${-th * .7} 18 ${-th * .88}`} stroke="#8A6A52" strokeWidth="3" fill="none" strokeLinecap="round" />
      <g transform={`translate(0 ${-th - rc * .35})`} className="tree-sway">
        {cl.map(([cx, cy, s], i) => (
          <g key={i}>
            <circle cx={cx * rc * .9} cy={cy * rc * .7} r={rc * s} fill={bl[i % 4]} />
          </g>
        ))}
        {stage >= 3 && Array.from({ length: stage * 5 }, (_, i) => {
          const a = i * 2.4, rr = rc * (.3 + ((i * 37) % 70) / 100)
          return <circle key={i} cx={Math.cos(a) * rr} cy={Math.sin(a) * rr * .7 - rc * .2} r={2 + (i % 3)} fill={['#fff', '#D9958A', '#F9EEE9'][i % 3]} opacity=".85" />
        })}
      </g>
    </g>
  )
}

function Hope({ stage }: { stage: number }) {
  const glowR = [0, 16, 22, 30, 38][stage]
  const c = '#D6E69A'
  const sprout = (x: number, s: number, k: number) => (
    <g key={k} transform={`translate(${x} 0) scale(${s})`}>
      <path d="M0 0 Q 1 -12 0 -22" stroke={STEM} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <Leaf x={0} y={-16} rot={-30} l={15} w={5.5} fill="#A9CC7A" />
      <Leaf x={0} y={-13} rot={-150} l={14} w={5} fill="#BCD98B" />
    </g>
  )
  return (
    <g>
      <g transform={`translate(0 ${-[0, 22, 34, 44, 54][stage] * .8})`}><circle r={glowR} fill="url(#hopeglow)" className="pulse" /></g>
      {stage === 1 && sprout(0, 1, 0)}
      {stage === 2 && <g>{sprout(0, 1.5, 0)}<g transform="translate(0 -34)"><circle r="5" fill={c} /><circle r="2" fill="#fff" /></g></g>}
      {stage >= 3 && <g>
        {sprout(-14, .8, 1)}{sprout(15, .9, 2)}
        <path d="M0 0 Q 2 -24 0 -42" stroke={STEM} strokeWidth="2.8" fill="none" strokeLinecap="round" />
        <Leaf x={0} y={-22} rot={-30} l={18} w={6} fill="#A9CC7A" /><Leaf x={0} y={-30} rot={-150} l={16} w={6} fill="#BCD98B" />
        <g transform="translate(0 -46)"><Petals n={6} r={6} l={6} w={3} fill="#F4F6C8" stroke="#c9d889" /><circle r="3" fill="#F2D86A" /></g>
      </g>}
      {stage >= 4 && [[-26, -50], [24, -58], [-8, -78]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 4} L${x + 1.2} ${y - 1.2} L${x + 4} ${y} L${x + 1.2} ${y + 1.2} L${x} ${y + 4} L${x - 1.2} ${y + 1.2} L${x - 4} ${y} L${x - 1.2} ${y - 1.2}Z`} fill="#FBF6C8" className="twinkle" style={{ animationDelay: `${i * .7}s` }} />
      ))}
    </g>
  )
}

function Vine({ stage }: { stage: number }) {
  const len = [0, 28, 52, 78, 100][stage]
  const main = 'M0 0 C 24 -18, -26 -32, 8 -52 S 30 -78, -2 -96'
  const side = 'M8 -52 C 26 -50, 34 -60, 30 -70'
  const side2 = 'M-12 -30 C -28 -34, -34 -46, -26 -54'
  return (
    <g>
      <path d={main} pathLength={100} strokeDasharray={100} strokeDashoffset={100 - len} stroke="#7F9C6A" strokeWidth="3" fill="none" strokeLinecap="round" />
      {stage >= 2 && <path d={side} pathLength={100} stroke="#7F9C6A" strokeWidth="2.2" fill="none" strokeLinecap="round" />}
      {stage >= 3 && <path d={side2} stroke="#7F9C6A" strokeWidth="2.2" fill="none" strokeLinecap="round" />}
      <Leaf x={4} y={-12} rot={-20} l={16} w={6} /><Leaf x={-8} y={-26} rot={-165} l={15} w={5.5} />
      {stage >= 2 && <><Leaf x={7} y={-48} rot={-25} l={15} w={5.5} /><Leaf x={22} y={-62} rot={-145} l={13} w={5} /></>}
      {stage >= 3 && <>
        {[[30, -70, 5], [-26, -54, 4.2], [-2, -96, 5.5]].map(([x, y, r], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <Petals n={5} r={r} l={r} w={r * .6} fill={i % 2 ? '#C7A9C8' : '#B497B5'} />
            <circle r={r * .45} fill="#F4E3B8" />
          </g>
        ))}
      </>}
      {stage >= 4 && [[14, -86], [-14, -76], [20, -34]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="#9F82A3" />)}
    </g>
  )
}

function Hosta({ stage }: { stage: number }) {
  const rots = stage === 1 ? [-22, 22] : stage === 2 ? [-45, -18, 18, 45] : stage === 3 ? [-62, -38, -14, 14, 38, 62] : [-70, -48, -26, -8, 8, 26, 48, 70]
  const sc = [0, .45, .75, 1, 1.18][stage]
  return (
    <g>
      {stage >= 4 && <g>
        <path d="M0 0 Q 4 -38 -2 -70" stroke="#7FA070" strokeWidth="2" fill="none" />
        {[0, 1, 2, 3, 4].map(i => <ellipse key={i} cx={-2 + (i % 2 ? 3 : -3)} cy={-70 + i * 6} rx="3" ry="4" fill="#C9C0E0" />)}
      </g>}
      {rots.map((r, i) => (
        <g key={i} transform={`rotate(${r}) scale(${sc * (.85 + (i % 3) * .1)})`}>
          <path d="M0 0 C -16 -8, -21 -34, 0 -52 C 21 -34, 16 -8, 0 0Z" fill={i % 2 ? '#86A883' : '#9CBB93'} stroke="#4F7552" strokeOpacity=".35" strokeWidth=".8" />
          <path d="M0 -2 L0 -46 M0 -14 L-8 -24 M0 -14 L8 -24 M0 -26 L-8 -35 M0 -26 L8 -35" stroke="#fff" strokeOpacity=".3" strokeWidth=".8" fill="none" />
        </g>
      ))}
    </g>
  )
}

export function PlantArt({ id, stage }: { id: EmotionId; stage: number }) {
  const e = EMO[id]
  const body = (() => {
    if (stage === 0) return null
    switch (id) {
      case 'calm': return <Lavender stage={stage} />
      case 'sadness': return <Bluebell stage={stage} />
      case 'anxiety': return <Fern stage={stage} />
      case 'loneliness': return <Tree stage={stage} />
      case 'hope': return <Hope stage={stage} />
      case 'confusion': return <Vine stage={stage} />
      case 'neutral': return <Hosta stage={stage} />
      default: return <StemPlant id={id} stage={stage} />
    }
  })()
  return (
    <g>
      <ellipse cx="0" cy="1" rx={stage === 4 && id === 'loneliness' ? 34 : 18} ry="4.5" fill="#2e3b27" opacity=".16" className="shadow" />
      {stage === 0 ? (
        <g>
          <path d="M-12 1 Q-6 -7 0 -7 Q6 -7 12 1Z" fill="#8A6A4A" />
          <path d="M-9 1 Q-4 -5 0 -5" stroke="#a88460" strokeWidth="1" fill="none" />
          <ellipse cx="0" cy="-8.5" rx="2.6" ry="3.4" fill={e.color} stroke={e.deep} strokeWidth=".7" className="twinkle" />
        </g>
      ) : body}
    </g>
  )
}

export function PlantDefs() {
  return (
    <defs>
      <radialGradient id="gloss" cx=".35" cy=".3" r=".7"><stop offset="0" stopColor="#fff" stopOpacity=".6" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
      <linearGradient id="leafgloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".38" /><stop offset=".55" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#0a3a10" stopOpacity=".18" /></linearGradient>
      <radialGradient id="moonglow"><stop offset="0" stopColor="#fff" stopOpacity=".9" /><stop offset="1" stopColor="#CFC8F5" stopOpacity="0" /></radialGradient>
      <radialGradient id="hopeglow"><stop offset="0" stopColor="#F5F9C0" stopOpacity=".95" /><stop offset=".5" stopColor="#D6E69A" stopOpacity=".35" /><stop offset="1" stopColor="#D6E69A" stopOpacity="0" /></radialGradient>
    </defs>
  )
}

/* standalone icon preview used in cards */
export function PlantPreview({ id, stage, size = 120 }: { id: EmotionId; stage: number; size?: number }) {
  const wide = 104, tall = 124
  return (
    <svg viewBox={`${-wide / 2} -114 ${wide} ${tall}`} width={size} height={(size * tall) / wide} style={{ overflow: 'visible' }} aria-hidden>
      <PlantDefs />
      <g transform={id === 'loneliness' ? 'scale(.68)' : undefined}><PlantArt id={id} stage={stage} /></g>
    </svg>
  )
}
