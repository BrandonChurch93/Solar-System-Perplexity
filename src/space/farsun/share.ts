import { params } from '../../stops/mercury/plan'
import look from './look.json'

const smoothstep = (x: number, a: number, b: number): number => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

const forced = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('farsun') : null

export const swapDistance = 1 / Math.sin((params.light.sunRadiusDeg * Math.PI) / 180)

const reach = (span: number[]): number => span[0]! * Math.pow(swapDistance / span[0]!, span[1]!)

export const handoverSpan: [number, number] = [look.handover[0]!, reach(look.handover)]
export const wearSpan: [number, number] = [look.wear[0]!, reach(look.wear)]

export function globeShare(distance: number): number {
  if (forced === 'globe') return 1
  if (forced === 'far') return 0
  return 1 - smoothstep(Math.log(distance), Math.log(handoverSpan[0]), Math.log(handoverSpan[1]))
}

export function wearShare(distance: number): number {
  const x = Math.min(Math.max((distance - wearSpan[0]) / (wearSpan[1] - wearSpan[0]), 0), 1)
  return Math.pow(1 - x, look.wear[2]!)
}

const off = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('farloops') : null
export const loopsOff: number[] = off ? off.split(',').map(Number) : []

export function discShare(radiusPx: number): number {
  return smoothstep(radiusPx, look.disc[0]!, look.disc[1]!)
}
