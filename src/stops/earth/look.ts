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
  twinkle: [0.22, 5.5, 900, 0.7],
  bloomPre: [3, 4, 0.5],
  ripple: [0.3, 1.7, 14],
  dusk: { zone: wrap.dusk, fade: 0.15, centre: wrap.heroCentre },
  away: { tone: [0.032, 0.12, 0.215], land: [0.17, 0.166, 0.16], landAt: [0.4, 1, 0.28, 0.7], flat: [0.1, -0.08], soft: 0, dim: 0.8, gate: [-0.03, -0.16], fine: [0.6, 4, 0.6, 1.2], far: { light: [0.05, 0.3], cap: [-25, 52, 0.4, 22, 38], rim: [0.3, 0.55], gold: [1, 0.72, 0.36], ring: [0.5, 0.66, 0.2], zone: [0.5, 0.62], east: [-38.5, -0.06, 0.05, 0.08, 0.18] } },
}

export const air: AirLook = { ...airJson, lineAway: [2, 0.6], inner: 0.007, innerStrength: 0.35, innerWide: [0.02, 0.6] }

export const away = [0, 0.85]

export const shape: number[][] = shapeJson.matrix

export const descent = { high: 0.7, low: 0.05, air: 0.25, glow: { dive: [0.15, 1.1, 1.15] as [number, number, number], rise: [0.6, 2.4, 2] as [number, number, number] } }

export const moon: MoonLook = moonJson
export const aurora: AuroraLook = { ...auroraJson, tail: [0.78, 0.86], rays: [150, 340, 0.6, 0.9] }

export const ground: GroundLook = { mesh: 480, towerMesh: 640, drift: [-3.2, 0.1], shimmer: [0.3, 220, 1.6, 0], fold: 110, lock: [-0.014, -0.003] }

export const veil = { lead: 0.5, tail: [0.85, 0.5] as [number, number], peak: 0.6, rim: [0.985, 1.003] as [number, number] }
