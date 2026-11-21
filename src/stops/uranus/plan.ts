import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import fit from './fit.json'

export const params: MoveParams = {
  hold: { orbitDeg: 6, axis: [0.2, 1, 0], push: -0.03 },
  spot: { x: 0.5574, y: 0.6721 },
  dive: { headingDeg: 53.784, altitude: 0.02623, back: 0.07, ahead: 0.14, bow: 0.2, rollDeg: 7, swoop: true },
  terrain: { vfov: 60, forward: 2.0, rise: 0.43, side: 0.15, yawDeg: 1.5, pitchDeg: -0.5, entryHeight: 1.14, entryBack: 1.26, entryPitchDeg: 6, exitHeight: 2.4, exitForward: 1.3, exitPitchDeg: 10, horizonDeg: 2.874, dipDeg: 9.9055, rollDeg: 14.03 },
  rise: { azimuthDeg: -36, elevationDeg: 15, distance: 6.8, offset: [0.3, -0.12], driftSpeed: 0.08, rollDeg: -5, ahead: 0.03, hug: 1.7, settle: 5, level: true, pan: 0.3 },
  travel: { turnDeg: 66, side: 1 },
  arrive: { swingDeg: 0, axis: [0, 1, 0], offset: [-0.5, 0.3] },
  light: { exposure: 1, skyExposure: 0.6, sunRadiusDeg: 0.2, sunGlare: 0.65, flare: 0 },
  cover: [0.2, 0.5, 0.58],
  coverLow: [0.035, 0.15, 0.2],
  coverTerrain: [0.2, 0.58, 0.7],
  coverLowTerrain: [0.02, 0.09, 0.13],
  coverTop: [0.12, 0.06],
  coverEdge: [0.2, 0.45],
  coverEdgeRise: [0.4, 0.45],
  coverShell: [1.04, 1.14],
  coverRush: { speed: 2.4, reach: 2.5, billow: [2.2, 0.9, 1], streak: [9, 2.2, 1.6], contrast: [0.7, 0.55] },
  spinDegPerSecond: -1,
  moonDegPerSecond: 0.6,
  tint: [0.6, 0.9, 0.95],
  skyAim: { orbit: [145.41987, -22.38676, 20.05787], terrain: [22.60603, 20.42393, -46.69144] },
}

export const plan = new StopPlan('uranus', fit as Fit, params)
