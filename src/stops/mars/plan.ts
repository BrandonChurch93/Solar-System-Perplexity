import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import fit from './fit.json'

export const params: MoveParams = {
  hold: { orbitDeg: 8, axis: [-0.15, 1, 0], push: -0.04 },
  spot: { x: 0.45, y: 0.54 },
  dive: { headingDeg: -105, altitude: 0.03, back: 0.08, ahead: 0.16, bow: -0.2, rollDeg: -6 },
  terrain: { vfov: 60, forward: 1.5, rise: 0.06, side: -0.15, yawDeg: -2, pitchDeg: 0, entryHeight: 1.02, entryBack: 1.43, entryPitchDeg: 6, exitHeight: 2.2, exitForward: 1.6, exitPitchDeg: 10 },
  rise: { azimuthDeg: 34, elevationDeg: 16, distance: 4.6, offset: [-0.32, -0.08], driftSpeed: 0.08, rollDeg: 5 },
  travel: { turnDeg: 86, side: -1, turnEnd: 0.4 },
  arrive: { swingDeg: -30, axis: [0.3, 1, 0.1] },
  light: { exposure: 1, skyExposure: 0.45, sunRadiusDeg: 1.1, sunGlare: 0.8, flare: 0.3 },
  cover: [0.92, 0.6, 0.4],
  spinDegPerSecond: 0.9,
  moonDegPerSecond: 1.4,
  tint: [0.9, 0.5, 0.3],
}

export const plan = new StopPlan('mars', fit as Fit, params)
