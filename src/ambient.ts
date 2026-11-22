import { audioCtx } from './sound'

/* Ambient garden sound, synthesised live (no audio files): wind, rain, a trickle of water,
   birds by day, crickets and an owl at night. It only runs after the user turns sound on. */

export interface AmbientState { on: boolean; volume: number; daylight: number; weather: string; season: string }

let graph: null | {
  ctx: AudioContext; master: GainNode; wind: GainNode; rain: GainNode; water: GainNode; sources: AudioScheduledSourceNode[]; timers: number[]; state: AmbientState
} = null

function noise(ctx: AudioContext) {
  const len = ctx.sampleRate * 3, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0)
  let b0 = 0, b1 = 0, b2 = 0
  for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b0 = .99765 * b0 + w * .099046; b1 = .963 * b1 + w * .2965164; b2 = .57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * .1848) * .2 }
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; return src
}

function layer(ctx: AudioContext, master: GainNode, sources: AudioScheduledSourceNode[], filters: BiquadFilterNode[]) {
  const n = noise(ctx); const g = ctx.createGain(); g.gain.value = 0
  let node: AudioNode = n; filters.forEach(f => { node.connect(f); node = f }); node.connect(g); g.connect(master); n.start(); sources.push(n); return g
}

function lfo(ctx: AudioContext, rate: number, depth: number, target: AudioParam, sources: AudioScheduledSourceNode[]) {
  const o = ctx.createOscillator(); o.frequency.value = rate; const g = ctx.createGain(); g.gain.value = depth; o.connect(g); g.connect(target); o.start(); sources.push(o)
}

function chirp(ctx: AudioContext, master: GainNode, when: number, f0: number, f1: number, dur: number, vol: number) {
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'
  o.frequency.setValueAtTime(f0, when); o.frequency.exponentialRampToValueAtTime(f1, when + dur)
  g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(vol, when + dur * .25); g.gain.exponentialRampToValueAtTime(0.0001, when + dur)
  o.connect(g); g.connect(master); o.start(when); o.stop(when + dur + .05)
}

function birdCall() {
  if (!graph) return
  const { ctx, master, state } = graph, vol = .05 * state.daylight * (state.weather === 'rain' ? .3 : 1) * (state.season === 'winter' ? .35 : 1)
  if (vol > .004) {
    const t = ctx.currentTime + .05, base = 1900 + Math.random() * 1700, n = 2 + Math.floor(Math.random() * 4), kind = Math.random()
    for (let i = 0; i < n; i++) {
      const w = t + i * (kind < .5 ? .13 : .2)
      if (kind < .5) chirp(ctx, master, w, base, base * 1.35, .09, vol)
      else { chirp(ctx, master, w, base * .8, base * 1.5, .14, vol); chirp(ctx, master, w + .06, base * 1.5, base, .1, vol * .7) }
    }
  }
  graph.timers.push(window.setTimeout(birdCall, 2500 + Math.random() * 6000))
}

function cricketCall() {
  if (!graph) return
  const { ctx, master, state } = graph, vol = .018 * Math.max(0, state.daylight < .5 ? 1 - state.daylight * 1.4 : 0) * (state.weather === 'rain' || state.season === 'winter' ? 0 : 1)
  if (vol > .002) {
    const t = ctx.currentTime + .02, f = 4100 + Math.random() * 500
    for (let i = 0; i < 4; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f
      const w = t + i * .075; g.gain.setValueAtTime(0.0001, w); g.gain.exponentialRampToValueAtTime(vol, w + .012); g.gain.exponentialRampToValueAtTime(0.0001, w + .05)
      o.connect(g); g.connect(master); o.start(w); o.stop(w + .07)
    }
  }
  graph.timers.push(window.setTimeout(cricketCall, 550 + Math.random() * 700))
}

function owlCall() {
  if (!graph) return
  const { ctx, master, state } = graph
  if (state.daylight < .28 && state.weather !== 'rain') {
    const t = ctx.currentTime + .1
    ;[0, .55, 1.3].forEach((d, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter(); o.type = 'sine'; f.type = 'lowpass'; f.frequency.value = 600
      o.frequency.setValueAtTime(i === 2 ? 340 : 300, t + d); o.frequency.exponentialRampToValueAtTime(i === 2 ? 250 : 270, t + d + .36)
      g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(.05, t + d + .08); g.gain.exponentialRampToValueAtTime(0.0001, t + d + .4)
      o.connect(f); f.connect(g); g.connect(master); o.start(t + d); o.stop(t + d + .45)
    })
  }
  graph.timers.push(window.setTimeout(owlCall, 14000 + Math.random() * 16000))
}

function applyState() {
  if (!graph) return
  const { ctx, master, wind, rain, water, state } = graph, t = ctx.currentTime
  const w = state.weather
  master.gain.setTargetAtTime(state.on ? state.volume * .9 : 0, t, .6)
  wind.gain.setTargetAtTime(.1 + (w === 'wind' ? .5 : 0) + (w === 'clouds' || w === 'snow' ? .12 : 0) + (state.season === 'autumn' ? .05 : 0), t, 1.5)
  rain.gain.setTargetAtTime(w === 'rain' ? .42 : 0, t, 1.5)
  water.gain.setTargetAtTime(.05 + (w === 'mist' ? .02 : 0), t, 1.5)
}

export function setAmbient(state: AmbientState) {
  const want = state.on && state.volume > 0
  if (!want) {
    if (graph) {
      const g = graph; g.master.gain.setTargetAtTime(0, g.ctx.currentTime, .3); graph = null
      g.timers.forEach(clearTimeout); window.setTimeout(() => { g.sources.forEach(s => { try { s.stop() } catch { /* already stopped */ } }); g.master.disconnect() }, 900)
    }
    return
  }
  if (!graph) {
    const ctx = audioCtx(); if (!ctx) return
    const master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination)
    const sources: AudioScheduledSourceNode[] = []
    const lp = (f: number) => { const x = ctx.createBiquadFilter(); x.type = 'lowpass'; x.frequency.value = f; return x }
    const hp = (f: number) => { const x = ctx.createBiquadFilter(); x.type = 'highpass'; x.frequency.value = f; return x }
    const bp = (f: number, q: number) => { const x = ctx.createBiquadFilter(); x.type = 'bandpass'; x.frequency.value = f; x.Q.value = q; return x }
    const wind = layer(ctx, master, sources, [lp(520)]); lfo(ctx, .11, .06, wind.gain, sources)
    const rain = layer(ctx, master, sources, [hp(900), lp(7500)])
    const water = layer(ctx, master, sources, [bp(1900, .7)]); lfo(ctx, .35, .02, water.gain, sources)
    graph = { ctx, master, wind, rain, water, sources, timers: [], state }
    graph.timers.push(window.setTimeout(birdCall, 1200), window.setTimeout(cricketCall, 800), window.setTimeout(owlCall, 6000))
  }
  graph.state = state; applyState()
}

/* pause the whole ambient bed while the tab is hidden */
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (!graph) return; if (document.hidden) void graph.ctx.suspend(); else void graph.ctx.resume() })
