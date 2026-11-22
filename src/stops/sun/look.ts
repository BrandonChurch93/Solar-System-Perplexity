import type { CoronaLook } from './corona'
import type { GlobeLook } from './globe'
import type { ProminenceLook } from './prominence'
import type { SkyCardDef } from './skycard'
import type { GroundLook, SeetheLook } from './ground'
import type { FringeLook } from './fringe'
import type { KnotsLook, LoopsLook } from './loops'
import type { FlareLook } from './flare'
import { config } from '../../config'
import { stage } from './stage'
import fit from './fit.json'

const distance = Math.hypot(fit.camera.position[0]!, fit.camera.position[1]!, fit.camera.position[2]!)

export const globe: GlobeLook = {
  limb: [0.33, 0.36],
  rim: { color: [0.9, 0.42, 0.08], width: 0.09, power: 2, by: [0, 0.0625, 0.045, 0.1] },
  boil: { reach: 0.0005, period: 2.6, step: 0.012, max: 0.003, quiet: [0.07, 0.14] as [number, number] },
  hot: { from: 3.2, to: 4.9, boost: 2.2 },
  pulse: { amount: 0.2, rate: 2.3, from: 0.55, to: 0.8 },
  cell: { amount: 0.55, rate: 0.6, scale: 26, fine: 0.7 },
}

export const corona: CoronaLook = {
  inner: 1,
  outer: 3,
  gain: 1,
  edge: 0.002,
  wave: { amount: 1.8, scale: 5, speed: 0.55, sway: 0.0024 },
  drift: 0.0008,
  hide: { from: 0.3, to: 0.9, amount: 0.92 },
}

export const prominence: ProminenceLook = {
  half: 1.56,
  plane: 1 / distance,
  gain: 1,
  speed: 0.004,
  period: 2.4,
  surge: 0.6,
}

export const sky: SkyCardDef = { file: 'sky-hold.webp', vfovDeg: fit.vfovDeg, margin: 0.3, gain: 1 }

export const skyFade: [number, number] = [0.02, 0.34]

export const leave = {
  over: [0.01, 0.4] as [number, number],
  open: 4,
  wash: [0.1, 0.4] as [number, number],
  pale: [2.76, 1.37, 0.52] as [number, number, number],
  plate: [0.25, 0.8] as [number, number],
  gone: 0.55,
  cap: 1.5,
  corona: 2.2,
  edge: 0.06,
  tuck: [0.01, 0.05] as [number, number],
  veil: 10,
  ceil: 0.6,
  soft: 12,
  hue: [1, 0.78, 0.45] as [number, number, number],
  shade: [0.5, 1.5] as [number, number],
  fit: [0.01, 0.378] as [number, number],
  burn: { over: [0.01, 0.36] as [number, number], wide: 5, level: 3, cover: 0, hot: [1, 0.6, 0.25] as [number, number, number] },
}

export const ground: GroundLook = {
  cap: 63,
  rings: 252,
  sectors: 288,
  cell: 0.16,
  apron: { amount: 1, cell: 0.1, calm: 0, out: [-1, -0.1], edge: [0.4, 2] },
  band: [3.4, 2.6],
  own: { ring: [3.6, 4], side: 0.1, near: 0.3, up: [3, 3.9], rough: [0.35, 1.3] },
  lift: [0.1, 0.4],
  even: { from: [2, 3.4], tint: [0.78, 0.9, 0.98], far: [3.5, 3.9], dim: 0.87 },
  glowReach: [3.5, 4.3],
  site: [0.85, 1.9],
  field: { grid: 1.6, sharp: 6 },
  glow: [0.22, 4.3],
  boil: { reach: 0.25, period: 4.2, step: 0.3, max: 0.035 },
  twinkle: { amount: 0.3, rate: 0.4, spread: 4 },
  inflow: { amount: 0.3, waves: 5, rate: 2.2, inner: 1, outer: 2.6 },
}

export const fringe: FringeLook = { reachDeg: 3.0, gain: 1, flicker: { amount: 0.3, rate: 2.6, stretch: 0.22 } }

export const loops: LoopsLook = {
  grid: [160, 96],
  lean: { outerDeg: 22, innerDeg: -28, from: 1.3, to: 2.55, late: [-24, -42] },
  gain: 1,
  far: 9, pin: { from: 0.1, soft: 0.2, lowDeg: 0.2, highDeg: 3 },
  flow: { amount: 0.55, lanes: 0.12, along: 1.5, speed: 0.12, back: 0.07, floor: 0.25, inside: [1.9, 2.4], from: [0.02, 0.1] },
  swell: { amount: 1.6, speed: 0.42, width: 0.075, lanes: 0.5, calm: 0.45 },
  burst: { surge: 26, floor: 0.12, reach: [0.03, 0.55], other: 0.6, white: 0.5, from: 0.03 },
}

