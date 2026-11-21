import type { HazeParams } from '../../bodies/haze'
import closeFitted from './closeCurve.json'
import closeGlobe from './closeGlobe.json'
import fitted from './curve.json'
import type { GlobeLook } from './globe'
import type { IceLook } from './ice'
import type { RingLook } from './rings'
import type { StreakLook } from './streak'
import type { TitanLook } from './titan'

export const globe: GlobeLook = {
  curve: fitted.curve,
  closeCurve: closeFitted.curve.map((c, i) => c.map((v, k) => v * closeGlobe.curveGain[i]![k]!)),
  limb: [0, 0.3],
  ringShadow: 0.94,
  ringShadowHero: 0.25,
  ringSoft: [0.003, 0.012],
  ringSlant: 1.7,
  drift: 0.2,
  nightFloor: 0.012,
  hazeShadow: 0.8,
  rim: [3.1, 3.4, 1.8, 0.15],
  rimPower: 3,
  rimNight: [0.004, 0.012, 0.025, 0.06],
  nightBlur: 16,
  termShift: [0.085, 0.55, 0.97],
  probe: 0,
  edgePx: 2.6,
}

export const haze: HazeParams = {
  scaleHeight: 0.006,
  depth: 0.01,
  day: [0.9, 0.8, 0.6],
  twilight: [0, 0, 0],
  strength: 1,
  extinction: 0,
  forward: 0,
  top: 7,
}

export const shell: HazeParams = {
  scaleHeight: 0.015,
  depth: 0.027,
  day: [0.48, 0.275, 0.115],
  twilight: [0.02, 0.03, 0.04],
  dayFrom: -0.05,
  dayTo: 0.5,
  strength: 1,
  extinction: 0,
  forward: 0,
  top: 5,
}

export const rings: RingLook = {
  shadowFloor: [0.0075, 0.0095, 0.0125],
  floorHold: [0.0073, 0.0099, 0.0127],
  floorTone: [0.95, 0.4],
  shadowClose: [30, 0],
  shadowLift: 0.15,
  floorAlpha: 0.93,
  floorRamp: [1.2458, 1.5],
  penumbra: [0.978, 0.994, 0.006],
  penumbraFar: [1.5, 0.05],
  inner: [112, 128, 0.01, 0.03],
  over: [0.03, 1.38, 0.985, 1.46],
  strand: [1.5, 2.0, 1.5],
  overTone: [0.4, 0.8, 1.12, 102],
  shadowThin: [1.85, 2.08, 0.85],
  unlit: 0.12,
  lodBias: 1.2,
  lodBiasClose: 1.2,
  spokes: 0.1,
  clumps: 0.05,
  grain: 0.38,
  grainHero: 0,
  grainCell: [0, -0.5],
  junction: 5,
  shadeTint: [0.97, 1, 0.94],
  shadeGrey: [0.3, 0.85],
  sparkle: 1.6,
  sparkleTint: [1, 0.9, 0.8],
  sparkleCell: 0.005,
  closeTone: [1, 1, 1],
  veil: [0.55, 1],
  sweep: 700,
  heroTone: [1, 1, 1],
  heroTurn: 0.5,
  shapeFit: [1.75, 1.92],
  skimEdge: [0, 0.14],
  skimFoot: 0.7,
  skimDensity: [0.8, 1.05],
  skimShow: 1,
  reach: 3.6,
}

export const ice: IceLook = {
  count: 9000,
  box: 2.4,
  lift: 0.0004,
  size: [0.00012, 0.00042],
  radius: [0.45, 1.15],
  floor: 0.42,
  reach: [0.66, 1.0],
  energy: [0.4, 9, 4],
  tint: [1, 0.97, 0.93],
  baked: [0.78, 0.98],
  heightRange: [0.5, 1],
  lod: 16,
}

export const titan: TitanLook = {
  day: [0.7, 0.245, 0.085],
  rim: [1.4, 0.72, 0.3],
  night: [0.0082, 0.009, 0.0105],
  halo: [0.06, 0.035, 0.024],
  haloHeight: 0.035,
  terminator: [0.05, 0.7],
  limb: 0.3,
  home: [8.167601, 4.265027, -17.74795],
  size: 0.956,
}

export const streak: StreakLook = {
  gain: 1,
  upper: [0.785, 0.8505, 0.0058],
  lower: [0.885, 0.8915, 0.0032],
  smudge: [0.821, 0.8415, 0.009],
  halo: [0.87, 0.868, 0.024],
  left: [0.008, 0.0105, 0.011],
  mid: [0.0012, 0.004, 0.0065],
  right: [0.03, 0.0245, 0.019],
  second: [0.007, 0.0078, 0.0085],
  blue: [0.0005, 0.0075, 0.021],
  wash: [0, 0.0028, 0.006],
}

export const closeRange: [number, number] = [0.35, 1.6]
export const detailRange: [number, number] = [0.5, 1.1]
export const heroRange: [number, number] = [0.6, 1.6]
export const polarHeight: [number, number] = [1.0, 1.7]
export const polarFar: [number, number] = [7, 9]
export const polarEdge: [number, number] = [1.46, 1.54]
export const polarDensity: [number, number] = [1.0, 1.3]
export const polarOuter: [number, number] = [0.012, 0.002]
export const polarShow = 1
export const patchShow = 1
export const skimRange: [number, number] = [0.5, 1.1]
export const skimAway: [number, number] = [0.01, 0.25]
export const shellSkim: [number, number, number] = [0.958, 1.273, 1.826]
export const shellSkimDepth: [number, number] = [0.03, 0.018]
export const shellReach = 0.054

export const closeLight = { elevationDeg: closeFitted.elevationDeg, turnDeg: closeFitted.turnDeg }
