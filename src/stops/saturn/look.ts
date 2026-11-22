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
  limbFit: [0, 0, 0, 0, 0.003, 0.008, 0.0138, 0.0118, 0.0082, 0.0018, -0.0029, -0.006, -0.008, -0.0092, -0.009, -0.0087, -0.0085, -0.0085, -0.0074, -0.0052, -0.001, 0.004, 0.005],
  limbLat: [-35, 5],
  limbInflate: 1.02,
  glowNorth: [35, 48, 0.46, 0.67],
  glowPole: [60, 72, 0.5, 0],
  glowWide: [0.109, 0.087, 0.056, 0.049],
  glowCap: [0.063, 0.062, 0.056],
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
  inner: [112, 128, 0, 0],
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
  outerFit: [0.004, 2.3, 2.33, 0.0011],
  gapFit: [0.004, 0.06],
  arc: [2.42, 0.047, 3, 1.3],
  arcAz: [95, 110, -150, -110],
  skimEdge: [0.004, 0.14],
  skimFoot: 0.6,
  skimDensity: [0.8, 1.05],
  skimShow: 1,
  apronEdge: [0.03, 0.02, 0.08],
  apronAway: [0.3, 0.5],
  apronShow: 1,
  debloom: 0.08,
  skimHigh: [0.8, 0.94, 0.3, 3],
  reach: 3.6,
  skimReach: 40,
  sheetRadii: [1.1, 1.21, 1.24, 1.27, 1.31, 1.345, 1.37, 1.46, 1.56],
  sheetThrough: [0.015, 0.015, 0.015, 0.015, 0.015, 0.015, 0.015, 0.015, 0.015],
  wedgeGain: [0.62, 0.62, 0.75, 0.82, 1.05, 1, 0.85, 0, 0],
  wedge: [0.063, 0.043, 0.029, 1.02],
  wedgeIn: [0.985, 1.003],
  sheetFit: [1.1, 1.16, 0.9, 0],
  shine: [0.2, 0.07, 0.035, 0.01],
  shineWide: [0.11, 0.04, 0.016, 0.045],
  shineBack: 0.3,
  sheetGlow: [0.03, 0.029, 0.022, 0],
  fillet: [0.76, 0.336, 29.8, 0.004],
}

export const ice: IceLook = {
  count: 9000,
  box: 2.4,
  lift: 0.0004,
  size: [0.00012, 0.00042],
  radius: [1.0, 1.8],
  floor: 0.8,
  reach: [0.66, 1.0],
  energy: [0.1, 0.5, 3],
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
export const limbShow = 1
export const patchShow = 1
export const skimRange: [number, number] = [0.5, 1.1]
export const skimAway: [number, number] = [0.01, 0.25]
export const skimJoin: [number, number] = [1383 / 2816, 718 / 1584]
export const skimSwing: [number, number] = [1.0, 2.2]
export const skimGrow: [number, number] = [0.0057, 0.0003]
export const skimLimb: [number, number] = [1.6, 1]
export const skimUnder: [number, number, number, number] = [-0.005, -0.002, 0.009, 0.015]
export const shellSkim: [number, number, number] = [0.958, 1.273, 1.826]
export const shellSkimDepth: [number, number] = [0.03, 0.018]
export const shellRange: [number, number] = [0.35, 3]
export const shellReach = 0.054

export const closeLight = { elevationDeg: closeFitted.elevationDeg, turnDeg: closeFitted.turnDeg }
