import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import fit from './fit.json'

export const params: MoveParams = {
  hold: { orbitDeg: 7, axis: [0.2, 1, 0], push: -0.04 },
  spot: { x: 0.565, y: 0.635 },
  dive: { headingDeg: 150, altitude: 0.035, back: 0.06, ahead: 0.12, bow: 0.22, rollDeg: 6 },
  terrain: { vfov: 60, forward: 1.2, rise: 0.05, side: 0.25, yawDeg: 2, pitchDeg: 0, entryHeight: 0.96, entryBack: 1.32, entryPitchDeg: 6, exitHeight: 2.2, exitForward: 1.5, exitPitchDeg: 12 },
  rise: { azimuthDeg: 12, elevationDeg: 14, distance: 4.8, offset: [-0.3, -0.06], driftSpeed: 0.08, rollDeg: 0, ahead: 0.03, hug: 1.7, settle: 5, level: true, pan: 0.3 },
  travel: { turnDeg: 78, side: 1 },
  arrive: { swingDeg: 0, axis: [0, 1, 0], offset: [0.5, -0.1] },
  light: { exposure: 1, skyExposure: 0.25, sunRadiusDeg: 9.2, sunGlare: 0.012, flare: 1 },
  cover: [1.7, 1.35, 0.95],
  spinDegPerSecond: 0.6,
  moonDegPerSecond: 0,
  tint: [0.62, 0.56, 0.5],
}

export const plan = new StopPlan('mercury', fit as Fit, params)
