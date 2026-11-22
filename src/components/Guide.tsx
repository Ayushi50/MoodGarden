import { ReactNode, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PlantPreview } from '../garden/PlantArt'
import { DecorArt } from '../garden/Decor'
import { STAGES } from '../data/emotions'
import { Sheet } from './Panels'

const Bloom = ({ size = 70 }: { size?: number }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
    {[0, 1, 2, 3, 4, 5].map(i => <ellipse key={i} cx="32" cy="17" rx="6.5" ry="11" transform={`rotate(${i * 60} 32 32)`} fill={['#FBE3E8', '#FFF4D2', '#F7D4DC', '#FFF4D2', '#FBE3E8', '#F7D4DC'][i]} stroke="#d9a9b5" strokeOpacity=".6" />)}
    <circle cx="32" cy="32" r="7.5" fill="#F0C65A" />
  </svg>
)
const FeelBtn = () => (
  <span style={{ width: 70, height: 70, borderRadius: '50%', border: '4px solid #F7F0DF', background: 'radial-gradient(circle at 35% 28%, #A9CC8E, #5E7D4F 72%)', display: 'grid', placeItems: 'center', boxShadow: '0 8px 18px rgba(40,60,30,.4)' }}><Bloom size={46} /></span>
)

interface Step { title: string; lead: string; body: ReactNode; art: ReactNode; cta?: { label: string; go: string } }

const STEPS: Step[] = [
  {
    title: 'Welcome to your garden',
    lead: 'A quiet place that grows with how you feel.',
    body: <p>There is nothing to win. No streaks, no scores, and nothing wilts while you are away. Visit for a minute or an hour. The garden simply makes room for whatever you bring.</p>,
    art: <div className="g-art"><PlantPreview id="hope" stage={4} size={90} /><PlantPreview id="calm" stage={4} size={90} /><PlantPreview id="gratitude" stage={4} size={90} /></div>,
  },
  {
    title: 'Plant a feeling',
    lead: 'This is the one thing to try first.',
    body: <ol><li>Tap the round flower button at the bottom, <b>“How are you feeling?”</b></li><li>Tap every feeling that is true. You can pick several, and tap again to let one go.</li><li>Tap the little petals under a feeling to say how strongly.</li><li>Add a few words and a photo if you want, or skip them.</li><li>Each feeling becomes a seed in the meadow.</li></ol>,
    art: <div className="g-art"><FeelBtn /><span className="g-arrow">→</span><PlantPreview id="joy" stage={0} size={70} /></div>,
    cta: { label: 'Plant a feeling now', go: 'checkin' },
  },
  {
    title: 'Watch it grow',
    lead: 'Plants grow slowly, in their own time.',
    body: <p>A seed becomes a sprout, a bud, a bloom, and finally a mature plant. Time, new check-ins and a little watering all help. <b>Tap any plant</b> to read what it means and when it was planted. To water, tap the <b>watering can</b> (lower left), then tap the plants you want to water.</p>,
    art: <div className="g-art stages">{STAGES.map((s, i) => <div key={s}><PlantPreview id="sadness" stage={i} size={54} /><small>{s}</small></div>)}</div>,
  },
  {
    title: 'Tap things to explore',
    lead: 'Almost everything in the garden does something.',
    body: <ul className="g-list">
      <li><b>The cottage</b> opens your journal.</li><li><b>The fountain</b> is a calm breathing exercise.</li>
      <li><b>The big tree</b> keeps your memories as blossoms and lanterns.</li><li><b>The mailbox</b> holds letters, including ones to your future self.</li>
      <li><b>The bench</b> offers a quiet thought.</li><li><b>The greenhouse</b> shows every plant you have grown.</li>
      <li><b>The gate</b> opens Explore, with more places and activities.</li><li><b>Visitors</b> (butterflies, a wren, a frog, a snail) can be tapped. Small things on the ground can be gathered.</li>
    </ul>,
    art: <div className="g-art"><svg viewBox="0 0 120 70" width="150" height="88" aria-hidden><path d="M10 60 L60 8 L110 60Z" fill="#B0715A" /><rect x="22" y="44" width="76" height="22" fill="#F2E6CC" /><path d="M52 66 V48 Q60 38 68 48 V66Z" fill="#7B9A74" /><rect x="30" y="50" width="12" height="10" fill="#FFE6A0" /><rect x="78" y="50" width="12" height="10" fill="#FFE6A0" /></svg></div>,
  },
  {
    title: 'Make it yours',
    lead: 'Decorate, arrange and play, only if you feel like it.',
    body: <p>Open <b>Explore</b> (bottom right) for gentle things to do: plant a seed exactly where you like, decorate with lanterns, pots and paths, arrange a bouquet, doodle in the sketchbook, or play with drifting petals. Small gifts turn up now and then, with no grinding.</p>,
    art: <div className="g-art"><svg viewBox="-40 -90 80 100" width="52" height="66"><DecorArt kind="lantern" night={false} /></svg><svg viewBox="-40 -90 80 100" width="52" height="66"><DecorArt kind="pot" night={false} /></svg><svg viewBox="-40 -90 80 100" width="52" height="66"><DecorArt kind="fountain" night={false} /></svg><svg viewBox="-40 -90 80 100" width="52" height="66"><DecorArt kind="signpost" night={false} /></svg></div>,
    cta: { label: 'Open Explore', go: 'explore' },
  },
  {
    title: 'The garden has moods too',
    lead: 'It follows your real time of day.',
    body: <p>Morning light, golden hour, lamps at dusk and fireflies at night all match the time where you are. Tap <b>Atmosphere</b> (top right) to change the weather or season, set the hour yourself, turn on gentle sound (off until you ask), or reduce motion.</p>,
    art: <div className="g-art"><svg viewBox="0 0 150 60" width="200" height="80" aria-hidden><circle cx="30" cy="34" r="14" fill="#F6D880" /><circle cx="75" cy="34" r="14" fill="#F2A25A" /><circle cx="120" cy="34" r="14" fill="#E8E4F4" /><circle cx="126" cy="30" r="12" fill="#4a5a94" /></svg></div>,
  },
  {
    title: 'Keep what matters',
    lead: 'Everything stays on your device, and is yours alone.',
    body: <p>The <b>Journal</b> collects your check-ins as a timeline, a flower calendar and a monthly scrapbook. The <b>Memories</b> tab hangs moments on the tree, and you can edit or remove them any time. Letters can be sealed until a future date. Nothing leaves this device.</p>,
    art: <div className="g-art"><PlantPreview id="loneliness" stage={4} size={96} /></div>,
  },
]

