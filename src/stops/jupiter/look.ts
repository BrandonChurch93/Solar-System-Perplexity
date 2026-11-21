import type { HazeParams } from '../../bodies/haze'
import type { DeckLook } from './deck'
import fitted from './curve.json'
import flowJson from './flow.json'
import hazeJson from './haze.json'
import limbJson from './limb.json'

export const curve = fitted.curve as number[][]
export const limb = limbJson.limb as number[][]
export const jet = flowJson.jet as number[]
export const nightGain = 0.86
export const night = (fitted.night as number[]).map((v) => v * nightGain) as [number, number, number]
export const nightAlbedo: [number, number, number, number] = [0.43, 0.32, 0.24, 0.2]

export const shadeKnee: [number, number] = [2.4, 3.4]
export const shadow: [number, number, number] = [0.87, 1.01, 1.0]
export const shadowFade: [number, number] = [0.0, 0.1]
export const shadowHaze: [number, number] = [1.0, 0.27]
export const shadowCap = { stretch: 0.35, from: 0.12, to: 0.36 }
export const nightRim = { glow: [0.0015, 0.0027, 0.003] as [number, number, number], power: 3, air: 0.011, from: -0.05, to: 0.2, out: 0.0105, bulge: 3 }
export const litEdge: [number, number, number, number] = [0.0075, 0.0085, 2, 0]
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
  ambient: [0.003, 0.003, 0.003] as [number, number, number],
  bounce: [0.05, 0.04, 0.03] as [number, number, number],
  wrap: 0.15,
  power: 1,
  rim: 0,
  spinDegPerSecond: 0.6,
  feather: 1,
  blur: 0.2,
  riseDeg: 20.4,
  term: [0.3, 1.5] as [number, number],
  dusk: [1.33, 0.964, 0.386, 0.9] as [number, number, number, number],
  crisp: 0.6,
}

export const descent = { high: 0.7, low: 0.05 }
export const limbLit: [number, number, number] = [0.35, 0.1, 0.45]
export const edge = { pixels: 1, inset: 0.0015, rim: 0.03, cap: 2, air: [0.45, 0.0025, 0.4, 0.007] as [number, number, number, number], soft: [0.3, 128] as [number, number] }

export const deck: DeckLook = {
  skyRimDeg: 5.2,
  edgePixels: 1.2,
  settle: 6,
  vortices: [
    { px: [1132, 552], axes: [1.12, 2.18], degPerSecond: 14, wispDegPerSecond: 23 },
    { px: [-618, 924], axes: [0.36, 0.36], degPerSecond: -9, wispDegPerSecond: -14 },
    { px: [-558, 1524], axes: [0.3, 0.3], degPerSecond: 10, wispDegPerSecond: 16 },
    { px: [912, 1284], axes: [0.3, 0.3], degPerSecond: -8, wispDegPerSecond: -13 },
    { px: [1512, 1914], axes: [0.28, 0.28], degPerSecond: 9, wispDegPerSecond: 14 },
  ],
  collar: [0.2, 0.45, 2.0],
  tone: [1.066, 1.077, 1.08, 0.08, 0.4],
  toneHigh: [1.04, 1.052, 1.06],
  wisp: { tile: 3.2, amount: 0.2, shadow: 0.12, shadowLength: 0.02, fine: 0.5, drift: [0.05, -0.02], fade: [7, 14], sun: [-0.6, 0.8] },
  flashes: [
    { px: [1662, 1449], sizePx: 70, period: 3.1, phase: 0.43, gain: 0.5 },
    { px: [1812, 1149], sizePx: 55, period: 4.3, phase: 0.71, gain: 0.35 },
    { px: [1542, 1344], sizePx: 60, period: 2.7, phase: 0.28, gain: 0.4 },
    { px: [2082, 1464], sizePx: 80, period: 3.7, phase: 0.55, gain: 0.4 },
    { px: [2052, 1644], sizePx: 90, period: 2.9, phase: 0.83, gain: 0.45 },
    { px: [1300, 1500], sizePx: 75, period: 5.3, phase: 0.36, gain: 0.3 },
    { px: [2400, 1250], sizePx: 60, period: 4.7, phase: 0.62, gain: 0.3 },
    { px: [1850, 1900], sizePx: 110, period: 3.9, phase: 0.2, gain: 0.4 },
  ],
  haze: { color: [0.2, 0.17, 0.135], tile: 9, layer: 0.45, height: 0.5, clear: [2.8, 1.5], gather: [1.4, 0.75], tone: [6, 0.6, 1.0, 160] },
  depth: 3,
  depthBorder: 400,
  pall: { clear: 0.45, gather: 0.6, orbitClear: 0.5, orbitGather: 0.35, shell: [1.0, 1.004], morph: 0.234 },
  flashColor: [0.45, 0.7, 1.0],
  flashBody: [0.25, 6],
  beyond: [0.6, 0.004, 300],
  detail: [0.3, 0.7, 1.1, 1.9],
}

export const veil = { color: [0.85, 0.8, 0.7] as [number, number, number], amount: 0.9, from: 2.2, to: 0.35, height: 0.012, repeats: 1, drift: 0.004 }
