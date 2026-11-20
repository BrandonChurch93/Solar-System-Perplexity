import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import fit from './fit.json'

export const params: MoveParams = {
  hold: { orbitDeg: 8, axis: [-0.15, 1, 0], push: -0.04 },
  spot: { x: 0.45, y: 0.54 },
  dive: { headingDeg: -105, altitude: 0.032, back: 0.08, ahead: 0.16, bow: -0.2, rollDeg: -6, swoop: true },
  terrain: { vfov: 60, forward: 0.15, rise: 0.045, side: 0, yawDeg: 0, pitchDeg: 0, entryHeight: 0.25, entryBack: 0.35, entryPitchDeg: -6, entryYawDeg: 0, entryRollDeg: -3, horizonDeg: 18.43, dipDeg: 2.6, exitHeight: 0.4, exitForward: 0.15, exitPitchDeg: 8 },
  rise: { azimuthDeg: 34, elevationDeg: 16, distance: 4.6, offset: [-0.32, -0.08], driftSpeed: 0.08, rollDeg: 5, ahead: 0.03, hug: 1.7 },
  travel: { turnDeg: 86, side: -1, turnEnd: 0.52 },
  arrive: { swingDeg: -30, axis: [0.3, 1, 0.1], offset: [-0.55, -0.2] },
  light: { exposure: 1, skyExposure: 0.5, terrainSkyGlow: 0.25, sunRadiusDeg: 1.1, sunGlare: 0.8, flare: 0.3 },
  cover: [0.92, 0.6, 0.4],
  coverLow: [0.5, 0.26, 0.15],
  spinDegPerSecond: 0.9,
  moonDegPerSecond: 1.4,
  tint: [0.9, 0.5, 0.3],
}

export const plan = new StopPlan('mars', fit as Fit, params)
