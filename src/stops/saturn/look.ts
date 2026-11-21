import type { HazeParams } from '../../bodies/haze'
import fitted from './curve.json'
import type { GlobeLook } from './globe'
import type { RingLook } from './rings'
import type { TitanLook } from './titan'

export const globe: GlobeLook = {
  curve: fitted.curve,
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
  shadowFloor: [0.004, 0.005, 0.006],
  penumbra: [0.99, 1.1, 0.02],
  unlit: 0.12,
  lodBias: 1.2,
  spokes: 0.1,
  clumps: 0.05,
  grain: 0.22,
  sparkle: 1.6,
  sparkleTint: [1, 0.72, 0.5],
  sparkleCell: 0.005,
  closeTone: [1, 1, 1],
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
