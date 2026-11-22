import fitted from './curve.json'
import type { GlareLook } from './glare'
import type { GlobeLight } from './globe'
import type { LensLook } from './lens'
import type { SunLimb, SunSmall } from './sunplate'

export const light: GlobeLight = {
  curve: fitted.curve,
  limb: fitted.limb,
  limbTo: fitted.limbTo,
  night: fitted.curve[0] as [number, number, number],
  wrap: 0.1,
  relief: 0.03,
  reliefNear: 0.012,
  reliefDay: 0.008,
  reliefRange: [0.1, 0.45],
  silhouette: { amp: 0.02, floor: 0.45, taps: 1.5, fade: [0.2, 0.4] },
  nightFlat: 0.2,
  nightDetail: 0.15,
  nightVeil: 0.4,
  nightVeilFrom: 0.75,
  nightSoft: [-0.3, -0.12, 0.25, 24],
  dusk: { from: 1, range: [-0.12, 0, 0.15, 0.35] },
  edge: 1.2,
  rim: { color: [0.0169, 0.0144, 0.0113], width: 0.012, wide: 0.035, wideGain: 2.7 },
  glareGate: [0.7, 0.8, 0.06],
  glareLens: [28.8, 36],
  nightAfter: 0.2,
  shoulder: { from: 0.6, strength: 0.4, frames: [4, 14] },
}

export const sun: { gain: number; breathe: number; rate: number; limb: SunLimb; small: SunSmall; slide: { leave: [number, number]; lock: [number, number]; track: [number, number, number][] }; hand: [number, number]; ghost: [number, number]; back: [number, number]; hole: { dive: [number, number]; rise: [number, number]; radius: { dive: [number, number]; rise: [number, number] } } } = {
  gain: 1, breathe: 0.03, rate: 1.9, limb: { dark: [0.08, 0.16, 0.2], edge: [1.0, 1.06] },
  small: { to: 0.14, pale: [1, 0.97, 0.9], lift: 3, white: [0.25, 0.85], feather: 0.06 },
  slide: { leave: [-24, -15], lock: [-6.5, -2.5], track: [[-22, 1.04, 0.19], [-18, 0.96, 0.18], [-14, 0.86, 0.13], [-11, 0.76, 0.06], [-8, 0.6, 0.01], [-6, 0.46, -0.01], [-4, 0.33, -0.02], [-3, 0.285, -0.015], [0, 0.26, 0.05]] },
  hand: [-3.5, -0.5],
  ghost: [-14, -5],
  back: [18, 22],
  hole: { dive: [-26.5, -23.5], rise: [16, 20], radius: { dive: [1.5, 2.4], rise: [1.0, 1.6] } },
}

export const sky = { dive: [-11, -3] as [number, number], rise: [10.5, 16] as [number, number], band: { dive: [-5, -1] as [number, number], rise: [0.5, 5] as [number, number], soft: 0.012 } }
export const cut = { dive: [-8, -1] as [number, number], rise: [1, 8] as [number, number], reach: [10.12, 10.8] as [number, number], far: [10.3, 11.2] as [number, number], margin: 8 }

export const smear = 1
export const spinRest = 1

export const lens: LensLook = { gain: 1, fade: [1.15, 1.7] }
export const streak: LensLook = { gain: 1, fade: [1.0, 1.35] }

export const glare: GlareLook = {
  peak: 1, fall: { dive: 8, enter: 7, leave: 6, rise: 7 }, span: { dive: 24, enter: 36, leave: 24, rise: 22 }, color: [1, 0.84, 0.6],
  halo: [0.45, 0.25], core: [0.2, 8], rays: [0.5, 0.5], bar: [0.7, 0.014, 0.3], turn: 0.9,
  terrainSun: [745 / 2816, -40 / 1584],
}
export const carry = { gain: 1, lift: 3, knee: 2.9, grey: 0.7 }
export const haze = { color: [0.3, 0.275, 0.23] as [number, number, number], peak: 0 }

export const close = { meet: true, shift: [0.49, 0.17] as [number, number], frames: [24, 22] as [number, number], height: [0.07, 0.19] as [number, number], far: [7, 10] as [number, number], plain: { tint: [1.2, 0.972, 0.78] as [number, number, number], until: [0.7, 1] as [number, number] }, feather: [0.22, 0.12] as [number, number], soft: 2.2, haze: 0.5, turn: [78, 1, 0.8] as [number, number, number] }

export const flight = {
  travel: 1.2,
  gather: 1,
  swoop: 0.3,
  entry: { frames: 26, height: 0.6, back: 0.4, power: 4, pitchDeg: 0, rollDeg: 0 },
  exit: { frames: 16, height: 0.7, forward: 0.1, power: 3, pitchDeg: 0 },
}

export const edge = 10.1
export const relief = { mistSpeed: 0, dustSpeed: 0, dustDir: [1, 0] as [number, number], mesh: 640 }

export const pace = {
  on: true,
  dive: { still: 1.6, end: 6, shape: [[0, 0], [4.75, 0.26], [8.75, 0.48], [12.75, 0.69], [16.75, 1], [22.75, 1], [26.75, 0]] as [number, number][] },
  rise: { floor: 0.3, until: 43, shape: [[0, 0], [3.5, 1], [14, 1], [18, 0.5], [21, 0.14], [23.5, 0.045], [26, 0]] as [number, number][], tail: [[0, 6], [26, 1.9], [32, 1.5], [38, 1.1], [43, 0.6]] as [number, number][] },
  flow: [12, 12] as [number, number],
  taper: 1,
}
