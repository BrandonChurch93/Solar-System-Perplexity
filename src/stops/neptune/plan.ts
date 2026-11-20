import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import fit from './fit.json'

export const params: MoveParams = {
  hold: { orbitDeg: 7, axis: [-0.25, 1, 0], push: -0.035 },
  spot: { x: 0.55, y: 0.52 },
  dive: { headingDeg: -70, altitude: 0.045, back: 0.07, ahead: 0.14, bow: -0.22, rollDeg: -5 },
  terrain: { vfov: 62, forward: 1.3, rise: 0.08, side: -0.2, yawDeg: -2, pitchDeg: 1, entryHeight: 1.08, entryBack: 1.21, entryPitchDeg: 6, exitHeight: 2.3, exitForward: 1.4, exitPitchDeg: 10 },
  rise: { azimuthDeg: 28, elevationDeg: 20, distance: 5.2, offset: [-0.3, 0.1], driftSpeed: 0.1, rollDeg: 4 },
  travel: { turnDeg: 0, side: 1 },
  arrive: { swingDeg: -34, axis: [0.1, 1, 0.2], from: 0.25 },
  light: { exposure: 1, skyExposure: 0.65, sunRadiusDeg: 0.14, sunGlare: 0.6, flare: 0 },
  cover: [0.28, 0.45, 0.95],
  spinDegPerSecond: 1.3,
  moonDegPerSecond: 0.3,
  tint: [0.3, 0.5, 1],
}

export const plan = new StopPlan('neptune', fit as Fit, params)
