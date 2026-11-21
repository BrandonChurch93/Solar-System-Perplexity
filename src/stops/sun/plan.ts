import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import fit from './fit.json'

export const params: MoveParams = {
  hold: { orbitDeg: 6, axis: [0, 1, 0], push: -0.03 },
  spot: { x: 0.54, y: 0.39 },
  dive: { headingDeg: 20, altitude: 0.05, back: 0.05, ahead: 0.12, bow: 0.15, rollDeg: 0 },
  terrain: { vfov: 55, gather: -0.5, forward: 2.0, rise: -0.1, side: 0.7, yawDeg: 8, pitchDeg: 8, horizonDeg: 3.2, dipDeg: 17.5, entryHeight: 0.9, entryBack: 1.1, entryPitchDeg: 4.8, exitHeight: 1.6, exitForward: -0.6, exitPitchDeg: -12 },
  rise: { azimuthDeg: 0, elevationDeg: 0, distance: 4.6, offset: [0, 0], driftSpeed: 0.05, rollDeg: 0 },
  travel: { turnDeg: 26, side: 1 },
  light: { exposure: 1, skyExposure: 0.45, sunRadiusDeg: 5, sunGlare: 1, flare: 0.35 },
  cover: [2.4, 1.55, 0.55],
  spinDegPerSecond: 0.5,
  moonDegPerSecond: 0,
  tint: [1, 0.8, 0.4],
  skyAim: { orbit: [48.4075, -125.38185, -38.46336], terrain: [8.48669, -141.8932, 32.09218] },
}

export const plan = new StopPlan('sun', fit as Fit, params)
