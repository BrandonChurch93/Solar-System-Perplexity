import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import fit from './fit.json'

export const params: MoveParams = {
  hold: { orbitDeg: 7, axis: [-0.2, 1, 0.1], push: -0.03 },
  spot: { x: 0.41, y: 0.61, on: 'rings' },
  dive: { headingDeg: -35, altitude: 0.03, back: 0.1, ahead: 0.3, bow: -0.12, rollDeg: -4 },
  terrain: { vfov: 56, forward: 1.1, rise: 0.04, side: -0.3, yawDeg: -3, pitchDeg: 0, entryHeight: 0.72, entryBack: 1.1, entryPitchDeg: 3.6, exitHeight: 1.6, exitForward: 1.5, exitPitchDeg: 6 },
  rise: { azimuthDeg: 36, elevationDeg: 22, distance: 6.6, offset: [-0.28, -0.12], driftSpeed: 0.08, rollDeg: 4 },
  travel: { turnDeg: 88, side: -1, turnEnd: 0.5 },
  arrive: { swingDeg: -23.5, axis: [-0.866, 0.216, -0.027], power: 3, from: 0.35, offset: [-0.25, 0.1] },
  light: { exposure: 1, skyExposure: 0.55, sunRadiusDeg: 0.32, sunGlare: 0.7, flare: 0.1 },
  cover: [0.9, 0.82, 0.66],
  spinDegPerSecond: 1.4,
  moonDegPerSecond: 0.3,
  tint: [0.92, 0.82, 0.6],
}

export const plan = new StopPlan('saturn', fit as Fit, params)
