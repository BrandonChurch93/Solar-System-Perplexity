import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import fit from './fit.json'

export const params: MoveParams = {
  hold: { orbitDeg: 7, axis: [0.1, 1, 0], push: -0.035 },
  spot: { x: 0.51, y: 0.42 },
  dive: { headingDeg: 95, altitude: 0.03, back: 0.06, ahead: 0.12, bow: 0.2, rollDeg: 5 },
  terrain: { vfov: 58, forward: 1.3, rise: 0.1, side: 0.2, yawDeg: 3, pitchDeg: -1, entryHeight: 1.08, entryBack: 1.21, entryPitchDeg: 5.4, exitHeight: 2.3, exitForward: 1.4, exitPitchDeg: 11 },
  rise: { azimuthDeg: -16, elevationDeg: 24, distance: 5.3, offset: [0.3, 0.15], driftSpeed: 0.08, rollDeg: -4 },
  travel: { turnDeg: 70, side: 1, turnEnd: 0.42 },
  arrive: { swingDeg: 20, axis: [0.15, 1, 0], from: 0.2 },
  light: { exposure: 1, skyExposure: 0.42, sunRadiusDeg: 1.8, sunGlare: 0.85, flare: 0.45 },
  cover: [0.95, 0.98, 1.02],
  spinDegPerSecond: 1.1,
  moonDegPerSecond: 0.5,
  tint: [0.55, 0.7, 1],
}

export const plan = new StopPlan('earth', fit as Fit, params)
