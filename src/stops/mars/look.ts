import type { HazeParams } from '../../bodies/haze'
import type { PlanetLight } from '../../bodies/planet'
import fitted from './curve.json'
import hazeJson from './haze.json'
import reliefJson from './relief.json'

const reliefCamera = reliefJson.camera

export const light: PlanetLight = {
  wrap: 0.2,
  power: 1.9,
  gain: 1.25,
  night: fitted.curve[0] as [number, number, number],
  sun: [1, 0.97, 0.93],
  relief: 0.02,
  reliefNear: 0.008,
  limb: 0,
  curve: fitted.curve,
}

export const haze = hazeJson.ground as HazeParams
export const shellHaze = hazeJson.shell as HazeParams
export const haloHaze = hazeJson.halo as HazeParams
export const haloDir = hazeJson.haloDir as [number, number, number]

export const moon = {
  gain: 2.0,
  sun: [1, 0.84, 0.68] as [number, number, number],
  ambient: [0.01, 0.01, 0.012] as [number, number, number],
  bounce: [0.1, 0.045, 0.03] as [number, number, number],
  tumbleDegPerSecond: 0.9,
  bump: 1.8,
  power: 1.25,
  rim: 0.5,
  sunBias: [-0.35, 0.3, 0.02] as [number, number, number],
}

export const storm = { degPerSecond: 1.1 }

export const descent = {
  high: 0.7,
  low: 0.05,
  tint: [0.4, 0.335, 0.28] as [number, number, number],
  hazeDay: [0.4, 0.29, 0.22] as [number, number, number],
  hazeDepth: 1.5,
  shellDay: [0.42, 0.32, 0.26] as [number, number, number],
  shellDepth: 1.6,
  edge: [-0.3, 0.12] as [number, number],
}

export const relief = {
  mistSpeed: 0.004,
  dustSpeed: 0.0022,
  dustDir: [0.92, 0.38] as [number, number],
  mesh: 420,
  air: {
    pitchDeg: -reliefCamera.pitchDeg,
    dipDeg: reliefCamera.horizonDipDeg,
    cool: [0.022, 0.024, 0.027] as [number, number, number],
    coolScaleDeg: 12,
    warm: [0.27, 0.19, 0.14] as [number, number, number],
    warmScaleDeg: 0.95,
    side: [0.55, 1.4] as [number, number],
    starScaleDeg: 1.5,
    starCut: 0.9,
    veil: 0.55,
  },
}
