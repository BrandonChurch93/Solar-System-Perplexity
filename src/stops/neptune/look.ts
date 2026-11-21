import type { HazeParams } from '../../bodies/haze'
import curve from './curve.json'
import hazeJson from './haze.json'
import type { CloudParams, LimbParams } from './planet'

export const code = curve.code
export const deck = curve.deck
export const cloud = curve.cloud
export const ground = hazeJson.ground as HazeParams
export const shell = hazeJson.shell as HazeParams
export const halo = hazeJson.halo as HazeParams
export const limb = hazeJson.limb as LimbParams

export const clouds: CloudParams = { height: 0.004, shadow: 0.45, shadowSoft: 3, shear: 0.35, shearBands: 5, relief: 0 }
export const storm = { lon: -0.25, lat: -18.8, radiusDeg: 7, degPerSecond: 5 }
export const stream = { degPerSecond: 1.5 }
export const holdness = { fromDeg: 6, toDeg: 26 }

export const triton = {
  up: [-0.2, 0.9, 0.35] as [number, number, number],
  gain: 4,
  sun: [1, 0.98, 0.96] as [number, number, number],
  ambient: [0.004, 0.007, 0.014] as [number, number, number],
  terminator: [-0.04, 0.3] as [number, number],
  power: 0.7,
  spinDegPerSecond: 0.4,
}

export const ring = {
  normal: [0.169, 0.983, 0.0785] as [number, number, number],
  inner: 1.2,
  outer: 1.85,
  color: [0.5, 0.72, 1] as [number, number, number],
  gain: 0.05,
  forward: 2.5,
  forwardPower: 5,
  sheet: [1.3, 1.72, 0.06, 0.35] as [number, number, number, number],
  lines: [
    [1.345, 0.006, 0.7], [1.39, 0.004, 0.45], [1.47, 0.008, 1], [1.505, 0.003, 0.5],
    [1.56, 0.005, 0.6], [1.6, 0.007, 0.9], [1.66, 0.004, 0.4], [1.7, 0.003, 0.3],
  ] as [number, number, number][],
  clumps: 0.35,
  degPerSecond: 0.8,
}
