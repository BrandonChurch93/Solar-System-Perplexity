import fitted from './curve.json'
import type { GlobeLight } from './globe'
import type { LensLook } from './lens'

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
  edge: 1.2,
  rim: { color: [0.0169, 0.0144, 0.0113], width: 0.012, wide: 0.05, wideGain: 1.67 },
}

export const sun = { gain: 1, breathe: 0.03, rate: 1.9 }

export const lens: LensLook = {
  ghost: { at: 0.743, tiltDeg: -15, size: [0.03, 0.0185], core: [0.74, 0.56, 0.44], tail: [0.26, 0.15, 0.08], fringe: [0.05, 0.008, 0.012], halo: [0.02, 0.008, 0.012], haloSize: 0.05 },
  fade: [1.15, 1.7],
}
