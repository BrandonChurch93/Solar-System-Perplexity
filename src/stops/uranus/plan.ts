import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import fit from './fit.json'

export const params: MoveParams = {
  hold: { orbitDeg: 6, axis: [0.2, 1, 0], push: -0.03 },
  spot: { x: 0.57, y: 0.33 },
  dive: { headingDeg: 140, altitude: 0.05, back: 0.07, ahead: 0.14, bow: 0.2, rollDeg: 7 },
  terrain: { vfov: 60, forward: 1.3, rise: 0.1, side: 0.2, yawDeg: 2, pitchDeg: -1, entryHeight: 1.14, entryBack: 1.26, entryPitchDeg: 6, exitHeight: 2.4, exitForward: 1.3, exitPitchDeg: 10 },
  rise: { azimuthDeg: -36, elevationDeg: 15, distance: 6.8, offset: [0.3, -0.12], driftSpeed: 0.08, rollDeg: -5 },
  travel: { turnDeg: 90, side: 1 },
  light: { exposure: 1, skyExposure: 0.6, sunRadiusDeg: 0.2, sunGlare: 0.65, flare: 0 },
  cover: [0.72, 0.95, 0.98],
  spinDegPerSecond: -1,
  moonDegPerSecond: 0.6,
  tint: [0.6, 0.9, 0.95],
}

export const plan = new StopPlan('uranus', fit as Fit, params)
