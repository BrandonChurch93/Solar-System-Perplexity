import fitted from './curve.json'
import type { GlareLook } from './glare'
import type { GlobeLight } from './globe'
import type { LensLook } from './lens'
import type { SunLimb } from './sunplate'

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
  nightFlat: 0.2,
  nightDetail: 0.15,
  nightVeil: 0.4,
  nightVeilFrom: 0.75,
  nightSoft: [-0.3, -0.12, 0.25, 24],
  dusk: { from: 1, range: [-0.12, 0, 0.15, 0.35] },
  edge: 1.2,
  rim: { color: [0.0169, 0.0144, 0.0113], width: 0.012, wide: 0.035, wideGain: 2.7 },
  glareGate: [0.7, 0.8, 0.06],
  glareLens: [34, 48],
}

export const sun: { gain: number; breathe: number; rate: number; limb: SunLimb } = { gain: 1, breathe: 0.03, rate: 1.9, limb: { dark: [0.25, 0.5, 0.62], edge: [1.0, 1.12] } }

export const smear = 1
export const spinRest = 1

export const lens: LensLook & { veil: number } = { gain: 1, fade: [1.15, 1.7], veil: 1 }
export const streak: LensLook = { gain: 1, fade: [1.0, 1.35] }

export const glare: GlareLook = {
  flood: { peak: 8, width: { dive: 1.5, enter: 1.6, leave: 1.5, rise: 1.6 }, shift: [-0.5, -0.5], color: [1, 0.9, 0.74], ground: 0.09, soft: 0.07, even: 0.6, reach: 2 },
  bloom: { peak: 1, fall: { dive: 5, enter: 7, leave: 6, rise: 6 }, span: { dive: 28, enter: 44, leave: 26, rise: 32 }, color: [1, 0.84, 0.6], ground: 0.3, wide: [1, 3], shrink: [0.25, 0.5], core: [0.22, 40], rays: [0.5, 0], turn: 0.9 },
  terrainSun: [745 / 2816, -40 / 1584],
}
export const ride: [number, number] = [18, 18]
export const carry = { gain: 2.6, knee: 2.9, grey: 0.35, frames: [14, 14] as [number, number] }
export const haze = { color: [0.3, 0.275, 0.23] as [number, number, number], peak: 0.68, dive: [13.5, 7.5, 3, 0.35] as [number, number, number, number], rise: [3, 6, 10.5, 0.35] as [number, number, number, number] }

export const close = { meet: true, shift: [0.49, 0.17] as [number, number], frames: [24, 22] as [number, number], height: [0.07, 0.19] as [number, number], far: [7, 10] as [number, number], feather: [0.22, 0.12] as [number, number], soft: 2.2, haze: 0.5, turn: [78, 1, 0.8] as [number, number, number] }

export const edge = 10.1
export const relief = { mistSpeed: 0, dustSpeed: 0, dustDir: [1, 0] as [number, number], mesh: 640 }
