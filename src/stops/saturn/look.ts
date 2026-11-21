import type { HazeParams } from '../../bodies/haze'
import closeFitted from './closeCurve.json'
import closeGlobe from './closeGlobe.json'
import fitted from './curve.json'
import type { GlobeLook } from './globe'
import type { IceLook } from './ice'
import type { RingLook } from './rings'
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
  scaleHeight: 0.034,
  depth: 0.018,
  day: [0.5, 0.42, 0.33],
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
  shadowClose: [28, 0],
  floorAlpha: 0.93,
  floorRamp: [1.2458, 1.5],
  penumbra: [0.978, 0.994, 0.006],
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
  heroEdge: 0.012,
  heroDensity: [0.95, 1.2],
  heroOver: [0.4, 0.5],
  heroTurn: 0.5,
  skimEdge: [0, 0.14],
  skimFoot: 0.7,
  skimDensity: [0.8, 1.05],
  skimShow: 1,
  reach: 3.6,
}

export const ice: IceLook = {
  count: 12000,
  box: [1.3, 0.34, 0.004],
  heightPower: 1.6,
  blur: 1,
  radius: [1.1, 46],
  near: [0.012, 0.035],
  energy: 5,
  dim: [1.8, 1.2],
  energyPower: 3,
  tint: [1, 0.94, 0.86],
  glint: [3, 8],
  drift: 0.004,
  thin: 0.25,
  thinRange: [0.1, 0.45],
  heightRange: [0.5, 1],
  dense: [0.04, 0.15],
  eye: [0.03, 0.09],
  lod: 16,
}

export const titan: TitanLook = {
  day: [0.62, 0.3, 0.1],
  rim: [0.25, 0.14, 0.06],
  night: [0.004, 0.003, 0.003],
  halo: [0.1, 0.07, 0.05],
  haloHeight: 0.05,
  terminator: [-0.3, 0.75],
  limb: 0.5,
}

export const closeRange: [number, number] = [0.35, 1.6]
export const detailRange: [number, number] = [0.5, 1.1]
export const heroRange: [number, number] = [0.6, 2.2]
export const skimRange: [number, number] = [0.5, 1.1]
export const skimAway: [number, number] = [0.01, 0.25]
export const shellSkim: [number, number, number] = [0.92, 0.86, 0.74]

export const closeLight = { elevationDeg: closeFitted.elevationDeg, turnDeg: closeFitted.turnDeg }