const hook = config.raw.film.hookSeconds

export const opening: KnotsLook & { fade: [number, number]; seethe: SeetheLook } = {
  fade: [2.05, 2.85],
  knots: { amount: 5, speed: 0.5, every: 0.9, width: 0.05, jitter: 0.25, white: 0.4, inside: [1.9, 2.2], lanes: [4, 1.7], lead: 0.2, pick: [0.25, 0.4, 0.75, 0.2], ends: [0.02, 0.1] },
  feet: { amount: 1.2, reach: 0.1, over: 0.14, lane: 1.5, ground: 1.2 },
  surge: { from: 0.05 * hook, land: 0.75 * hook, lead: 0.1, rise: 0.1 * hook, fade: 0.47 * hook, amount: 5.5, width: 0.07, tail: 0.2, ragged: 0.08, white: 0.35, halo: 0.24, level: 5, lanes: [0.6, 0.45, 1.1], glow: [1, 0.55, 0.2], core: [0.3, 0.05], inner: [1.8, 2.3, 0.75], crest: [0.45, 1.35], launch: 0.7, flare: 6, peak: 0.09 * hook, early: 0.05 * hook, end: 1.4 * hook, settle: 0.25 * hook, ground: 1.6, reach: 0.5, knee: 1, bloom: 0.08, veil: [0.1, 0.06, 0.022], keep: 0.18 * hook, hold: [0.22, 0.25, 0.3], ends: [0.03, 0.2], grow: [0.22, 0.83 * hook], kick: 4 },
  erupt: { from: 0.45 * hook, top: 0.3, time: 0.14 * hook, lean: 0.7, far: 0.08, lanes: 2.5, pick: [1, 1.16], outer: [1.47, 1.65, 1], gate: [1.24, 1.36, 1.84, 1.98], gain: [0.9, 1.6], erode: 0.9, thin: 2, fade: [0.2, 0.36], tear: [0.3, 0.5, 0.07], flash: { at: 0.42 * hook, peak: 0.05 * hook, ease: 0.017 * hook, amount: 8, width: 0.13, white: 0.6, wide: 0.5, haze: 0.9, level: 7.5, lane: [1.7, 0.22], tint: [1, 0.82, 0.55], ground: 1.6, veil: 0.12, span: 0.8 } },
  seethe: { amount: 1, rate: 2, spread: 4, near: [2.2, 4.5], far: 0.3, crown: [0.85, 1.25] },
}

export const skyTerrain: SkyCardDef = { file: 'sky-terrain.webp', vfovDeg: 55, margin: 0.25, gain: 1, centre: stage.skyCentre, edge: 0.05, floor: [0.22, 0.34] }

export const files = { wrap: 'wrap-color.jpg', corona: 'corona.webp', prominence: 'prominence.png', prominenceFlow: 'prominence-flow.png', plate: 'plate.jpg', apron: 'apron.jpg', field: 'field.jpg', loops: 'loops.webp', loopsGlow: 'loops-glow.png', haze: 'haze.png', grade: 'grade.png' }

export const flare: FlareLook & { at: number; lift: number; ground: number; loops: number; cut: number } = {
  hot: [1, 0.7, 0.34],
  warm: [1, 0.38, 0.09],
  core: { radius: 0.3, gain: 1.3, power: 2 },
  halo: { radius: 1.1, gain: 0.4, power: 2 },
  veil: 0.35,
  at: 0.03,
  before: 0.28,
  after: 0.28,
  powerIn: 1.5,
  powerOut: 1.5,
  lift: 0.12,
  ground: 1.5,
  loops: 0.15,
  cut: 0.2,
}

export const dissolve = {
  loops: [0.25, 0.9] as [number, number],
  lean: [-0.6, 0.15] as [number, number],
  cut: 0.12,
  ground: [0.1, 0.75] as [number, number],
  site: [0.4, 0.97] as [number, number],
  lit: { amount: 0.3, over: [-0.25, 0.4] as [number, number] },
  fringe: [0.1, 0.6] as [number, number],
  sky: [0.1, 0.7] as [number, number],
  corona: [0.1, 0.8] as [number, number],
  match: [0.6, 2] as [number, number],
  tint: [0.77, 0.69, 0.65] as [number, number, number],
  calm: { knee: [0.8, 0.5, 0.22] as [number, number, number], press: 0.85 },
  glow: 0.5,
}
