import type { HazeParams } from '../../bodies/haze'
import type { PlanetLight } from '../../bodies/planet'

export const light: PlanetLight = {
  wrap: 0.12,
  power: 0.8,
  gain: 1.25,
  night: [0.012, 0.011, 0.014],
  sun: [1, 0.97, 0.93],
  relief: 0.02,
  reliefNear: 0.008,
  limb: 0.5,
}

export const haze: HazeParams = {
  scaleHeight: 0.012,
  depth: 0.035,
  day: [1.0, 0.72, 0.5],
  twilight: [0.3, 0.2, 0.26],
  strength: 0.85,
  extinction: 0.8,
  forward: 1.2,
  top: 9,
}

export const moon = {
  gain: 3.2,
  sun: [1, 0.96, 0.9] as [number, number, number],
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
