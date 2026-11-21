import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import fit from './fit.json'

export const params: MoveParams = {
  hold: { orbitDeg: 7, axis: [0.2, 1, 0], push: -0.04 },
  spot: { x: 0.523, y: 0.66 },
  dive: { headingDeg: 278, altitude: 0.0162, back: 0.06, ahead: 0.12, bow: 0.2, rollDeg: 6, swoop: true, surge: { glide: 0.14, rise: 60, fall: 2, swell: [0.3, 9, 1.2] } },
  terrain: { vfov: 60, gather: 0.2, forward: 0.5, rise: 0.05, side: -0.1, yawDeg: 3, pitchDeg: 0.5, entryHeight: 0.25, entryBack: 0.25, entryPitchDeg: -4, horizonDeg: 19.8, dipDeg: 10.25, rollDeg: 11.27, exitHeight: 0.5, exitForward: 0.25, exitPitchDeg: 10 },
  rise: { azimuthDeg: 12, elevationDeg: 14, distance: 4.8, offset: [-0.3, -0.06], driftSpeed: 0.08, rollDeg: 0, ahead: 0.03, hug: 1.7, settle: 5, level: true, pan: 0.3 },
  travel: { turnDeg: 78, side: 1 },
  arrive: { swingDeg: 0, axis: [0, 1, 0], offset: [0.5, -0.1] },
  light: { exposure: 1, skyExposure: 0.25, sunRadiusDeg: 9.2, sunGlare: 0.012, flare: 1 },
  cover: [1.7, 1.35, 0.95],
  skyAim: { orbit: [77.38414, 172.96308, -53.87859], terrain: [12.8819, -127.45635, -55] },
  spinDegPerSecond: 0.6,
  moonDegPerSecond: 0,
  tint: [0.62, 0.56, 0.5],
}

export const plan = new StopPlan('mercury', fit as Fit, params)
