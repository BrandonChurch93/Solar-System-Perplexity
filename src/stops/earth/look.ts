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
import shapeJson from './shape.json'

export const globe: GlobeLook = {
  curve: fitted.curve,
  limb,
  drift: motion.drift,
  storm: motion.storm,
  shadow: motion.shadow,
  night: motion.night,
  auroraGate: motion.auroraGate,
  emissivePeak: motion.emissivePeak,
  auroraColor: [0.22, 1, 0.42],
  twinkle: [0.22, 5.5, 900],
  ripple: [0.3, 1.7, 14],
}

export const air: AirLook = airJson

export const shape: number[][] = shapeJson.matrix

export const descent = { high: 0.7, low: 0.05 }

export const moon: MoonLook = moonJson
export const aurora: AuroraLook = auroraJson
