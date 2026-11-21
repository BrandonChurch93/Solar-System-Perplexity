import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import fit from './fit.json'

export const params: MoveParams = {
  hold: { orbitDeg: 7, axis: [0.1, 1, 0], push: -0.035 },
  spot: { x: 0.52, y: 0.46 },
  dive: { headingDeg: 52.25, altitude: 0.030751, back: 0.06, ahead: 0.12, bow: 0.2, rollDeg: 5, swoop: true, surge: { glide: 0.14, rise: 60, fall: 2, swell: [0.3, 9, 1.2] } },
  terrain: { vfov: 45, gather: 0.8, forward: 0.44, rise: 0.237, side: -0.008, yawDeg: 0, pitchDeg: 0, entryHeight: 0.3, entryBack: 0.3, entryPitchDeg: 0, exitHeight: 2.3, exitForward: 1.4, exitPitchDeg: 11, horizonDeg: 14.3175, dipDeg: 14.0305, rollDeg: -2.0044 },
  rise: { azimuthDeg: 10, elevationDeg: 8, distance: 5.3, offset: [0.3, 0.15], driftSpeed: 0.08, rollDeg: -4, ahead: 0.03, hug: 1.7, settle: 5, level: true, pan: 0.3 },
  travel: { turnDeg: 70, side: 1, turnEnd: 0.42 },
  arrive: { swingDeg: 20, axis: [0.15, 1, 0], from: 0.2, offset: [0.4, 0.3] },
  light: { exposure: 1, skyExposure: 0.42, sunRadiusDeg: 1.8, sunGlare: 0.85, flare: 0.45, sunDir: [-0.692237, 0.508, 0.512586] },
  cover: [0.95, 0.98, 1.02],
  spinDegPerSecond: 1.1,
  moonDegPerSecond: 0.5,
  tint: [0.55, 0.7, 1],
  skyAim: { orbit: [135.4027, 1.14981, 28.88925], terrain: [36.77227, -52.29257, 2.15534] },
}

export const plan = new StopPlan('earth', fit as Fit, params)
