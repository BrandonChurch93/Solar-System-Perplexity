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

export const sky: SkyCardDef = { file: 'sky-hold.webp', vfovDeg: fit.vfovDeg, margin: 0.125, gain: 1 }

export const skyFade: [number, number] = [0.02, 0.34]

export const ground: GroundLook = {
  cap: 63,
  rings: 252,
  sectors: 288,
  cell: 0.16,
  apron: { amount: 1, cell: 0.1, calm: 0, out: [-1, -0.1] },
  band: [2.2, 1.2],
  glow: [0.22, 4.3],
  boil: { reach: 0.25, period: 2.6, step: 0.3, max: 0.06 },
  twinkle: { amount: 0.5, rate: 0.9, spread: 4 },
  inflow: { amount: 0.3, waves: 5, rate: 2.2, inner: 1, outer: 2.6 },
}

export const fringe: FringeLook = { reachDeg: 3.0, gain: 1, flicker: { amount: 0.3, rate: 2.6, stretch: 0.22 } }

export const loops: LoopsLook = {
  grid: [160, 96],
  lean: { outerDeg: 22, innerDeg: -28, from: 1.3, to: 2.55 },
  gain: 1,
  far: 9, pin: { from: 0.1, soft: 0.2, lowDeg: 0.2, highDeg: 3 },
  flow: { amount: 0.55, lanes: 0.12, along: 1.5, speed: 0.12, back: 0.07, floor: 0.25, inside: [1.9, 2.4], from: [0.02, 0.1] },
  swell: { amount: 1.6, speed: 0.42, width: 0.075, lanes: 0.5, calm: 0.45 },
  burst: { surge: 26, floor: 0.12, reach: [0.03, 0.55], other: 0.6, white: 0.5, from: 0.03 },
}

export const skyTerrain: SkyCardDef = { file: 'sky-terrain.webp', vfovDeg: 55, margin: 0.25, gain: 1, centre: stage.skyCentre, edge: 0.05 }

export const files = { wrap: 'wrap-color.jpg', corona: 'corona.webp', prominence: 'prominence.png', prominenceFlow: 'prominence-flow.png', plate: 'plate.jpg', apron: 'apron.jpg', loops: 'loops.webp', loopsGlow: 'loops-glow.png', grade: 'grade.png' }

export const flare: FlareLook & { lift: number; ground: number; loops: number; cut: number } = {
  hot: [1, 0.75, 0.4],
  warm: [1, 0.38, 0.09],
  core: { radius: [0.32, 0.6], gain: 5, power: 2.5 },
  halo: { radius: [0.7, 1.4], gain: 1.4, power: 1 },
  veil: 1.2,
  cover: { rise: [-0.45, -0.035], fall: [0.02, 0.45], power: 2 },
  before: 0.8,
  after: 0.9,
  powerIn: 2.5,
  powerOut: 2,
  lift: 0.12,
  ground: 3,
  loops: 0.5,
  cut: 0.2,
}
