import type { HazeParams } from '../../bodies/haze'
import type { PlanetLight } from '../../bodies/planet'
import fitted from './curve.json'

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

export const haze: HazeParams = {
  scaleHeight: 0.006,
  depth: 0.03,
  day: [0.6, 0.78, 1.0],
  twilight: [0.16, 0.26, 0.5],
  strength: 0.55,
  extinction: 0.6,
  forward: 1.2,
  top: 10,
}

export const moon = {
  gain: 1.7,
  sun: [1, 0.9, 0.78] as [number, number, number],
  ambient: [0.01, 0.01, 0.012] as [number, number, number],
  bounce: [0.05, 0.03, 0.022] as [number, number, number],
  tumbleDegPerSecond: 0.9,
}

export const storm = { degPerSecond: 1.1 }

export const relief = {
  mistSpeed: 0.004,
  dustSpeed: 0.0022,
  dustDir: [0.92, 0.38] as [number, number],
  mesh: 420,
}
