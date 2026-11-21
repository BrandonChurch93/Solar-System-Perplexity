import type { AirParams } from './air'
import curve from './curve.json'
import hazeJson from './haze.json'
import type { CloudParams, LimbParams } from './planet'

export const code = curve.code
export const nightGain = 1.2
export const deck = curve.deck.map((k, i) => {
  const t = Math.min(Math.max((i / 16 - 1 + 0.1) / 0.15, 0), 1)
  const g = 1 + (nightGain - 1) * (1 - t * t * (3 - 2 * t))
  return k.map((v) => v * g)
})
export const cloud = curve.cloud
export const air = hazeJson.air as AirParams
export const limb = hazeJson.limb as LimbParams

export const clouds: CloudParams = { height: 0.004, shadow: 0.45, shadowSoft: 3, shear: 0.35, shearBands: 5, relief: 0 }
export const storm = { lon: -0.25, lat: -18.8, radiusDeg: 7, degPerSecond: 5 }
export const stream = { degPerSecond: 1.5 }
export const holdness = { fromDeg: 6, toDeg: 26 }
export const lineFade: [number, number] = [0.6, 0.15]

export const triton = {
  up: [-0.2, 0.9, 0.35] as [number, number, number],
  aim: [0.25, -0.25, 0.55] as [number, number, number],
  gain: 2.6,
  sun: [1, 0.98, 0.96] as [number, number, number],
  ambient: [0.004, 0.007, 0.014] as [number, number, number],
  terminator: [-0.04, 0.3] as [number, number],
  power: 0.7,
  spinDegPerSecond: 0.4,
}

export const ring = {
  normal: [0.1681, 0.9779, 0.1244] as [number, number, number],
  centre: [0.0533, 0.0532, -0.4902] as [number, number, number],
  inner: 1.28,
  outer: 1.92,
  color: [0.42, 0.7, 1] as [number, number, number],
  gain: 0.02,
  forward: 2.5,
  forwardPower: 5,
  sheet: [1.42, 1.78, 0.08, 0.5] as [number, number, number, number],
  lines: [
    [1.455, 0.006, 0.35], [1.497, 0.004, 0.6], [1.52, 0.005, 1], [1.543, 0.004, 0.7],
    [1.575, 0.008, 0.45], [1.63, 0.012, 0.4], [1.7, 0.015, 0.3],
  ] as [number, number, number][],
  clumps: 0.45,
  degPerSecond: 0.8,
}
