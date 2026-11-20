import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import fit from './fit.json'

export const params: MoveParams = {
  hold: { orbitDeg: 8, axis: [-0.3, 1, 0], push: -0.03 },
  spot: { x: 0.53, y: 0.46 },
  dive: { headingDeg: -60, altitude: 0.04, back: 0.07, ahead: 0.14, bow: -0.25, rollDeg: -7 },
  terrain: { vfov: 62, forward: 1.4, rise: 0.12, side: -0.2, yawDeg: -3, pitchDeg: 1, entryHeight: 1.2, entryBack: 1.21, entryPitchDeg: 7.2, exitHeight: 2.4, exitForward: 1.2, exitPitchDeg: 10 },
  rise: { azimuthDeg: 42, elevationDeg: -14, distance: 5.4, offset: [-0.3, 0.12], driftSpeed: 0.08, rollDeg: 6 },
  travel: { turnDeg: 92, side: -1, turnEnd: 0.5 },
  arrive: { swingDeg: -24, axis: [1, 0.25, 0], offset: [-0.45, 0.25] },
  light: { exposure: 1, skyExposure: 0.4, sunRadiusDeg: 3, sunGlare: 0.9, flare: 0.6 },
  cover: [1.25, 1.02, 0.62],
  spinDegPerSecond: -0.5,
  moonDegPerSecond: 0,
  tint: [0.95, 0.8, 0.5],
}

export const plan = new StopPlan('venus', fit as Fit, params)
