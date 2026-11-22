export type EmotionId =
  | 'joy' | 'calm' | 'sadness' | 'anxiety' | 'anger' | 'tiredness'
  | 'loneliness' | 'excitement' | 'gratitude' | 'confusion' | 'hope' | 'neutral'

export interface Emotion {
  id: EmotionId
  label: string
  species: string
  color: string
  deep: string
  meaning: string
  poem: string
  glows?: boolean
}

export const EMOTIONS: Emotion[] = [
  { id: 'joy', label: 'Joy', species: 'Sunflower', color: '#E9B949', deep: '#B8862B',
    meaning: 'Warmth turned toward the light',
    poem: 'It follows the sun on slow afternoons, and turns to you when you laugh.' },
  { id: 'calm', label: 'Calm', species: 'Lavender', color: '#A99BCB', deep: '#7B6BA3',
    meaning: 'A held breath, finally let go',
    poem: 'It smells like the hour after rain, when nothing is asked of you.' },
  { id: 'sadness', label: 'Sadness', species: 'Bluebell', color: '#7F9FD0', deep: '#5576A8',
    meaning: 'Soft weight, carried gracefully',
    poem: 'It bows its head, and is no less beautiful for it. Rain is simply how it drinks.' },
  { id: 'anxiety', label: 'Anxiety', species: 'Unfurling Fern', color: '#6E9C74', deep: '#4B7552',
    meaning: 'Delicate things, reaching in many directions',
    poem: 'It unrolls one small curl at a time. There is no hurry in a fern.' },
  { id: 'anger', label: 'Anger', species: 'Red Poppy', color: '#C85A45', deep: '#8F3326',
    meaning: 'Bold, honest, and brief in bloom',
    poem: 'It does not apologise for its colour. Something mattered, and the garden knows.' },
  { id: 'tiredness', label: 'Tiredness', species: 'Moonflower', color: '#DAD6F0', deep: '#9E97CC', glows: true,
    meaning: 'Opens only when the world has gone quiet',
    poem: 'It waits for the dark to bloom. Rest is also a way of growing.' },
  { id: 'loneliness', label: 'Loneliness', species: 'Lone Blossom Tree', color: '#E8BDB3', deep: '#C48B80',
    meaning: 'Solitary, and still in full flower',
    poem: 'It stands apart in the open field, and the whole sky is its company.' },
  { id: 'excitement', label: 'Excitement', species: 'Windflower Cosmos', color: '#E98F6F', deep: '#B9603F',
    meaning: 'Restless petals, always about to dance',
    poem: 'It cannot hold still. Every breeze is an invitation.' },
  { id: 'gratitude', label: 'Gratitude', species: 'Daisy Cluster', color: '#F4EDDC', deep: '#C9B98B',
    meaning: 'Small, plentiful, and easy to overlook',
    poem: 'They grow where you stop to notice. Count them, and there are always more.' },
  { id: 'confusion', label: 'Confusion', species: 'Wandering Vine', color: '#B497B5', deep: '#8A6E8C',
    meaning: 'Curving, branching, finding its own way',
    poem: 'It takes the long way round, and sometimes the long way is the only way.' },
  { id: 'hope', label: 'Hope', species: 'Glimmer Seedling', color: '#D6E69A', deep: '#9DB45A', glows: true,
    meaning: 'A small light that insists on morning',
    poem: 'Barely taller than a thumb, and already glowing. It knows something we have forgotten.' },
  { id: 'neutral', label: 'Neutral', species: 'Soft Hosta', color: '#8FAE8B', deep: '#68896A',
    meaning: 'Plain green, plainly welcome',
    poem: 'Not every day needs a bloom. Leaves are enough, and they keep the rain off the soil.' },
]

export const EMO: Record<EmotionId, Emotion> = Object.fromEntries(EMOTIONS.map(e => [e.id, e])) as Record<EmotionId, Emotion>

export const STAGES = ['Seed', 'Sprout', 'Bud', 'Bloom', 'Mature'] as const
const THRESH = [0, 1, 2.2, 3.6, 5.6]
export const stageOf = (g: number) => {
  let s = 0
  THRESH.forEach((t, i) => { if (g >= t) s = i })
  return s
}

export const PROMPTS = [
  'What is something that felt lighter today?',
  'What would you like to leave behind for tonight?',
  'Was there a tiny moment you would like to remember?',
  'What do you need a little more of?',
  'What made you smile unexpectedly?',
  'If today’s feeling were a weather pattern, what would it be?',
  'What would you tell yourself if you were your own friend?',
  'What are you making space for?',
  'What is something you handled, even if imperfectly?',
]

export const DISCOVERIES = [
  { id: 'silver-seed', name: 'A little silver seed', text: 'You found it beneath the old oak. Nobody knows what it will grow into.' },
  { id: 'blue-shell', name: 'A pale blue shell', text: 'It sits in the grass, miles from any sea. It hums if you hold it close.' },
  { id: 'mossy-stone', name: 'A stone with a heart of moss', text: 'Someone, once, set it here on purpose. It has been waiting for you to notice.' },
  { id: 'sea-glass', name: 'A piece of green sea glass', text: 'Smoothed by someone else’s ocean. It somehow ended up here, and it seems content.' },
  { id: 'old-key', name: 'A tiny brass key', text: 'It fits nothing in the garden. Perhaps it fits something in you.' },
  { id: 'feather', name: 'A wren’s feather', text: 'Left on the bench, like a note that says only: thank you.' },
  { id: 'speckled-mushroom', name: 'A speckled mushroom ring', text: 'The mushrooms grew overnight in a perfect circle. The garden keeps small secrets.' },
]

export const COMPANIONS = [
  { id: 'butterfly', name: 'Meadow Butterfly', text: 'Drifts between whatever is blooming. Rarely lands twice in one place.' },
  { id: 'bird', name: 'Little Wren', text: 'Prefers the bench, and has opinions about the weather.' },
  { id: 'frog', name: 'Pond Frog', text: 'Sits perfectly still on its lily pad, and says very little.' },
  { id: 'snail', name: 'Garden Snail', text: 'In no hurry. Has never once been late.' },
  { id: 'hedgehog', name: 'Shy Hedgehog', text: 'Visits in spring and autumn, and only if nobody makes a fuss.' },
  { id: 'rabbit', name: 'Meadow Rabbit', text: 'Appears at the edge of things when the days are warm.' },
  { id: 'moth', name: 'Window Moth', text: 'Comes after dark, and keeps the house company.' },
]
