import type { AirLook } from './air'
import airJson from './air.json'
import fitted from './curve.json'
import type { GlobeLook } from './globe'
import limb from './limb.json'
import type { AuroraLook } from './aurora'
import auroraJson from './aurora.json'
import type { MoonLook } from './moon'
import moonJson from './moon.json'
import motion from './motion.json'
import type { GroundLook } from './relief'
import shapeJson from './shape.json'
import trim from './trim.json'
import wrap from './wrap.json'

export const globe: GlobeLook = {
  curve: fitted.curve.map((c, i) => c.map((v, j) => v * trim.curve[i]![j]!)),
  limb,
  drift: motion.drift,
  storm: motion.storm,
  shadow: motion.shadow,
  night: motion.night,
  auroraGate: motion.auroraGate,
  emissivePeak: motion.emissivePeak,
  auroraColor: [0.22, 1, 0.42],
  auroraKeep: [0.5, 0.62],
  calm: [1.02, -33, 8, 7, -38, -35, 11, -9, 14, 13],
  bed: [-20, 46, 30, 0.25, 0.5],
  twilight: [0.3, 0.06, -0.1, 0.02, 0.07],
  twinkle: [0.22, 5.5, 900, 1.0],
  bloomPre: [3, 4, 0.5],
  ripple: [0.3, 1.7, 14],
  dusk: { zone: wrap.dusk, fade: 0.15, centre: wrap.heroCentre },
  away: { tone: [0.032, 0.12, 0.215], land: [0.17, 0.166, 0.16], landAt: [0.4, 1, 0.085, 0.5], landClamp: [0.6, 1.25], flat: [0.1, -0.08], soft: 0, dim: 0.8, gate: [-0.03, -0.16], fine: [0.6, 4, 0.6, 1.2], far: { light: [0.05, 0.3], cap: [-25, 52, 0.4, 22, 38], rim: [0.3, 0.55], gold: [1, 0.72, 0.36], ring: [0.5, 0.66, 0.2], zone: [0.5, 0.62], east: [-38.5, -0.06, 0.05, 0.08, 0.18] } },
}

export const air: AirLook = { ...airJson, lineAway: [2, 0.6], inner: 0.007, innerStrength: 0.35, innerWide: [0.02, 0.6], nightLine: [1.455, 0.5], nightGlow: [0.007, 0.015, 0.022, 0.016], nightAt: [-0.006, 0.012], nightSide: [0.2, 0.4], lineEnd: [0.44, 0.53] }

export const away = [0, 0.85]
export const onset = [-0.1334, 1.2, 0.6]
export const ebb = [0, 0.3]
export const back = [1.03, 1.35]
export const lights = [0.025, 0.065, 0.9]
export const lightsFrom = [0.2, 0.9]

export const shape: number[][] = shapeJson.matrix

export const descent = { high: 0.7, low: 0.05, place: [3.2, 1.4] as [number, number], air: 0.19, inner: 0.06, line: [0.1, 1] as [number, number], fog: [0, 0, 0] as [number, number, number], rim: [0.1, 0.37, 0.62] as [number, number, number], haze: { width: 0.05, pale: [0.84, 0.87, 0.89] as [number, number, number] }, mist: [0, 0, 0, 0.00055] as [number, number, number, number], glow: [0.11, 0.83, 0.86] as [number, number, number] }

export const moon: MoonLook = { ...moonJson, lift: 1.02, round: 0.6, edge: 1.7, near: 0.1 }
export const aurora: AuroraLook = { ...auroraJson, wave: [0.24, 17, 2.1], tail: [0.78, 0.86], day: [0.02, 0.38] }

export const ground: GroundLook = { mesh: 480, towerMesh: 640, drift: [-3.2, 0.1], shimmer: [0.3, 220, 1.6, 0], fold: 110, lock: [-0.014, -0.003], bloom: 1, plain: [1, 5] }

