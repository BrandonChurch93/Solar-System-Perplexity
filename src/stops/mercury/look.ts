import fitted from './curve.json'
import type { GlareLook } from './glare'
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
  nightFlat: 0.2,
  nightDetail: 0.3,
  nightVeil: 0.4,
  nightVeilFrom: 0.75,
  edge: 1.2,
  rim: { color: [0.0169, 0.0144, 0.0113], width: 0.012, wide: 0.05, wideGain: 1.67 },
  glareGate: [0.7, 0.8, 0.06],
  glareLens: [34, 48],
}

export const sun = { gain: 1, breathe: 0.03, rate: 1.9 }

export const lens: LensLook = {
  ghost: { at: 0.743, tiltDeg: -15, size: [0.03, 0.0185], core: [0.74, 0.56, 0.44], tail: [0.26, 0.15, 0.08], fringe: [0.05, 0.008, 0.012], halo: [0.02, 0.008, 0.012], haloSize: 0.05 },
  fade: [1.15, 1.7],
}

export const glare: GlareLook = {
  plateau: 2.5,
  rampOrbit: 14,
  rampTerrain: 18,
  floor: { peak: 60, curve: 6, color: [1, 0.88, 0.7], even: 0.004, orbit: [8, 7], terrain: [8, 7] },
  sun: { peak: 2.2, curve: 12, lead: 0.02, color: [1, 0.84, 0.6], wide: [0.9, 5], core: [0.22, 40], rays: [0.7, 6], turn: 0.9 },
  terrainSun: [745 / 2816, -40 / 1584],
}

export const relief = { mistSpeed: 0, dustSpeed: 0, dustDir: [1, 0] as [number, number], mesh: 640 }
