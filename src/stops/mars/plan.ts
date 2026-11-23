import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import fit from './fit.json'
import place from './place.json'

export const params: MoveParams = {
  hold: { orbitDeg: -8, axis: [-0.15, 1, 0], push: -0.04 },
  spot: { x: 0.45, y: 0.54 },
  dive: { headingDeg: -105, altitude: 0.032, back: 0.08, ahead: 0.16, bow: -0.2, rollDeg: -6, swoop: true, surge: { glide: 0.14, rise: 60, fall: 2, swell: [0.3, 9, 1.2] } },
  terrain: { vfov: 60, gather: 0.22, forward: 1.65, rise: 0.06, side: 0.3, yawDeg: -2.9, pitchDeg: 0.78, entryHeight: 0.4, entryBack: 0.5, entryPitchDeg: -6, entryYawDeg: -3, entryRollDeg: -3, horizonDeg: 18.43, dipDeg: 2.6, exitHeight: 0.8, exitForward: 0.35, exitPitchDeg: 12 },
  rise: { azimuthDeg: 34, elevationDeg: 16, distance: 4.6, offset: [-0.32, -0.08], driftSpeed: 0.08, rollDeg: 0, ahead: 0.03, hug: 1.7, settle: 5, level: true, pan: 0.3 },
  travel: { turnDeg: 86, side: -1, turnEnd: 0.52 },
  arrive: { swingDeg: -30, axis: [0.3, 1, 0.1], offset: [-0.55, -0.2] },
  light: { exposure: 1, skyExposure: 0.5, terrainSkyGlow: 0.25, skyLow: [0.04, 0.35, 0.3], sunRadiusDeg: 1.1, sunGlare: 0.8, flare: 0.3 },
  cover: [0.55, 0.4, 0.3],
  coverLow: [0.36, 0.17, 0.095],
  coverTerrain: [0.95, 0.62, 0.38],
  coverLowTerrain: [0.085, 0.045, 0.028],
  coverTop: [0.25, 0.04],
  coverEdge: [0.2, 0.4],
  coverEdgeRise: [0.4, 0.45],
  coverShell: [1.04, 1.14],
  coverRush: { speed: 2.4, reach: 2.5, billow: [2.2, 0.9, 1], streak: [9, 2.2, 1.6], contrast: [0.7, 0.55] },
  spinDegPerSecond: 0.9,
  moonDegPerSecond: -1.2,
  tint: [0.9, 0.5, 0.3],
  handover: { dive: { skyFloor: true, place: { valid: place.dive.valid as [number, number, number, number], limbReachDeg: place.dive.limbReachDeg }, path: place.dive.path }, rise: { at: 0.2, placeFrames: 26, skyFloor: true, place: { valid: place.rise.valid as [number, number, number, number], maxEnlarge: place.rise.maxEnlarge, enlargeSoft: place.rise.enlargeSoft, limbReachDeg: place.rise.limbReachDeg } } },
}

export const plan = new StopPlan('mars', fit as Fit, params)
