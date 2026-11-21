import type { HazeParams } from '../../bodies/haze'
import fitted from './curve.json'
import flowJson from './flow.json'
import hazeJson from './haze.json'
import limbJson from './limb.json'

export const curve = fitted.curve as number[][]
export const limb = limbJson.limb as number[][]
export const jet = flowJson.jet as number[]
export const night = fitted.night as [number, number, number]
export const nightAlbedo: [number, number, number, number] = [0.43, 0.32, 0.24, 0.08]

export const shadeKnee: [number, number] = [2.4, 3.4]
export const shadow: [number, number, number] = [0.798, 1.098, 0.985]
export const moonSun: [number, number, number] = [-0.713344, 0.254075, 0.653136]

export const haze = hazeJson.ground as HazeParams
export const shells = hazeJson.shells as HazeParams[]
export const glowDir = hazeJson.glowDir as [number, number, number]

export const spot = { lon: -17.5, lat: -10.0, axesDeg: [7.0, 4.3] as [number, number], core: 0.9, reach: 1.7 }

export const flow = {
  bandDegPerSecond: 0.22,
  swirlDegPerSecond: 5,
  settle: 5,
  wispTilesPerSecond: 0.005,
}

export const wisp = {
  repeats: 4,
  latScale: 0.6366,
  amount: 0.1,
  shadow: 0.08,
  shadowLength: 0.0045,
  shadowBlur: 3,
  polarFrom: 36,
  polarTo: 45,
  fine: 0.5,
}

export const io = {
  home: [0.136771, -0.233998, 1.028363] as [number, number, number],
  radius: 0.057637,
  sun: [2, 2, 2] as [number, number, number],
  ambient: [0.01, 0.01, 0.01] as [number, number, number],
  bounce: [0.05, 0.04, 0.03] as [number, number, number],
  wrap: 0.15,
  power: 1,
  rim: 0,
  spinDegPerSecond: 0.6,
}

export const descent = { high: 0.7, low: 0.05 }
