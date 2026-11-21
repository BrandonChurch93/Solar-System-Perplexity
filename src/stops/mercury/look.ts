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
  nightDetail: 0.15,
  nightVeil: 0.4,
  nightVeilFrom: 0.75,
  dusk: { from: 1, range: [-0.12, 0, 0.15, 0.35] },
  edge: 1.2,
  rim: { color: [0.0169, 0.0144, 0.0113], width: 0.012, wide: 0.035, wideGain: 2.7 },
  glareGate: [0.7, 0.8, 0.06],
  glareLens: [34, 48],
}

export const sun = { gain: 1, breathe: 0.03, rate: 1.9 }

export const smear = 1

export const lens: LensLook = {
  ghost: { at: 0.7376, turnDeg: 0.585, tiltDeg: -6.3, size: [0.0355, 0.0188], taper: 0.35, edge: [0.3, 1.1], blend: [-0.567, -0.167, -0.167, 0.5], head: [0.62, 0.55, 0.52], core: [0.74, 0.53, 0.33], tail: [0.3, 0.17, 0.1], fringe: [0.05, 0.008, 0.012], halo: [0.02, 0.008, 0.012], haloSize: 0.05 },
  fade: [1.15, 1.7],
}

export const glare: GlareLook = {
  plateau: 2.5,
  sides: {
    dive: { ramp: 22, reach: [3.2, 4.5] },
    enter: { ramp: 24, reach: [3.6, 3.6] },
    leave: { ramp: 24, reach: [3.6, 3.6] },
    rise: { ramp: 23, reach: [3.4, 3.4] },
  },
  floor: { peak: 60, curve: 6, color: [1, 0.88, 0.7], even: 0.004 },
  sun: { peak: 2.2, curve: 12, lead: 0.02, color: [1, 0.84, 0.6], wide: [0.9, 5], core: [0.22, 40], rays: [0.7, 6], turn: 0.9 },
  terrainSun: [745 / 2816, -40 / 1584],
}

export const relief = { mistSpeed: 0, dustSpeed: 0, dustDir: [1, 0] as [number, number], mesh: 640 }
