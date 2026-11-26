import type { PallLook } from './pall'

export interface Vortex { px: [number, number]; axes: [number, number]; degPerSecond: number; wispDegPerSecond: number }
export interface Flash { px: [number, number]; sizePx: number; period: number; phase: number; gain: number }

export interface DeckLook {
  skyRimDeg: number
  edgePixels: number
  vortices: Vortex[]
  collar: [number, number, number]
  tone: [number, number, number, number, number]
  toneHigh: [number, number, number]
  settle: number
  wisp: { tile: number; amount: number; shadow: number; shadowLength: number; fine: number; drift: [number, number]; fade: [number, number]; sun: [number, number] }
  haze: { color: [number, number, number]; tile: number; layer: number; height: number; clear: [number, number]; gather: [number, number]; tone: [number, number, number, number] }
  depth: number
  depthBorder: number
  pall: PallLook
  flashes: Flash[]
  flashColor: [number, number, number]
  flashBody: [number, number]
  beyond: [number, number, number]
  detail: [number, number, number, number]
}
