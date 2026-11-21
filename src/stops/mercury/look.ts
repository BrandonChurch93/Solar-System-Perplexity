import fitted from './curve.json'
import type { GlobeLight } from './globe'

export const light: GlobeLight = {
  curve: fitted.curve,
  night: fitted.curve[0] as [number, number, number],
  wrap: 0.1,
  relief: 0.03,
  reliefNear: 0.012,
  reliefDay: 0.008,
  reliefRange: [0.1, 0.45],
  edge: 1.2,
  rim: { color: [0.065, 0.054, 0.042], width: 0.014, wide: 0.08, wideGain: 0.6, blurLod: 6 },
}
