import type { HazeParams } from '../../bodies/haze'
import fitted from './curve.json'
import hazeJson from './haze.json'

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
}

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

const SEEDED: Cell[] = Array.from({ length: 12 }, (_, i) => ({
  lon: 28 + 92 * seeded(i * 3 + 1),
  lat: -38 + 104 * seeded(i * 3 + 2),
  radiusDeg: 2.2 + 3.2 * seeded(i * 3 + 3),
  painted: false,
  period: 1.3 + 2.6 * seeded(i * 5 + 40),
  at: 39.5 + 3.9 * seeded(i * 5 + 41),
  gain: 0.35 + 0.65 * seeded(i * 5 + 42),
  seed: i + 3,
}))

export const cells: Cell[] = [...PAINTED, { lon: 32.04, lat: 54.69, radiusDeg: 1.6, painted: false, period: 2.3, at: 39.5, gain: 0.9, seed: 0 }, ...SEEDED]

export const motion = { from: 1, step: 6, most: 8, hidden: 0.95 }

export const boltColor: [number, number, number] = [0.105, 0.095, 0.14]

function step(a: number, b: number, x: number): number {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

export function flash(c: Cell, time: number): number {
  const s = ((((time - c.at + 0.15) % c.period) + c.period) % c.period)
  const body = s < 0.3 ? 1 : Math.exp(-(s - 0.3) / 0.22) * (0.72 + 0.28 * Math.cos(s * 41 + c.seed * 2.4))
  const again = 0.55 * Math.exp(-Math.pow((s - 0.66 - 0.07 * seeded(c.seed + 9)) / 0.045, 2))
  return c.gain * (step(0, 0.07, s) * body + again)
}

export const relief = {
  cell: 16,
  hazeDir: [-0.94, 0.34] as [number, number],
  hazeSpeed: 0.0025,
  flowSeconds: 3.3,
  swayRad: 0.005,
  swayPerSecond: 0.9,
  edgeDeg: 0.06,
  air: { azDeg: 80, elevDeg: 80, power: 0.5, below: [0.02, 0.013, 0.007] as [number, number, number], belowDeg: 2.5, holdDeg: 2, sunHideDeg: [2, 5] as [number, number], cut: [0.015, 0.2, 0.92] as [number, number, number], gain: 1 },
}
