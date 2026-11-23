import type { HazeParams } from '../../bodies/haze'
import fitted from './curve.json'
import type { GlobeLook } from './globe'
import type { StreakLook } from './streak'
import type { TitanLook } from './titan'

export const globe: GlobeLook = {
  curve: fitted.curve,
  limb: [0, 0.3],
  ringShadow: 0.94,
  ringShadowHero: 0.25,
  ringSoft: [0.003, 0.012],
  ringSlant: 1,
  drift: 0.2,
  nightFloor: 0.012,
  hazeShadow: 0.8,
  rim: [3.1, 3.4, 1.8, 0.15],
  rimPower: 3,
  rimNight: [0.004, 0.012, 0.025, 0.06],
  nightBlur: 16,
  nightBlurFar: 1.5,
  fine: [8, 0.3, 2],
  fineTop: 1.1,
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

export const titan: TitanLook = {
  day: [1.05, 0.37, 0.095],
  rim: [1.9, 1.15, 0.6],
  night: [0.0082, 0.009, 0.0105],
  halo: [0.06, 0.035, 0.024],
  haloHeight: 0.035,
  terminator: [0.02, 1.0],
  limb: 0.3,
  edgePx: 0.9,
  rimPower: 4,
  bands: [0.11, 7, 19, 2.6],
  hood: [0.84, 0.74, 0.7],
  redden: [1, 0.85, 0.72],
  mottle: [0.14, 3.2],
  home: [8.191769, 4.235077, -17.74795],
  size: 0.9766,
}

export const streak: StreakLook = {
  gain: 1,
  fade: 0.6,
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

export const limbShow = 1
export const patchShow = 1
export const shellReach = 0.054
