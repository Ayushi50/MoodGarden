/* Opt-in only. Nothing plays until the user turns sound on, and only in response to taps. */
let ctx: AudioContext | null = null
let enabled = false
export const setSound = (on: boolean) => { enabled = on }

const SCALE = [0, 2, 4, 7, 9, 12, 14]
export function chime(step = 0, vol = 0.05) {
  if (!enabled) return
  try {
    ctx = ctx || new AudioContext()
    const t = ctx.currentTime
    const f = 392 * Math.pow(2, SCALE[step % SCALE.length] / 12)
    const o = ctx.createOscillator(); const g = ctx.createGain()
    o.type = 'sine'; o.frequency.value = f
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6)
    o.connect(g).connect(ctx.destination)
    o.start(t); o.stop(t + 1.7)
  } catch { /* audio unavailable */ }
}

/* shared context for the ambient layer; only ever created after the user turns sound on */
export function audioCtx(): AudioContext | null {
  if (!enabled) return null
  try { ctx = ctx || new AudioContext(); if (ctx.state === 'suspended') void ctx.resume(); return ctx } catch { return null }
}
