import type { CoronaLook } from './corona'
import type { GlobeLook } from './globe'
import type { ProminenceLook } from './prominence'
import type { SkyCardDef } from './skycard'
import type { GroundLook } from './ground'
import type { FringeLook } from './fringe'
import type { LoopsLook } from './loops'
import { stage } from './stage'
import fit from './fit.json'

const distance = Math.hypot(fit.camera.position[0]!, fit.camera.position[1]!, fit.camera.position[2]!)

export const globe: GlobeLook = {
  limb: [0.33, 0.36],
  rim: { color: [0.9, 0.42, 0.08], width: 0.09, power: 2 },
  boil: { reach: 0.0012, period: 3.2, step: 0.012, max: 0.005 },
  hot: { from: 3.2, to: 4.9, boost: 2.2 },
  pulse: { amount: 0.16, rate: 1.9, from: 0.55, to: 0.8 },
  cell: { amount: 0.1, rate: 1.4, level: 1.6, spread: 60 },
}

export const corona: CoronaLook = {
  inner: 1,
  outer: 3,
  gain: 1,
  edge: 0.004,
  wave: { amount: 0.5, scale: 3, speed: 0.22, sway: 0.0012 },
  drift: 0.0004,
}

export const prominence: ProminenceLook = {
  half: 1.56,
  plane: 1 / distance,
  gain: 1,
  speed: 0.0032,
  period: 3,
  surge: 0.3,
}

export const sky: SkyCardDef = { file: 'sky-hold.webp', vfovDeg: fit.vfovDeg, margin: 0.125, gain: 1 }

export const skyFade: [number, number] = [0.02, 0.34]

export const ground: GroundLook = {
  cap: 42,
  rings: 168,
  sectors: 288,
  cell: 0.16,
  band: [2.2, 1.2],
  glow: [0.22, 4.3],
  boil: { reach: 0.5, period: 2.6, step: 0.3, max: 0.14 },
  twinkle: { amount: 0.16, rate: 2.4, spread: 60 },
  inflow: { amount: 0.3, waves: 5, rate: 2.2, inner: 1, outer: 2.6 },
}

export const fringe: FringeLook = { reachDeg: 3.0, gain: 1, flicker: { amount: 0.3, rate: 2.6, stretch: 0.22 } }

export const loops: LoopsLook = {
  grid: [160, 96],
  lean: { outerDeg: 22, innerDeg: -28, from: 1.3, to: 2.55 },
  gain: 1,
  far: 9, pin: { from: 0.1, soft: 0.2, lowDeg: 0.2, highDeg: 3 },
  flow: { amount: 0.55, lanes: 0.3, along: 1.5, speed: 0.12, back: 0.07, floor: 0.2 },
}

export const skyTerrain: SkyCardDef = { file: 'sky-terrain.webp', vfovDeg: 55, margin: 0.25, gain: 1, centre: stage.skyCentre, edge: 0.05 }

export const files = { wrap: 'wrap-color.jpg', corona: 'corona.webp', prominence: 'prominence.png', prominenceFlow: 'prominence-flow.png', plate: 'plate.jpg', loops: 'loops.webp', loopsGlow: 'loops-glow.png' }
