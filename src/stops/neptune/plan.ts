import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import fit from './fit.json'

export const params: MoveParams = {
  hold: { orbitDeg: 7, axis: [-0.25, 1, 0], push: -0.035 },
  spot: { x: 0.55, y: 0.52 },
  dive: { headingDeg: -70, altitude: 0.048, back: 0.07, ahead: 0.14, bow: -0.22, rollDeg: -5, swoop: true },
  terrain: { vfov: 30, forward: 0.84, rise: 0.31, side: 0.05, yawDeg: -1.5, pitchDeg: 0.6, entryHeight: 1.5, entryBack: 1.4, entryPitchDeg: 3, exitHeight: 2.0, exitForward: 1.2, exitPitchDeg: 8, horizonDeg: 8.22, dipDeg: 12.41, rollDeg: 9.54 },
  rise: { azimuthDeg: 28, elevationDeg: 20, distance: 5.2, offset: [-0.3, 0.1], driftSpeed: 0.1, rollDeg: 4 },
  travel: { turnDeg: 0, side: 1 },
  arrive: { swingDeg: -34, axis: [0.1, 1, 0.2], from: 0.25, offset: [0.5, 0.2] },
  light: { exposure: 1, skyExposure: 0.65, sunRadiusDeg: 0.14, sunGlare: 0.6, flare: 0 },
  skyAim: { orbit: [25.78793, 56.89437, -50.63077], terrain: [69.21908, 138.80252, 8.78195] },
  cover: [0.28, 0.45, 0.95],
  spinDegPerSecond: 1.3,
  moonDegPerSecond: 0.3,
  tint: [0.3, 0.5, 1],
}

export const plan = new StopPlan('neptune', fit as Fit, params)