export function GuideSheet({ onClose, onTry, first }: { onClose: () => void; onTry: (go: string) => void; first: boolean }) {
  const [i, setI] = useState(0)
  const [tab, setTab] = useState<'tour' | 'tips'>('tour')
  const st = STEPS[i]; const last = i === STEPS.length - 1
  return (
    <Sheet onClose={onClose} narrow label="How to play">
      <div className="eyebrow">How to play</div>
      <div className="tabs" style={{ margin: '4px 0 14px' }}>
        <button className={`tab ${tab === 'tour' ? 'on' : ''}`} onClick={() => setTab('tour')}>Guided tour</button>
        <button className={`tab ${tab === 'tips' ? 'on' : ''}`} onClick={() => setTab('tips')}>Quick tips</button>
      </div>
      {tab === 'tour' ? (
        <>
          <AnimatePresence mode="wait">
            <motion.div key={i} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: .22 }} className="g-step">
              {st.art}
              <h2 style={{ fontSize: 26 }}>{st.title}</h2>
              <p className="lede" style={{ marginBottom: 10 }}>{st.lead}</p>
              <div className="g-body">{st.body}</div>
              {st.cta && <button className="btn" style={{ marginTop: 14 }} onClick={() => onTry(st.cta!.go)}>{st.cta.label}</button>}
            </motion.div>
          </AnimatePresence>
          <div className="row spread" style={{ marginTop: 20 }}>
            <button className="btn ghost" onClick={() => (i === 0 ? onClose() : setI(i - 1))}>{i === 0 ? (first ? 'Skip' : 'Close') : 'Back'}</button>
            <div className="g-dots" aria-label={`Step ${i + 1} of ${STEPS.length}`}>{STEPS.map((_, k) => <i key={k} className={k === i ? 'on' : ''} onClick={() => setI(k)} />)}</div>
            <button className="btn" onClick={() => (last ? onClose() : setI(i + 1))}>{last ? 'Start playing' : 'Next'}</button>
          </div>
        </>
      ) : (
        <div className="g-body">
          <h2 style={{ fontSize: 26 }}>Quick tips</h2>
          <ul className="g-list">
            <li><b>There is no wrong way to play.</b> Skip anything. Nothing is required, and nothing is timed.</li>
            <li><b>Tap anything that glows</b> when you hover over it. The name appears above the menu bar.</li>
            <li><b>Plants never die.</b> Heavy feelings grow beautiful plants too, like bluebells and ferns.</li>
            <li><b>On a phone,</b> drag the scene sideways to look around the garden.</li>
            <li><b>Press Esc</b> or tap outside a card to close it.</li>
            <li><b>To place something,</b> pick it in Explore, then tap an empty spot on the grass. Tap a placed piece to pick it up again.</li>
            <li><b>Sharing this device?</b> Open <b>Atmosphere</b>, then the garden name, to give each person their own garden, and to back one up or restore it.</li>
            <li><b>Reopen this guide</b> any time with the <b>?</b> button at the top.</li>
          </ul>
        </div>
      )}
    </Sheet>
  )
}
