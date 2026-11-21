import type { HazeParams } from '../../bodies/haze'
import closeFitted from './closeCurve.json'
import closeGlobe from './closeGlobe.json'
import fitted from './curve.json'
import type { GlobeLook } from './globe'
import type { RingLook } from './rings'
import type { TitanLook } from './titan'

export const globe: GlobeLook = {
  curve: fitted.curve,
  closeCurve: closeFitted.curve.map((c, i) => c.map((v, k) => v * closeGlobe.curveGain[i]![k]!)),
  limb: [0, 0.3],
  ringShadow: 0.94,
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
  floorAlpha: 0.93,
  penumbra: [0.978, 0.994, 0.006],
  unlit: 0.12,
  lodBias: 1.2,
  lodBiasClose: 0.35,
  spokes: 0.1,
  clumps: 0.05,
  grain: 0.2,
  grainHero: 0,
  grainCell: [1, 1.6],
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
export const detailRange: [number, number] = [0.2, 0.5]

export const closeLight = { elevationDeg: closeFitted.elevationDeg, turnDeg: closeFitted.turnDeg }
