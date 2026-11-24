import fitted from './curve.json'
import type { GlareLook } from './glare'
import type { GlobeLight } from './globe'
import type { LensCore, LensLook } from './lens'
import type { SunLimb, SunSmall, SunSurface } from './sunplate'

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
  silhouette: { amp: 0.012, floor: 0.45, taps: 1.5, fade: [0.2, 0.4], wide: [6, 1] },
  nightFlat: 0.2,
  nightDetail: 0.15,
  nightVeil: 0.4,
  nightVeilFrom: 0.75,
  nightSoft: [-0.3, -0.12, 0.25, 24],
  dusk: { from: 1, range: [-0.12, 0, 0.15, 0.35] },
  edge: 1.2,
  rim: { color: [0.0169, 0.0144, 0.0113], width: 0.01, wide: 0.035, wideGain: 2.7, nearGain: 3.3, nearTint: [1.08, 0.84, 0.76], lobe: [0.9, 0.9, 0.03], toLight: 0.45, after: 0.2, fade: [96, 27] },
  line: { dir: [0.8175, -0.5743, -0.0432], gain: 1.7, width: [0.001, 0.0092], side: [0.75, 0.95], sun: [0, 0.2, 0.55, 1], dip: 0.22, dipWidth: [0.0164, 0.045], dipSun: [0.3, 0.7], dipTight: [0.8, 0.95, 0.35] },
  glareGate: [0.7, 0.8, 0.06],
  glareLens: [28.8, 36],
  nightAfter: 1,
  nightPlain: { height: [2.2, 3.4], range: [-0.06, 0.04] },
  shoulder: { from: 0.6, strength: 0.4, height: [2.89, 7.42] },
}

export const sun: { gain: number; breathe: number; rate: number; limb: SunLimb; small: SunSmall; ghostIn: number } = {
  gain: 1, breathe: 0.03, rate: 1.9, limb: { dark: [0.08, 0.16, 0.2], edge: [1.0, 1.06] },
  small: { to: 0.14, pale: [1, 0.97, 0.9], lift: 3, white: [0.25, 0.85], feather: 0.06 },
  ghostIn: 4,
}

export const smear = 1
export const hide = { rate: 10, fade: [0.72, 0.99], power: 2, gone: 0.5556 }
export const sunLook: [number, number] = [0.4, 0.97]
export const leaveStep = 0.5
export const leaveSoft = 0.5
export const spinRest = 1

export const lens: LensLook = { gain: 1, fade: [1.15, 1.7] }
export const streak: LensLook = { gain: 1, fade: [1.0, 1.35] }
export const flare: { onBody: [number, number]; offBody: number; dive: [number, number]; after: number } = { onBody: [1, 0.1], offBody: 0, dive: [1, 0.713], after: 0 }
export const sunSurface: SunSurface = { grain: [0.07, 0.3], cells: 53, coarse: 0.6, dive: [1, 0.713], disc: [0.0176, 0.0207, 0.2506], limb: [0.42, 0.56, 0.7], rim: [0.8, 0.94, 0.75, 0.85], out: [1.0, 1.12, 0.35], hideEdge: [1.1, 1.3], corona: { depth: 0.45, reach: [1.22, 0.5], soft: 0.17 } }
export const streakCore: LensCore = { row: -0.0393, sigma: 0.0177, rise: [0.94, 1.03], join: [0.84, 0.93], pivot: 0.958, tail: 1.27, power: 3, warm: [1.06, 0.99, 0.86], peak: [0.744, 0.5615] }

export const glare: GlareLook = {
  peak: 1, fade: { dive: [2.15, 85], rise: [2.19, 155] }, height: 1.5, top: [0.26258095108704677, 0.2649431874412129], keep: [0.165, 0.22], color: [1, 0.84, 0.6],
  halo: [0.45, 0.25], core: [0.2, 8], rays: [0.5, 0.5], bar: [0.7, 0.014, 0.3], turn: 0.9,
  terrainSun: [745 / 2816, -40 / 1584],
}
export const carry = { gain: 1, lift: 1.12, knee: 2.9, grey: 0.85, tint: [1.102, 0.983, 0.871] as [number, number, number], dive: [11.7, 3.03] as [number, number], rise: [2.68, 26] as [number, number] }

export const close = { meet: true, shift: [0.09, 0.0] as [number, number], frames: [24, 22] as [number, number], height: [0.06, 0.3] as [number, number], far: [7, 10] as [number, number], feather: [0.22, 0.12] as [number, number], haze: { amount: 1, level: { dive: 1, rise: 1.7 }, height: [2.4, 7] as [number, number], cut: [8, 13] as [number, number], calm: [0.3, 0.62] as [number, number], calmHeight: [2.4, 3.6] as [number, number], wash: { amount: 1, cap: 2.5, height: [2.4, 7] as [number, number] } }, lift: { cap: [-0.35, 0.35] as [number, number], knee: { dive: [0.16, 3] as [number, number], rise: [0.3, 1.2] as [number, number] }, height: [14, 40] as [number, number] }, wide: { feather: [[2.4, 0.02], [3.4, 0.06], [4.6, 0.14]] as [number, number][], over: [0.42, 0.02] as [number, number], drop: [9, 12] as [number, number], margin: 0.001, blur: [48, 3] as [number, number], soft: 4, cap: { over: 1.3, span: 0.03125, height: [2.3, 2.7] as [number, number], reach: [6, 8.5] as [number, number] }, far: [[2.4, 23], [3.4, 15], [4.3, 11.5], [5.9, 9.5], [10.4, 8], [16, 6]] as [number, number][] } }

export const under = { span: 0.45, height: [2.9, 6.5] as [number, number] }
export const fine = { shift: [0.37, 0.61] as [number, number], edge: [0.03, 0.03] as [number, number], blur: [16, 48] as [number, number], shade: [0.05, 0.22, 0.3] as [number, number, number] }
export const far = { color: [0.289, 0.26, 0.225] as [number, number, number], under: { dive: [0.05, 0.125] as [number, number], rise: [0.1, 0.155] as [number, number] }, sunFallDeg: 14, flat: 1, sunReach: 0.6, sunLevel: 2.6, lit: [0.0, 0.15] as [number, number], height: [0.05, 0.2] as [number, number], relief: [0.08, 0.5] as [number, number] }
export const sky = { height: [0.042, 0.3] as [number, number] }
export const border = { deg: [3, 4.5] as [number, number] }
export const mend = { lon: 16.36, lat: -5.94, reach: 0.03, from: 1.8 }

export const flight = { travel: 1.2, gather: 1, swoop: 0.3, rest: [744, 990] as [number, number], knee: 30, lift: { at: 990, frames: 34, height: 0.7, forward: 0.1, power: 8 }, bend: { from: 876, join: 12, endDeg: 140, skew: 1.7, steps: 64, until: 1014 } }

export const edge = 10.1
export const relief = { mistSpeed: 0, dustSpeed: 0, dustDir: [1, 0] as [number, number], mesh: 640 }

export const path = {
  dive: { at: 760, peak: 0.48, round: 0.05, settle: 3 },
  rise: { at: 977, peak: 0.51, round: 0.1, settle: 12 },
}
