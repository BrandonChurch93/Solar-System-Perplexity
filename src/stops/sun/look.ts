import type { CoronaLook } from './corona'
import type { GlobeLook } from './globe'
import type { ProminenceLook } from './prominence'
import type { SkyCardDef } from './skycard'
import type { GroundLook } from './ground'
import type { FringeLook } from './fringe'
import type { LoopsLook } from './loops'
import type { FlareLook } from './flare'
import { stage } from './stage'
import fit from './fit.json'

const distance = Math.hypot(fit.camera.position[0]!, fit.camera.position[1]!, fit.camera.position[2]!)

export const globe: GlobeLook = {
  limb: [0.33, 0.36],
  rim: { color: [0.9, 0.42, 0.08], width: 0.09, power: 2 },
  boil: { reach: 0.0018, period: 2.6, step: 0.012, max: 0.006 },
  hot: { from: 3.2, to: 4.9, boost: 2.2 },
  pulse: { amount: 0.2, rate: 2.3, from: 0.55, to: 0.8 },
  cell: { amount: 0.55, rate: 0.6, scale: 26, fine: 0.7 },
}

export const corona: CoronaLook = {
  inner: 1,
  outer: 3,
  gain: 1,
  edge: 0.004,
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

export const ground: GroundLook = {
  cap: 63,
  rings: 252,
  sectors: 288,
  cell: 0.16,
  apron: { amount: 1, cell: 0.1, calm: 0, out: [-1, -0.1] },
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

export const skyTerrain: SkyCardDef = { file: 'sky-terrain.webp', vfovDeg: 55, margin: 0.25, gain: 1, centre: stage.skyCentre, edge: 0.05, floor: [0.22, 0.34] }

export const files = { wrap: 'wrap-color.jpg', corona: 'corona.webp', prominence: 'prominence.png', prominenceFlow: 'prominence-flow.png', plate: 'plate.jpg', apron: 'apron.jpg', field: 'field.jpg', loops: 'loops.webp', loopsGlow: 'loops-glow.png', grade: 'grade.png' }

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
  glow: 0.5,
}
