import { params } from '../../stops/mercury/plan'
import look from './look.json'

const smoothstep = (x: number, a: number, b: number): number => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

const forced = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('farsun') : null

export const swapDistance = 1 / Math.sin((params.light.sunRadiusDeg * Math.PI) / 180)

let sunStart: number | null = null

export function sunStartsAt(distance: number): void {
  sunStart = distance
}

export function spans(swap: number, from: number = sunStart ?? look.sunStart): { handover: [number, number]; wear: [number, number] } {
  const at = (share: number): number => Math.min(from * Math.pow(swap / from, share), swap)
  return { handover: [at(look.handover[0]!), at(look.handover[1]!)], wear: [at(look.wear[0]!), at(look.wear[1]!)] }
}

export function globeShare(distance: number): number {
  if (forced === 'globe') return 1
  if (forced === 'far') return 0
  const { handover } = spans(swapDistance)
  return 1 - smoothstep(Math.log(distance), Math.log(handover[0]), Math.log(handover[1]))
}

export function wearShare(distance: number): number {
  const { wear } = spans(swapDistance)
  const x = Math.min(Math.max((distance - wear[0]) / (wear[1] - wear[0]), 0), 1)
  return Math.pow(1 - x, look.wear[2]!)
}

const off = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('farloops') : null
export const loopsOff: number[] = off ? off.split(',').map(Number) : []

export function discShare(radiusPx: number): number {
  return smoothstep(radiusPx, look.disc[0]!, look.disc[1]!)
}
