import type { HazeParams } from '../../bodies/haze'
import fitted from './curve.json'
import type { GlobeLook } from './globe'
import type { TitanLook } from './titan'

export const globe: GlobeLook = {
  curve: fitted.curve,
  limb: [0, 0.3],
  ringShadow: 0.94,
  // the rings' shadow on the globe is the same at every pose of the lens: the Sun stands 15.8 degrees over the
  // ring plane, and what the rings take of its light falls on the globe south of the plane, in the hold as
  // in the skim (1: nothing of it is taken back at the pose of the hold)
  ringShadowHero: 1,
  ringSoft: [0.003, 0.012],
  ringSlant: 1,
  // degrees a second the fine streaks from functions slide along their bands at the fastest latitudes; the map itself is rigid
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
  home: [8.267512, 4.240938, -16.162627],
  size: 0.9766,
}

export const limbShow = 1
export const patchShow = 1
export const shellReach = 0.054
