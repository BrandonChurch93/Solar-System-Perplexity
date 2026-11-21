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
export const air = { ...hazeJson.air, near: [0.22, 0.45, 0.9] } as AirParams
export const limb = hazeJson.limb as LimbParams

export const clouds: CloudParams = { height: 0.004, shadow: 0.45, shadowSoft: 3, soft: 1, shear: 0.35, shearBands: 5, relief: 0 }
export const storm = { lon: -0.25, lat: -18.8, radiusDeg: 7, degPerSecond: 5 }
export const stream = { degPerSecond: 1.5, fullSeconds: 2.6, easeSeconds: 1.6 }
export const holdness = { fromDeg: 6, toDeg: 26 }
export const near = { altitude: [0.05, 0.45], altitudeRise: [0.4, 2.6], amount: 1, gain: 0.55, gainRise: 0.6, power: 1.4, saturation: 0.3, pivot: 0.3, tint: [0.75, 0.95, 1] }
export const field = { amount: 1 }
export const lineFade: [number, number] = [0.6, 0.15]

export const triton = {
  up: [-0.15, 0.835, 0.53] as [number, number, number],
  aim: [0.2445, -0.4561, 0.1475] as [number, number, number],
  gain: 1.75,
  bump: 0.008,
  rim: 0.4,
  sun: [1, 0.98, 0.96] as [number, number, number],
  ambient: [0.004, 0.007, 0.014] as [number, number, number],
  terminator: [-0.02, 0.18] as [number, number],
  power: 0.7,
  spinDegPerSecond: 0.4,
}

export const ring = {
  normal: [0.1681, 0.9779, 0.1244] as [number, number, number],
  centre: [0.0533, 0.0532, -0.4902] as [number, number, number],
  inner: 1.28,
  outer: 1.92,
  color: [0.42, 0.7, 1] as [number, number, number],
  gain: 1,
  forward: 2.5,
  forwardPower: 5,
  sheet: [1.42, 1.78, 0.08, 0.008] as [number, number, number, number],
  strands: [[1.52, 0.005, 0.04], [1.4, 0.004, 0.016], [1.7, 0.012, 0.0096]],
  mapScale: 0.25,
  degPerSecond: 0.8,
}
