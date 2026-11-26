import type { HazeParams } from '../../bodies/haze'
import type { GrazingHaze, PlanetLight } from '../../bodies/planet'
import fitted from './curve.json'
import hazeJson from './haze.json'
import reliefJson from './relief.json'

const reliefCamera = reliefJson.camera
const { obliqueDetail, ...grazingHaze } = hazeJson.grazing

export { obliqueDetail }

export const light: PlanetLight = {
  wrap: 0.2,
  power: 1.9,
  gain: 1.25,
  night: fitted.curve[0] as [number, number, number],
  sun: [1, 0.97, 0.93],
  relief: 0.02,
  reliefNear: 0.008,
  limb: 0,
  curve: fitted.curve,
  nightFlat: [0.06, -0.3, 0.1],
}

export const haze = hazeJson.ground as HazeParams
export const grazing = grazingHaze as GrazingHaze & { highlightDir: [number, number, number]; sideDir: [number, number, number] }
export const shellHaze = hazeJson.shell as HazeParams
export const shellDir = hazeJson.shellDir as [number, number, number]
export const haloHaze = hazeJson.halo as HazeParams
export const haloDir = hazeJson.haloDir as [number, number, number]
export const haloCoreDir = hazeJson.haloCoreDir as [number, number, number]
export const glintHaze = hazeJson.glint as HazeParams
export const glintDir = hazeJson.glintDir as [number, number, number]
export const glintCoreDir = hazeJson.glintCoreDir as [number, number, number]

export const moon = {
  gain: 2.0,
  sun: [1, 0.84, 0.68] as [number, number, number],
  ambient: [0.01, 0.01, 0.012] as [number, number, number],
  bounce: [0.1, 0.045, 0.03] as [number, number, number],
  tumbleDegPerSecond: 0.9,
  bump: 1.8,
  power: 1.25,
  rim: 0.5,
  sunBias: [-0.35, 0.3, 0.02] as [number, number, number],
}

export const storm = { degPerSecond: 1.1 }

export const descent = {
  high: 0.7,
  low: 0.05,
  // One ground under one air (MAIL 1383, 1401): above near.high (near.json) the air of the globe is the hold's and the grade is the
  // hold's, 1. This tint comes in with the near blend from there down and lies on the ground and on the air's light alike. high and
  // low here key only the hold's grazing veil, its detail blur, the vignette and the halo. The tint's value is the one at which
  // the lit map is drawn as the land plates are where both show the same ground (asdrawn.py, the common part: 0.4, 0.335, 0.28 times
  // 1.2047, 1.4879, 1.5352).
  tint: [0.4819, 0.4984, 0.4299] as [number, number, number],
}

export const relief = {
  apron: { ...reliefJson.apron, fullWidth: reliefJson.imageSize.full[0] as number },
  ridge: reliefJson.ridge,
  mistSpeed: 0.004,
  dustSpeed: 0.0022,
  dustDir: [0.92, 0.38] as [number, number],
  mesh: 420,
  pitchDeg: -reliefCamera.pitchDeg,
  valley: {
    top: -2.0,
    soft: 0.7,
    strength: 0.4,
    color: [0.2, 0.135, 0.095] as [number, number, number],
    wind: [0.8, -0.6] as [number, number],
    speed: 0.3,
    scale: 1.1,
    stretch: 2.2,
    churn: 0.06,
    mask: [0.35, 1.2] as [number, number],
    cut: [0.38, 0.75] as [number, number],
  },
  air: {
    pitchDeg: -reliefCamera.pitchDeg,
    dipDeg: reliefCamera.horizonDipDeg,
    cool: [0.022, 0.024, 0.027] as [number, number, number],
    coolScaleDeg: 12,
    warm: [0.27, 0.19, 0.14] as [number, number, number],
    warmScaleDeg: 0.95,
    side: [0.55, 1.4] as [number, number],
    warmSide: [0.15, 1.1, 0.05, 0.85] as [number, number, number, number],
    starScaleDeg: 1.5,
    starCut: 0.9,
    veil: 0.55,
    drift: [0.2, 16, 0.1, 70] as [number, number, number, number],
  },
}
