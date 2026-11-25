import type { HazeParams } from '../../bodies/haze'
import fitted from './curve.json'
import hazeJson from './haze.json'
import holdMap from './hold.json'
import veilJson from './veil.json'

export const curve = fitted.curve
export const haze = hazeJson.ground as HazeParams
export const limb = hazeJson.limb

export const drift = {
  bandDegPerSecond: -0.55,
  flowDegPerSecond: -0.9,
  from: -14,
  to: 18,
  strength: 0.42,
  shadow: 0.22,
  shadowOffset: 0.012,
  riseAt: 0.75,
}

export const graze = { most: 3, from: 0.45, to: 0.2 }

export const lift = { floor: 0.012, stops: 3, from: 0.4, to: 0.8 }

export const descent = {
  high: 0.7,
  low: 0.05,
  tint: [0.9, 0.86, 0.8] as [number, number, number],
}

export interface Cell {
  lon: number
  lat: number
  radiusDeg: number
  painted: boolean
  period: number
  at: number
  gain: number
  seed: number
}

function seeded(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const PAINTED: Cell[] = [
  { lon: 23.33, lat: 17.8, radiusDeg: 6.5, painted: true, period: 1.9, at: 39.5, gain: 1, seed: 1 },
  { lon: 9.32, lat: 14.74, radiusDeg: 6.5, painted: true, period: 2.7, at: 39.5, gain: 1, seed: 2 },
]

// The time each seeded cell has its full flash. They are set so that the judged frame of the hold (39.5 s) shows each cell at the level it
// showed there under the first law of the flash (assets-src/venus/NOTES.md, MAIL 707, C).
const SEEDED_AT = [41.58, 41.75, 41.4, 39.98, 42.53, 43.12, 42.14, 40.54, 42.86, 39.72, 41.42, 40.23]

const SEEDED: Cell[] = Array.from({ length: 12 }, (_, i) => ({
  lon: 28 + 92 * seeded(i * 3 + 1),
  lat: -38 + 104 * seeded(i * 3 + 2),
  radiusDeg: 2.2 + 3.2 * seeded(i * 3 + 3),
  painted: false,
  period: 1.3 + 2.6 * seeded(i * 5 + 40),
  at: SEEDED_AT[i]!,
  gain: 0.35 + 0.65 * seeded(i * 5 + 42),
  seed: i + 3,
}))

export const cells: Cell[] = [...PAINTED, { lon: 32.04, lat: 54.69, radiusDeg: 1.6, painted: false, period: 2.3, at: 39.5, gain: 0.9, seed: 0 }, ...SEEDED]

export const shade = { far: 0.8, grad: 16, cap: 2.5 }

export const bloom = { hide: [0.12, 0.6, 0.9] as [number, number, number] }

export const mauve = { from: 0.98, to: 1.1, rest: 0.9 }

export const hold = { ...holdMap, base: 512, back: [-0.15, -0.03] as [number, number], weight: 1, near: [0.03, 0.06] as [number, number] }

export const swirl = { lon: -13, lat: 19, deg: 130, wideDeg: 12 }

export const weave = { ring: [0.26, 0.44, -0.2, -0.02] as [number, number, number, number], shift: 0.8, gain: 1, lit: 0.5, base: 128, cap: 2.5, rise: { lit: 1, flat: 1, foldDeg: 95, own: 48, tone: 0.4 } }

export const veil = {
  file: veilJson.file,
  pad: veilJson.pad,
  mean: veilJson.mean as [number, number, number],
  sheets: { lowest: 1e-5, step: 2.5, size: 3, near: [0.3, 1.1, 3] as [number, number, number], gamma: 1.6, top: veilJson.top, holes: [1.2, 0.5] as [number, number], deep: 0.85, edge: [0.65, 0.25] as [number, number], thin: 0.9, ramp: 1, fan: [12, 1.6, 2.7, 14] as [number, number, number, number], fray: [2.5, 0.4, 0.2, 2] as [number, number, number, number], pole: [0.12, 0.45] as [number, number], push: [0.4, 0.2] as [number, number], mist: [1, 0.85, 1, 16, 1, 0.7] as [number, number, number, number, number, number], wait: [0.5, 0.95] as [number, number], wave: 0.2, haze: 0.8, sunward: [3, 4] as [number, number], shift: [0.37, 0.61] as [number, number], dense: 0.8, ceiling: [0.05, 0.1] as [number, number], solid: [0.55, 1] as [number, number] },
  fog: [0.12, 2.6, 4] as [number, number, number],
  fogOrbit: [0.8, 0.4, 5] as [number, number, number],
  light: [-0.94, 0.34] as [number, number],
  lit: [0.34, 0.2, 0.07] as [number, number, number],
  litTerrain: [0.07, 0.052, 0.032] as [number, number, number],
  haze: [0.62, 0.45, 0.2] as [number, number, number],
  hazeTerrain: [0.22, 0.155, 0.08] as [number, number, number],
  edgePx: 1.5,
  sun: [0.5071, 0.2105] as [number, number],
  grade: { keep: 0.7, gamma: 1.3, pivot: 0.3, gain: 0.45, tint: [1, 0.93, 0.8] as [number, number, number] },
  sunFade: 2,
  sunSoft: 6,
  sunTint: [1.15, 0.97, 0.75] as [number, number, number],
  sunLift: 0.4,
}

export const motion = { from: 1, step: 6, most: 8, hidden: 0.95, smear: { from: 20, share: 0.4, most: 120 } }

export const boltColor: [number, number, number] = [0.105, 0.095, 0.14]

export const flashGain = 1

// The life of a flash, in seconds: it swells over rise, stands to hold and dies away over fall (or by rest before its cell's next one, when that
// comes sooner); both ends are eased, so no frame holds a step. lead is where in that life the time `at` of a cell lies (on the stand, so the
// judged frame of the hold shows the storm at full as before). A cell's flashes are not alike: each but the one at `at` has its own strength,
// from least to full, by its number.
export const flashLife = { lead: 0.5, rise: 0.4, hold: 0.6, fall: 1.1, rest: 0.02, least: 0.35 }

function ease(a: number, b: number, x: number): number {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

export function flash(c: Cell, time: number): number {
  const l = flashLife
  const x = time - c.at + l.lead
  const cycle = Math.floor(x / c.period)
  const s = x - cycle * c.period
  const level = ease(0, l.rise, s) * (1 - ease(l.hold, Math.min(l.hold + l.fall, c.period - l.rest), s))
  const share = cycle === 0 ? 1 : l.least + (1 - l.least) * seeded(c.seed * 17 + cycle * 3 + 5)
  return flashGain * c.gain * share * level
}

export const relief = {
  cell: 16,
  hazeDir: [-0.94, 0.34] as [number, number],
  hazeSpeed: 0.0025,
  flowSeconds: 3.3,
  swayRad: 0.005,
  swayPerSecond: 0.9,
  edgeDeg: 0.06,
  air: { azDeg: 80, elevDeg: 80, power: 0.5, below: [0.02, 0.013, 0.007] as [number, number, number], belowDeg: 2.5, holdDeg: 2, sunHideDeg: [2, 5, 15] as [number, number, number], cut: [0.015, 0.2, 0.92] as [number, number, number], gain: 1, deck: [[130, 103, 69], [194, 168, 125], [208, 183, 141], [232, 209, 168], [243, 222, 180], [247, 231, 199], [249, 237, 211], [251, 247, 231], [249, 237, 212], [237, 214, 172]] as [number, number, number][], deckSpanDeg: 45, deckHigh: [0.15, 0.4] as [number, number], rimDeg: 0.3 },
}
