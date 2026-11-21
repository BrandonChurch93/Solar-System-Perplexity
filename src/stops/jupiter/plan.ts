import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import fit from './fit.json'

export const params: MoveParams = {
  hold: { orbitDeg: 6, axis: [0.25, 1, 0], push: -0.03 },
  spot: { x: 0.405, y: 0.605 },
  dive: { headingDeg: 80, altitude: 0.045, back: 0.08, ahead: 0.15, bow: 0.24, rollDeg: 4 },
  terrain: { vfov: 64, horizonDeg: 17.72, dipDeg: 4.44, rollDeg: 17.09, gather: 0.6, forward: 0.74, rise: 0.25, side: 0.09, yawDeg: 2, pitchDeg: 1, entryHeight: 0.8, entryBack: 0.6, entryPitchDeg: 6, exitHeight: 2.6, exitForward: 1.2, exitPitchDeg: 9 },
  rise: { azimuthDeg: -44, elevationDeg: -12, distance: 5.6, offset: [0.34, 0.1], driftSpeed: 0.08, rollDeg: -6 },
  travel: { turnDeg: 74, side: 1 },
  arrive: { swingDeg: 46, axis: [0.2, 1, 0], power: 2.9, offset: [0.7, -0.15] },
  light: { exposure: 1, skyExposure: 0.5, sunRadiusDeg: 0.5, sunGlare: 0.75, flare: 0.18 },
  cover: [0.95, 0.9, 0.8],
  spinDegPerSecond: 1.6,
  moonDegPerSecond: 0.9,
  tint: [0.9, 0.75, 0.55],
}

export const plan = new StopPlan('jupiter', fit as Fit, params)
