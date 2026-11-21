import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import fit from './fit.json'

export const params: MoveParams = {
  hold: { orbitDeg: 6, axis: [0.25, 1, 0], push: -0.03 },
  spot: { x: 0.405, y: 0.605 },
  dive: { headingDeg: 80, altitude: 0.045, back: 0.08, ahead: 0.15, bow: 0.24, rollDeg: 4, swoop: true, surge: { glide: 0.14, rise: 60, fall: 2, swell: [0.3, 9, 1.2] } },
  terrain: { vfov: 64, horizonDeg: 17.72, dipDeg: 4.44, rollDeg: 17.09, gather: 0.35, forward: 1.05, rise: 0.12, side: -0.24, yawDeg: 3, pitchDeg: -3, entryHeight: 0.5, entryBack: 0.1, entryPitchDeg: 6, exitHeight: 2.6, exitForward: 1.2, exitPitchDeg: 9 },
  rise: { azimuthDeg: 44, elevationDeg: -12, distance: 5.6, offset: [0.34, 0.1], driftSpeed: 0.08, rollDeg: -6, ahead: 0.03, hug: 1.7, settle: 5, level: true, pan: 0.3 },
  travel: { turnDeg: 74, side: 1 },
  arrive: { swingDeg: 46, axis: [0.2, 1, 0], power: 2.9, offset: [0.7, -0.15] },
  skyAim: { terrain: [0, -21.8, 31] },
  light: { exposure: 1, skyExposure: 0.5, terrainSkyGlow: 0.35, sunRadiusDeg: 0.5, sunGlare: 0.75, flare: 0.18 },
  cover: [0.42, 0.34, 0.26],
  coverLow: [0.3, 0.235, 0.17],
  coverTerrain: [0.2, 0.165, 0.13],
  coverLowTerrain: [0.075, 0.064, 0.055],
  coverTop: [0.3, 0.05],
  coverEdge: [0.5, 0.5],
  coverEdgeRise: [0.5, 0.5],
  coverShell: [1.0, 1.015],
  coverRush: { speed: 2.4, reach: 2.5, billow: [2.2, 0.9, 1], streak: [9, 2.2, 1.6], contrast: [0.45, 0.3] },
  spinDegPerSecond: 1.6,
  moonDegPerSecond: 0.9,
  tint: [0.9, 0.75, 0.55],
}

export const plan = new StopPlan('jupiter', fit as Fit, params)
