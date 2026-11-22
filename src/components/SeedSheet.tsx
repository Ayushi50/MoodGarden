import { EMOTIONS, EmotionId } from '../data/emotions'
import { PlantPreview } from '../garden/PlantArt'
import { Sheet } from './Panels'

export function SeedSheet({ onClose, onPick }: { onClose: () => void; onPick: (id: EmotionId) => void }) {
  return (
    <Sheet onClose={onClose} label="Plant a seed">
      <div className="eyebrow">Plant a seed</div><h2>Which seed?</h2>
      <p className="lede">Choose one, then tap the meadow where you’d like it to grow.</p>
      <div className="grid2">
        {EMOTIONS.map(e => (
          <button key={e.id} className="pcard" style={{ all: 'unset', cursor: 'pointer' }} onClick={() => onPick(e.id)}>
            <div className="pcard"><div className="art" style={{ height: 96 }}><PlantPreview id={e.id} stage={3} size={70} /></div><h3>{e.species}</h3><div className="hint">{e.label}</div></div>
          </button>
        ))}
      </div>
    </Sheet>
  )
}
