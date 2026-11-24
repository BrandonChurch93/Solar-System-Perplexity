import type { AirParams } from './air'
import curve from './curve.json'
import hazeJson from './haze.json'
import holdJson from './hold.json'
import mendJson from './mend.json'
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

// shadowSoft: the footprint with which the shadow of the cirrus is read, in pixels of a frame 1080 high; the set scales it by the height of
// the frame that is drawn, so the shadow is as soft at 3840 wide as at 1920 wide. soft 1 is the plain footprint of one pixel of the frame.
export const clouds: CloudParams = { height: 0.004, shadow: 0.45, shadowSoft: 3, soft: 1, shear: 0.35, shearBands: 5, relief: 0 }
export const storm = { lon: -0.25, lat: -18.8, radiusDeg: 7, degPerSecond: 2.5, fullSeconds: 2.6, easeSeconds: 1.6 }
export const stream = { degPerSecond: 1.5, fullSeconds: 2.6, easeSeconds: 1.6 }
export const holdness = { fromDeg: 6, toDeg: 26 }
export const near = {
  amount: 1,
  dive: { gain: 0.86, power: 1, saturation: 0.45, pivot: 0.3, tint: [0.78, 0.97, 1], air: [1, 1, 1], fall: [9, 22, 1], fallAltitude: [0.5, 1] },
  rise: { gain: 0.86, power: 1, saturation: 0.45, pivot: 0.3, tint: [0.78, 0.97, 1], air: [1, 1, 1], fall: [3, 11, 1], fallAltitude: [0.5, 1.6] },
}
export const field = { amount: 1 }
export const held = { ...holdJson, amount: 1 }
export const mended = { ...mendJson }
export const night = { flat: 1, edge: [-0.1, 0.25] as [number, number], texels: 96 }
export const lineFade: [number, number] = [0.6, 0.15]
export const airThin = { reach: 2 }
export const diving = { from: 2.06, to: 1.8 }
export const flow = { amount: 0.6 }
export const cirrus = { amount: 1, bend: 0.018, shadow: 1.5, floor: 0.7, clump: [0.08, 0.28, 0.7] }

export const triton = {
  up: [-0.15, 0.835, 0.53] as [number, number, number],
  stage: [8.608, -10.036, -4.601] as [number, number, number],
  aim: [0.2323, -0.3863, -0.044] as [number, number, number],
  gain: 1.75,
  bump: 0.018,
  rim: 0,
  wrap: 0.432,
  lift: 1.2,
  sun: [1, 0.98, 0.96] as [number, number, number],
  ambient: [0.004, 0.007, 0.014] as [number, number, number],
  terminator: [-0.022, 0.41] as [number, number],
  power: 1.258,
  spinDegPerSecond: 0.4,
  rise: { sun: 0.4, ambient: [0.0057, 0.0142, 0.021] as [number, number, number], terminator: [-0.08, 0.42] as [number, number], power: 0.9, bump: 0.012, rim: 0.4, wrap: 0, lift: 1 },
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
  bandUnit: [0.16, 1, 0.05] as [number, number, number],
  bandHold: [0.1, 0.1, 0] as [number, number, number],
  bandAway: [0.45, 0.2, 2.2] as [number, number, number],
  mapScale: 0.25,
  degPerSecond: 0.8,
  grain: { repeat: [4, 0.25] as [number, number], fine: 4, amount: 0.8, top: 8 },
  solid: { amount: 0.95, density: 250, ground: [0.0052, 0.0087, 0.0108] as [number, number, number], rise: [0.1, 0.35], near: [0.58, 0.82] as [number, number] },
}
